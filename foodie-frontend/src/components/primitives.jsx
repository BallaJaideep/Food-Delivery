import React from 'react';
import { ShieldCheck, HeartHandshake, AlertCircle, ShoppingBag, Sparkles } from 'lucide-react';

/**
 * Status Badge Component supporting COD, Surplus, and Order States
 */
export const StatusBadge = ({ type = 'cod', label, icon = true }) => {
  if (type === 'cod') {
    return (
      <span className="badge badge-cod">
        {icon && <ShieldCheck size={13} />}
        {label || '100% Cash on Delivery'}
      </span>
    );
  }

  if (type === 'surplus') {
    return (
      <span className="badge badge-surplus">
        {icon && <HeartHandshake size={13} />}
        {label || 'Food Rescue'}
      </span>
    );
  }

  return (
    <span className="badge badge-category">
      {label}
    </span>
  );
};

/**
 * Card Loading Skeleton Primitive
 */
export const CardSkeleton = () => (
  <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
    <div className="skeleton" style={{ height: '180px', width: '100%', borderRadius: '18px 18px 0 0' }} />
    <div style={{ padding: '20px' }}>
      <div className="skeleton" style={{ height: '22px', width: '70%', marginBottom: '12px' }} />
      <div className="skeleton" style={{ height: '14px', width: '90%', marginBottom: '8px' }} />
      <div className="skeleton" style={{ height: '14px', width: '50%', marginBottom: '16px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
        <div className="skeleton" style={{ height: '16px', width: '30%' }} />
        <div className="skeleton" style={{ height: '16px', width: '30%' }} />
      </div>
    </div>
  </div>
);

/**
 * Empty State Primitive
 */
export const EmptyState = ({ title = 'No results found', message = 'Try adjusting your search criteria.', icon: Icon = Sparkles }) => (
  <div className="card" style={{ padding: '48px 24px', textAlign: 'center', margin: '20px 0' }}>
    <div style={{
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      backgroundColor: '#f0fdfa',
      color: '#0d9488',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px'
    }}>
      <Icon size={28} />
    </div>
    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{title}</h3>
    <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>{message}</p>
  </div>
);

/**
 * Error Banner Primitive
 */
export const ErrorBanner = ({ message, onRetry }) => (
  <div style={{
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: '16px 0'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c' }}>
      <AlertCircle size={20} />
      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{message}</span>
    </div>
    {onRetry && (
      <button onClick={onRetry} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
        Retry
      </button>
    )}
  </div>
);

/**
 * Modern Clean Pagination Component
 */
export const Pagination = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions
}) => {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  if (totalItems === 0) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalItems);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      marginTop: '20px',
      paddingTop: '16px',
      borderTop: '1px solid var(--border-subtle)',
      fontSize: '0.84rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
        <span>
          Showing <strong>{startRecord}</strong>–<strong>{endRecord}</strong> of <strong>{totalItems}</strong> entries
        </span>

        {pageSizeOptions && onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-medium)',
                backgroundColor: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--deep-navy)',
                cursor: 'pointer'
              }}
            >
              {pageSizeOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-medium)',
            backgroundColor: '#ffffff',
            color: currentPage <= 1 ? 'var(--text-muted)' : 'var(--deep-navy)',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '0.8rem',
            opacity: currentPage <= 1 ? 0.6 : 1
          }}
        >
          ← Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: page === currentPage ? '1.5px solid var(--primary-teal)' : '1px solid var(--border-subtle)',
              backgroundColor: page === currentPage ? 'var(--primary-teal)' : '#ffffff',
              color: page === currentPage ? '#ffffff' : 'var(--deep-navy)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: page === currentPage ? '0 2px 4px rgba(13, 148, 136, 0.25)' : 'none'
            }}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-medium)',
            backgroundColor: '#ffffff',
            color: currentPage >= totalPages ? 'var(--text-muted)' : 'var(--deep-navy)',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '0.8rem',
            opacity: currentPage >= totalPages ? 0.6 : 1
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
};
