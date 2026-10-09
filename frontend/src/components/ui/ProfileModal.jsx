import React, { useState, useEffect } from 'react';
import { useAuthStore, getAuthToken } from '../../store/useAuthStore';
import { Logo } from './Logo';

const ROLE_DETAILS = {
  admin: {
    title: 'System Administrator',
    badgeBg: 'rgba(0, 255, 247, 0.15)',
    badgeBorder: '#00fff7',
    badgeColor: '#0891b2',
    iconType: 'logo',
    icon: null,
    description: 'Central platform administrator with full governance access across all enterprise nodes.',
    responsibilities: [
      'Global Supply Chain Control Tower & Real-time Telemetry',
      'AI Risk Analytics, Demand Forecasting & Network Anomaly Detection',
      'Immutable Cryptographic Ledger & Custody Audit Trail',
      'Enterprise User Management, Role RBAC & Access Controls',
    ],
  },
  manufacturer: {
    title: 'Manufacturer Hub',
    badgeBg: 'rgba(234, 179, 8, 0.15)',
    badgeBorder: '#eab308',
    badgeColor: '#ca8a04',
    iconType: 'emoji',
    icon: '🏭',
    description: 'Industrial manufacturing facility responsible for production batches and quality sealing.',
    responsibilities: [
      'Production Order Creation & Batch Lifecycle Scheduling',
      'Quality Assurance (QA) Inspection & Cryptographic Sealing',
      'Raw Material Supplier Sourcing & Tier-1/Tier-2 Risk Scoring',
      'Waybill Document Generation & Transporter Custody Handover',
    ],
  },
  transporter: {
    title: 'Transporter / Fleet Operator',
    badgeBg: 'rgba(34, 197, 94, 0.15)',
    badgeBorder: '#22c55e',
    badgeColor: '#16a34a',
    iconType: 'emoji',
    icon: '🚚',
    description: 'Logistics and freight provider executing multi-modal shipment delivery and GPS telemetry.',
    responsibilities: [
      'Fleet Dispatch & Real-time Live GPS Tracking Updates',
      'Waybill Custody Transfer & Electronic Proof of Handover',
      'Route Optimization, Geo-Fencing & ETA Delay Telemetry',
      'Cargo Weight & Temperature Compliance Monitoring',
    ],
  },
  dealer: {
    title: 'Regional Dealer Hub',
    badgeBg: 'rgba(249, 115, 22, 0.15)',
    badgeBorder: '#f97316',
    badgeColor: '#ea580c',
    iconType: 'emoji',
    icon: '🏢',
    description: 'Regional distribution center managing bulk inventory and retail fulfillment pipelines.',
    responsibilities: [
      'Regional Inventory Balancing & Safety Stock Management',
      'Retail Order Ingestion, Confirmation & Direct Fulfillment',
      'Automated Reorder Point Intelligence & Manufacturer Restock',
      'Dealer Dispute Resolution & Custody Acceptance',
    ],
  },
  retail_shop: {
    title: 'Retail Store / Dealer Point',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeBorder: '#a855f7',
    badgeColor: '#9333ea',
    iconType: 'emoji',
    icon: '🏪',
    description: 'Point-of-sale retail outlet serving end consumers and performing final waybill receipts.',
    responsibilities: [
      'Direct-to-Store Shipment Receiving & Inspection',
      'Cryptographic Seal Verification & Anti-Counterfeit Scanning',
      'Store-Level Stock Management & POS Sales Analytics',
      'Dispute Escalation & Damage Claim Filing',
    ],
  },
};

export default function ProfileModal({ isOpen, onClose }) {
  const auth = useAuthStore();
  const user = auth?.user || {};
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch live server profile data whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const fetchLatestProfile = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        if (!token) return;
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setProfileData(data);
        }
      } catch {
        // Fall back to current auth store
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLatestProfile();
    return () => { isMounted = false; };
  }, [isOpen]);

  const activeUser = profileData || user || {};
  const rawRole = String(activeUser?.role || auth?.role || user?.role || 'admin').toLowerCase().replace(/\s+/g, '_');
  
  const roleConfig = ROLE_DETAILS[rawRole] || ROLE_DETAILS.admin;
  const companyName = activeUser?.company_name || activeUser?.company || user?.company_name || user?.company || 'Global Supply Corp';
  const email = activeUser?.email || user?.email || `${rawRole}@globalsupply.com`;
  const username = activeUser?.username || user?.username || rawRole || 'user';
  const displayName = activeUser?.name || user?.name || user?.full_name || roleConfig.title;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface, #1e293b)',
          border: '1px solid var(--border, #334155)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(37, 99, 235, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--text, #f8fafc)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border, #334155)',
            background: 'var(--bg, #0f172a)',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Logo style={{ width: 32, height: 32, flexShrink: 0 }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text, #f8fafc)' }}>
                User Profile & Account Info
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted, #94a3b8)' }}>
                {loading ? 'Refreshing account details...' : 'Authenticated Node Details'}
              </p>
            </div>
          </div>

          {/* Close 'X' Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(148, 163, 184, 0.1)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text, #f8fafc)',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Close Profile"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ef4444';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
              e.currentTarget.style.color = 'var(--text, #f8fafc)';
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* User Hero Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.1rem',
              background: 'var(--bg, #0f172a)',
              borderRadius: '12px',
              border: `1px solid ${roleConfig.badgeBorder}40`,
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: roleConfig.badgeBg,
                border: `2px solid ${roleConfig.badgeBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                flexShrink: 0,
                padding: roleConfig.iconType === 'logo' ? '6px' : 0,
              }}
            >
              {roleConfig.iconType === 'logo' ? (
                <Logo style={{ width: '100%', height: '100%' }} />
              ) : (
                roleConfig.icon
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text, #f8fafc)' }}>
                  {displayName}
                </h4>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: roleConfig.badgeBg,
                    color: roleConfig.badgeBorder,
                    border: `1px solid ${roleConfig.badgeBorder}60`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {roleConfig.title}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--muted, #94a3b8)' }}>
                {companyName}
              </p>
            </div>
          </div>

          {/* Account Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.85rem',
            }}
          >
            {/* Username */}
            <div
              style={{
                background: 'var(--bg, #0f172a)',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--border, #334155)',
              }}
            >
              <div style={{ fontSize: '0.74rem', color: 'var(--muted, #94a3b8)', fontWeight: 600, textTransform: 'uppercase' }}>
                Username
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text, #f8fafc)', marginTop: '4px' }}>
                @{username}
              </div>
            </div>

            {/* Email */}
            <div
              style={{
                background: 'var(--bg, #0f172a)',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--border, #334155)',
              }}
            >
              <div style={{ fontSize: '0.74rem', color: 'var(--muted, #94a3b8)', fontWeight: 600, textTransform: 'uppercase' }}>
                Registered Email
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text, #f8fafc)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {email}
              </div>
            </div>

            {/* Organization / Company */}
            <div
              style={{
                background: 'var(--bg, #0f172a)',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--border, #334155)',
              }}
            >
              <div style={{ fontSize: '0.74rem', color: 'var(--muted, #94a3b8)', fontWeight: 600, textTransform: 'uppercase' }}>
                Organization
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text, #f8fafc)', marginTop: '4px' }}>
                {companyName}
              </div>
            </div>

            {/* Account Status */}
            <div
              style={{
                background: 'var(--bg, #0f172a)',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--border, #334155)',
              }}
            >
              <div style={{ fontSize: '0.74rem', color: 'var(--muted, #94a3b8)', fontWeight: 600, textTransform: 'uppercase' }}>
                Account Status
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>Active & Verified</span>
              </div>
            </div>
          </div>

          {/* Operational Scope & Permissions */}
          <div
            style={{
              background: 'var(--bg, #0f172a)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--border, #334155)',
            }}
          >
            <div style={{ fontSize: '0.78rem', color: 'var(--muted, #94a3b8)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
              Operational Scope & Capabilities
            </div>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.84rem', color: 'var(--text, #f8fafc)', lineHeight: 1.4 }}>
              {roleConfig.description}
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--muted, #cbd5e1)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {roleConfig.responsibilities.map((resp, idx) => (
                <li key={idx}>{resp}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border, #334155)',
            background: 'var(--bg, #0f172a)',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
