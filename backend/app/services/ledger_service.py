from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from sqlalchemy import insert, select, update
from typing import Optional

from app.services.database_service import _engine, financial_ledger_table

class LedgerService:
    @staticmethod
    def _generate_hash(data: str) -> str:
        return hashlib.sha256(data.encode('utf-8')).hexdigest()

    @staticmethod
    def create_transaction(
        entity_type: str,
        entity_id: str,
        transaction_type: str,
        amount: float,
        currency: str = "USD",
        exchange_rate: float = 1.0
    ) -> dict:
        timestamp = datetime.now(timezone.utc)
        base_amount_inr = amount * exchange_rate
        
        # In a real blockchain system, we'd fetch the previous hash and chain it.
        previous_ledger_hash = "GENESIS_HASH"
        
        # Creating a seal for the transaction
        raw_data = f"{entity_type}:{entity_id}:{transaction_type}:{amount}:{currency}:{timestamp.isoformat()}"
        seal_hash = LedgerService._generate_hash(raw_data)
        ledger_hash = LedgerService._generate_hash(f"{previous_ledger_hash}:{seal_hash}")

        with _engine().begin() as conn:
            result = conn.execute(
                insert(financial_ledger_table).values(
                    entity_type=entity_type,
                    entity_id=entity_id,
                    transaction_type=transaction_type,
                    amount=amount,
                    currency=currency,
                    exchange_rate=exchange_rate,
                    base_amount_inr=base_amount_inr,
                    seal_hash=seal_hash,
                    ledger_hash=ledger_hash,
                    previous_ledger_hash=previous_ledger_hash,
                    created_at=timestamp
                )
            )
            inserted_id = result.inserted_primary_key[0]
            
        return {
            "id": inserted_id,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "transaction_type": transaction_type,
            "amount": amount,
            "currency": currency,
            "seal_hash": seal_hash,
            "ledger_hash": ledger_hash,
            "status": "VERIFIED"
        }

    @staticmethod
    def verify_transaction(transaction_id: int) -> bool:
        with _engine().connect() as conn:
            row = conn.execute(
                select(financial_ledger_table).where(financial_ledger_table.c.id == transaction_id)
            ).first()
            
            if not row:
                return False
                
            raw_data = f"{row.entity_type}:{row.entity_id}:{row.transaction_type}:{row.amount}:{row.currency}:{row.created_at.isoformat()}"
            recalculated_seal = LedgerService._generate_hash(raw_data)
            
            return recalculated_seal == row.seal_hash

ledger_service = LedgerService()
