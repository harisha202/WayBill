import React, { useState, useRef } from 'react';
import { useApi } from '../../api/hooks/useApi';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export function AdminSettings() {
  const quotaApi = useApi('/ai/rag-quota');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await axiosInstance.post('/ai/document/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message || 'Document uploaded successfully');
      quotaApi.refetch();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const quota = quotaApi.data || { pages_used: 0, page_limit: 200, month: 'Loading...' };
  const percentage = Math.min(100, Math.max(0, (quota.pages_used / quota.page_limit) * 100));

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Admin Settings</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>System configuration and RAG Assistant management</p>
      </header>

      <section style={{ background: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#0f172a' }}>RAG Document Quota (PDF / Excel / DOC)</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Monitor and upload external business documents for the AI Assistant. You are limited to 200 pages per month.
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
            <span>Month: {quota.month}</span>
            <span>{quota.pages_used} / {quota.page_limit} Pages Used</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${percentage}%`, height: '100%', background: percentage > 90 ? '#ef4444' : '#3b82f6', transition: 'width 0.3s ease' }} />
          </div>
        </div>

        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 'bold'
            }}
          >
            {uploading ? 'Processing...' : 'Upload Document'}
          </button>
        </div>
      </section>

      <section style={{ background: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#0f172a' }}>System Preferences</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" defaultChecked /> Require 2FA for Admin login
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" defaultChecked /> Email alerts for critical anomalies
          </label>
        </div>
      </section>
    </div>
  );
}
