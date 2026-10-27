import React, { useRef } from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  Banknote,
  Store,
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  Receipt,
  Download
} from 'lucide-react';

export const InvoiceModal = ({ order, isOpen, onClose }) => {
  const invoiceRef = useRef(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const itemSubtotal = order.subtotal || Math.max(0, order.totalAmount - (order.deliveryFee || 0) - (order.tax || 0));
  const kitchenPayout = order.restaurantPayout || Math.round(itemSubtotal * 0.85 * 100) / 100;
  const riderPayout = order.riderPayout || (order.deliveryFee > 0 ? order.deliveryFee : 40);
  const platformAdminFee = order.adminCommission || Math.max(0, Math.round((order.totalAmount - kitchenPayout - riderPayout) * 100) / 100);

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const formattedTime = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const isReconciled = order.codCollectionStatus === 'RECONCILED';
  const isCollected = order.codCollectionStatus === 'COLLECTED' || isReconciled;

  return (
    <div
      className="invoice-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="invoice-modal-content"
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }}
      >
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div
          className="no-print"
          style={{
            padding: '16px 24px',
            backgroundColor: 'var(--deep-navy)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Receipt size={20} color="var(--fresh-cyan)" />
            <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>
              Official COD Tax Invoice & Delivery Receipt
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrint}
              className="btn btn-primary"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '6px'
              }}
            >
              <Printer size={15} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '6px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Close receipt"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div
          id="printable-invoice"
          ref={invoiceRef}
          style={{
            padding: '32px',
            overflowY: 'auto',
            fontFamily: 'var(--font-family)',
            color: 'var(--text-primary)',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Header & Logo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--deep-navy)', paddingBottom: '20px', marginBottom: '22px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--primary-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '1.2rem'
                }}>
                  F
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: 'var(--deep-navy)', letterSpacing: '-0.5px' }}>
                    FOODIE<span style={{ color: 'var(--primary-teal)' }}>.</span>
                  </h2>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                    Strict Cash On Delivery Network
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                GSTIN: 36AAECF1234F1Z8 • Hub Safe Deposit Verified
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 800,
                backgroundColor: isReconciled ? '#dcfce7' : isCollected ? '#e0f2fe' : '#fef3c7',
                color: isReconciled ? '#15803d' : isCollected ? '#0369a1' : '#b45309',
                border: `1px solid ${isReconciled ? '#bbf7d0' : isCollected ? '#bae6fd' : '#fde68a'}`,
                marginBottom: '6px'
              }}>
                {isReconciled ? '✓ COD CASH RECONCILED IN SAFE' : isCollected ? '✓ CASH COLLECTED AT DOORSTEP' : 'PENDING DOORSTEP PAYMENT'}
              </span>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--deep-navy)' }}>
                INVOICE #{order.orderNumber}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Date: {formattedDate} • {formattedTime}
              </div>
            </div>
          </div>

          {/* Customer & Merchant Meta Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)', marginBottom: '22px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Delivered From (Kitchen):
              </span>
              <div style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--deep-navy)' }}>
                {order.restaurant?.name || 'Partner Kitchen'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {order.restaurant?.address?.street || 'Kitchen Counter'}, {order.restaurant?.address?.city || 'Metro'}
              </div>
              {order.restaurant?.phone && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Tel: {order.restaurant.phone}
                </div>
              )}
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Billed & Delivered To:
              </span>
              <div style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--deep-navy)' }}>
                {order.customer?.name || 'Valued Customer'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
              </div>
              {order.deliveryAddress?.phone && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Mobile: {order.deliveryAddress.phone}
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-medium)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 4px' }}>Item Description</th>
                <th style={{ padding: '8px 4px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '8px 4px', textAlign: 'right' }}>Price</th>
                <th style={{ padding: '8px 4px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 4px', fontWeight: 600, color: 'var(--deep-navy)' }}>
                    {item.name}
                  </td>
                  <td style={{ padding: '10px 4px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '10px 4px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                    ₹{item.price.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 700, color: 'var(--deep-navy)' }}>
                    ₹{(item.itemTotal || (item.price * item.quantity)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Calculation & 3-Way Disbursement Ledger */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'flex-start', marginBottom: '24px' }}>
            {/* Left: 3-Way Disbursement Transparency Ledger */}
            <div style={{ padding: '14px 16px', borderRadius: '10px', backgroundColor: '#f0fdfa', border: '1px solid #ccfbf1' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary-teal)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                ⚖️ 3-Way Settlement Transparency
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: '#134e4a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Kitchen Share (85% Subtotal):</span>
                  <strong>₹{kitchenPayout.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Delivery Partner Cut (Fee):</span>
                  <strong>₹{riderPayout.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Admin Platform Margin:</span>
                  <strong>₹{platformAdminFee.toFixed(2)}</strong>
                </div>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#0f766e', marginTop: '8px', borderTop: '1px dashed #99f6e4', paddingTop: '6px' }}>
                Payment Mode: Physical Cash On Delivery. Payouts finalized post Hub Admin audit.
              </div>
            </div>

            {/* Right: Bill Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal:</span>
                <span>₹{order.subtotal?.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Delivery Fee (Rider):</span>
                <span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee?.toFixed(2)}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>GST & Food Packaging:</span>
                <span>₹{order.tax?.toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '2px solid var(--deep-navy)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--deep-navy)' }}>Total Cash Paid:</span>
                <span style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--primary-teal)' }}>
                  ₹{order.totalAmount?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Handover & Security Sign-off Block */}
          <div style={{ borderTop: '1px solid var(--border-medium)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8fafc',
                fontSize: '0.75rem',
                fontWeight: 900,
                color: 'var(--primary-teal)'
              }}>
                COD
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--deep-navy)' }}>
                  Physical Cash Transaction Verified
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Handled by Delivery Partner ID: {order.deliveryPartner?._id || order.deliveryPartner || 'Assigned Rider'}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Thank you for ordering with Foodie!
              <div style={{ fontWeight: 600, color: 'var(--deep-navy)' }}>support@foodie.local</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default InvoiceModal;
