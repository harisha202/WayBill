from __future__ import annotations

import csv
import hashlib
import io
import json
import logging
import math
import os
import re
import uuid
from typing import Any, List, Optional, Tuple

from app.services.database_service import (
    create_rag_document,
    delete_rag_document,
    get_rag_chunks_for_search,
    list_rag_documents,
    save_rag_chunks,
    update_rag_document_status,
)

logger = logging.getLogger(__name__)

# Fallback embedding dimension
VECTOR_DIM = 64


def _compute_checksum(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _generate_embedding(text: str) -> list[float]:
    """
    Generate normalized dense vector embedding for text chunk.
    Uses a deterministic, semantic term-frequency & n-gram hashing projection.
    """
    cleaned = re.sub(r"[^\w\s]", " ", text.lower())
    words = cleaned.split()
    if not words:
        return [0.0] * VECTOR_DIM

    vector = [0.0] * VECTOR_DIM
    for i, word in enumerate(words):
        # Hash word into vector dimensions
        h1 = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16) % VECTOR_DIM
        h2 = int(hashlib.sha1(word.encode("utf-8")).hexdigest(), 16) % VECTOR_DIM
        weight = 1.0 + math.log(1.0 + len(word))
        vector[h1] += weight
        vector[h2] += weight * 0.5
        
        # Word bigrams for local semantic context
        if i < len(words) - 1:
            bigram = f"{word}_{words[i+1]}"
            hb = int(hashlib.md5(bigram.encode("utf-8")).hexdigest(), 16) % VECTOR_DIM
            vector[hb] += 1.5

    # Normalize vector to unit length
    magnitude = math.sqrt(sum(x * x for x in vector))
    if magnitude > 0:
        vector = [x / magnitude for x in vector]
    return vector


def _cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    return sum(a * b for a, b in zip(vec1, vec2))


class RAGService:
    @staticmethod
    def extract_text(filename: str, content: bytes, content_type: str = "") -> list[dict]:
        """
        Extract pages/sections from uploaded document.
        Returns a list of dicts: [{"page_number": int, "text": str}]
        """
        lower_name = filename.lower()
        extracted_pages: list[dict] = []

        # 1. PDF Documents
        if lower_name.endswith(".pdf") or "pdf" in content_type.lower():
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(content))
                num_pages = len(reader.pages)
                for page_idx in range(num_pages):
                    page_text = reader.pages[page_idx].extract_text() or ""
                    if page_text.strip():
                        extracted_pages.append({
                            "page_number": page_idx + 1,
                            "text": page_text.strip()
                        })
                if not extracted_pages:
                    extracted_pages.append({"page_number": 1, "text": "[Empty PDF document]"})
            except Exception as e:
                logger.warning(f"pypdf extraction failed for {filename}: {e}. Falling back to raw stream decoding.")
                raw_text = content.decode("utf-8", errors="ignore")
                extracted_pages.append({"page_number": 1, "text": raw_text.strip() or "[PDF text unparseable]"})

        # 2. CSV Documents
        elif lower_name.endswith(".csv") or "csv" in content_type.lower():
            try:
                text_stream = io.StringIO(content.decode("utf-8", errors="ignore"))
                reader = csv.reader(text_stream)
                rows = list(reader)
                if rows:
                    header = rows[0]
                    formatted_lines = [f"Table columns: {', '.join(header)}"]
                    for idx, row in enumerate(rows[1:], start=1):
                        formatted_lines.append(f"Row {idx}: " + ", ".join(f"{header[c] if c < len(header) else f'col_{c}'}={val}" for c, val in enumerate(row)))
                    extracted_pages.append({"page_number": 1, "text": "\n".join(formatted_lines)})
                else:
                    extracted_pages.append({"page_number": 1, "text": "[Empty CSV file]"})
            except Exception as e:
                logger.error(f"CSV parsing error: {e}")
                extracted_pages.append({"page_number": 1, "text": content.decode("utf-8", errors="ignore")})

        # 3. JSON Documents
        elif lower_name.endswith(".json") or "json" in content_type.lower():
            try:
                parsed_json = json.loads(content.decode("utf-8", errors="ignore"))
                formatted_text = json.dumps(parsed_json, indent=2)
                extracted_pages.append({"page_number": 1, "text": formatted_text})
            except Exception:
                extracted_pages.append({"page_number": 1, "text": content.decode("utf-8", errors="ignore")})

        # 4. Text, Markdown, and other plain formats
        else:
            raw_text = content.decode("utf-8", errors="ignore")
            parts = [p.strip() for p in re.split(r"\f|\n{3,}", raw_text) if p.strip()]
            if not parts:
                parts = [raw_text.strip() or "[Empty file]"]
            for idx, part in enumerate(parts, start=1):
                extracted_pages.append({"page_number": idx, "text": part})

        return extracted_pages

    @staticmethod
    def chunk_document(
        document_id: str,
        pages: list[dict],
        chunk_size: int = 600,
        chunk_overlap: int = 100
    ) -> list[dict]:
        """
        Splits extracted pages into overlapping chunks with metadata.
        """
        chunks: list[dict] = []
        global_chunk_idx = 0

        for page in pages:
            page_num = page.get("page_number", 1)
            page_text = page.get("text", "")
            
            paragraphs = [p.strip() for p in page_text.split("\n\n") if p.strip()]
            if not paragraphs:
                paragraphs = [page_text]

            current_chunk = ""
            for p in paragraphs:
                if len(current_chunk) + len(p) <= chunk_size:
                    current_chunk = f"{current_chunk}\n\n{p}".strip()
                else:
                    if current_chunk:
                        embedding = _generate_embedding(current_chunk)
                        chunks.append({
                            "document_id": document_id,
                            "chunk_index": global_chunk_idx,
                            "page_number": page_num,
                            "chunk_text": current_chunk,
                            "chunk_metadata": {"char_count": len(current_chunk)},
                            "embedding": embedding,
                        })
                        global_chunk_idx += 1
                    
                    if len(current_chunk) > chunk_overlap:
                        current_chunk = current_chunk[-chunk_overlap:] + "\n" + p
                    else:
                        current_chunk = p

            if current_chunk:
                embedding = _generate_embedding(current_chunk)
                chunks.append({
                    "document_id": document_id,
                    "chunk_index": global_chunk_idx,
                    "page_number": page_num,
                    "chunk_text": current_chunk,
                    "chunk_metadata": {"char_count": len(current_chunk)},
                    "embedding": embedding,
                })
                global_chunk_idx += 1

        return chunks

    def process_and_store_document(
        self,
        filename: str,
        content: bytes,
        content_type: str = "",
        uploader_id: str | None = None,
        uploader_role: str | None = None,
        uploader_company: str | None = None,
    ) -> dict:
        doc_id = f"doc-{uuid.uuid4().hex[:12]}"
        checksum = _compute_checksum(content)
        file_size = len(content)

        doc_record = create_rag_document(
            document_id=doc_id,
            filename=filename,
            content_type=content_type or "application/octet-stream",
            file_size=file_size,
            page_count=1,
            checksum=checksum,
            uploader_id=uploader_id,
            uploader_role=uploader_role,
            uploader_company=uploader_company,
            status="PROCESSING"
        )

        try:
            pages = self.extract_text(filename, content, content_type)
            page_count = len(pages)
            chunks = self.chunk_document(doc_id, pages)
            save_rag_chunks(chunks)

            update_rag_document_status(doc_id, status="READY", page_count=page_count)
            doc_record["status"] = "READY"
            doc_record["page_count"] = page_count
            doc_record["chunk_count"] = len(chunks)
            logger.info(f"RAG document {filename} ({doc_id}) indexed successfully with {len(chunks)} chunks across {page_count} pages.")
            return doc_record

        except Exception as e:
            logger.error(f"Failed to process RAG document {filename} ({doc_id}): {e}", exc_info=True)
            update_rag_document_status(doc_id, status="FAILED", error_message=str(e))
            doc_record["status"] = "FAILED"
            doc_record["error_message"] = str(e)
            return doc_record

    def search_relevant_context(
        self,
        query: str,
        uploader_company: str | None = None,
        top_k: int = 5,
        min_similarity: float = 0.15,
    ) -> list[dict]:
        query_vec = _generate_embedding(query)
        all_chunks = get_rag_chunks_for_search(uploader_company=uploader_company)
        if not all_chunks:
            return []

        scored_chunks: list[Tuple[float, dict]] = []
        for chunk in all_chunks:
            embedding = chunk.get("embedding")
            if not embedding or not isinstance(embedding, list):
                continue
            sim = _cosine_similarity(query_vec, embedding)
            if sim >= min_similarity:
                chunk_copy = dict(chunk)
                chunk_copy["similarity"] = round(sim, 4)
                chunk_copy["citation"] = f"[Doc: {chunk.get('filename', 'Document')}, Page {chunk.get('page_number', 1)}, Chunk {chunk.get('chunk_index', 0)}]"
                scored_chunks.append((sim, chunk_copy))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        return [c for _, c in scored_chunks[:top_k]]

    def build_grounded_rag_context(
        self,
        query: str,
        uploader_company: str | None = None,
        top_k: int = 4,
    ) -> Tuple[str, list[str]]:
        relevant_chunks = self.search_relevant_context(query, uploader_company=uploader_company, top_k=top_k)
        if not relevant_chunks:
            return "", []

        context_blocks = []
        citations = []
        for c in relevant_chunks:
            citation_tag = c["citation"]
            citations.append(citation_tag)
            context_blocks.append(
                f"--- SOURCE DOCUMENT: {c.get('filename')} (Page {c.get('page_number')}) ---\n"
                f"{c.get('chunk_text')}\n"
                f"--- END SOURCE ---"
            )

        context_str = "\n\n".join(context_blocks)
        return context_str, citations


rag_service = RAGService()
