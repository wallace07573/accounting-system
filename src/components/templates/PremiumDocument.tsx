import React from 'react';
import styles from './PremiumDocument.module.css';

// Types to represent our data
export interface Tenant {
  name: string;
  logo_url?: string | null;
  brand_color?: string;
  address?: string;
  phone?: string;
  email?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  ssm_number?: string;
}

export interface Customer {
  name: string;
  company_name?: string;
  address?: string;
  attention?: string;
}

export interface DocumentItem {
  description: string;
  qty: number;
  uom: string;
  unit_price: number;
  amount: number;
}

export interface DocumentData {
  type: 'Invoice' | 'Quotation' | 'Delivery Order';
  doc_no: string;
  issue_date: string;
  due_date?: string;
  title?: string;
  is_corporate?: boolean;
  show_bank_details?: boolean;
  terms?: string;
  items: DocumentItem[];
}

export interface PremiumDocumentProps {
  tenant: Tenant;
  customer: Customer;
  document: DocumentData;
}

export const PremiumDocument: React.FC<PremiumDocumentProps> = ({ tenant, customer, document }) => {
  const isDO = document.type === 'Delivery Order';
  const isQuotation = document.type === 'Quotation';
  const showPrices = !isDO;

  const MAX_REGULAR = 8; // Max items on a regular page without bottom section
  const MAX_LAST = 4;    // Max items on the last page with bottom section

  const chunkedItems = [];
  let remaining = document.items.length;
  let offset = 0;

  while (remaining > 0) {
    if (remaining <= MAX_LAST) {
      chunkedItems.push(document.items.slice(offset, offset + remaining));
      remaining = 0;
    } else if (remaining <= MAX_REGULAR) {
      chunkedItems.push(document.items.slice(offset, offset + remaining));
      chunkedItems.push([]); // Add an empty page for the bottom section
      remaining = 0;
    } else {
      chunkedItems.push(document.items.slice(offset, offset + MAX_REGULAR));
      offset += MAX_REGULAR;
      remaining -= MAX_REGULAR;
    }
  }
  
  if (chunkedItems.length === 0) {
    chunkedItems.push([]);
  }

  const subTotal = document.items.reduce((sum, item) => sum + item.amount, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <>
      {chunkedItems.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === chunkedItems.length - 1;
        
        return (
          <div 
            key={pageIndex} 
            className={styles.documentContainer} 
            style={{ 
              '--brand-color': tenant.brand_color || '#000',
              pageBreakAfter: isLastPage ? 'auto' : 'always'
            } as React.CSSProperties}
          >
            {/* Top Section */}
            <div className={styles.topSection}>
              <div className={styles.leftHeader}>
                <div className={styles.tenantBrandRow}>
                  {tenant.logo_url && (
                    <div className={styles.tenantLogoWrapper}>
                      <img src={tenant.logo_url} alt="Logo" className={styles.tenantLogo} />
                    </div>
                  )}
                  <h1 className={styles.tenantName}>{tenant.name}</h1>
                </div>
                <div className={styles.tenantContactBlock}>
                  {tenant.ssm_number && (
                    <div className={styles.tenantSsm}>SSM: {tenant.ssm_number}</div>
                  )}
                  {(tenant.address || tenant.phone || tenant.email) && (
                    <div className={styles.tenantAddress}>
                      {tenant.address && <span>{tenant.address}</span>}
                      {(tenant.phone || tenant.email) && (
                        <div style={{ marginTop: '2px' }}>
                          {tenant.phone && <span>Tel: {tenant.phone}</span>}
                          {tenant.phone && tenant.email && <span> | </span>}
                          {tenant.email && <span>Email: {tenant.email}</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.rightHeader}>
                <h2 className={styles.docTitle}>{document.type.toUpperCase()}</h2>
                <div className={styles.docMetaGrid}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaRowLabel}>{isDO ? 'DO' : isQuotation ? 'QUO' : 'INV'} NO.</span>
                    <span className={styles.metaRowColon}>:</span>
                    <span className={styles.metaRowValue}>{document.doc_no}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaRowLabel}>DATE</span>
                    <span className={styles.metaRowColon}>:</span>
                    <span className={styles.metaRowValue}>{formatDate(document.issue_date)}</span>
                  </div>
                  {document.due_date && (
                    <div className={styles.metaRow}>
                      <span className={styles.metaRowLabel}>DUE DATE</span>
                      <span className={styles.metaRowColon}>:</span>
                      <span className={styles.metaRowValue}>{formatDate(document.due_date)}</span>
                    </div>
                  )}
                  <div className={styles.metaRow}>
                    <span className={styles.metaRowLabel}>PAGE</span>
                    <span className={styles.metaRowColon}>:</span>
                    <span className={styles.metaRowValue} style={{ fontWeight: 'normal' }}>{pageIndex + 1} of {chunkedItems.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.divider} />

            {/* Meta Section */}
            <div className={styles.metaSection}>
              <div className={styles.customerBlock}>
                <div className={styles.customerLabel}>
                  {isDO ? 'DELIVER TO:' : isQuotation ? 'QUOTATION TO:' : 'INVOICE TO:'}
                </div>
                {(isQuotation || document.type === 'Invoice') && document.is_corporate ? (
                  <>
                    <p className={styles.customerText} style={{ fontWeight: 800, fontSize: '13pt', color: '#0f172a', marginBottom: '4px' }}>
                      {customer.company_name || customer.name}
                    </p>
                    {customer.address && (
                      <p className={styles.customerText} style={{ whiteSpace: 'pre-wrap', marginTop: '4px', marginBottom: '8px' }}>
                        {customer.address}
                      </p>
                    )}
                    <p className={styles.customerText}>
                      <strong>Name:</strong> {customer.name}
                    </p>
                    {customer.attention && (
                      <p className={styles.customerText}>
                        <strong>Contact:</strong> {customer.attention}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className={styles.customerText} style={{ fontWeight: 800, fontSize: '13pt', color: '#0f172a', marginBottom: '4px' }}>
                      {customer.name}
                    </p>
                    {customer.address && (
                      <p className={styles.customerText} style={{ whiteSpace: 'pre-wrap', marginTop: '4px', marginBottom: '8px' }}>
                        {customer.address}
                      </p>
                    )}
                    {customer.company_name && (
                      <p className={styles.customerText}><strong>Company:</strong> {customer.company_name}</p>
                    )}
                    {customer.attention && (
                      <p className={styles.customerText}><strong>ATTN:</strong> {customer.attention}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {isQuotation && document.title && (
              <div style={{ marginTop: '24px', marginBottom: '8px' }}>
                <p style={{ fontWeight: 700, fontSize: '11pt', color: '#0f172a' }}>
                  {document.title}
                </p>
              </div>
            )}

            {/* Table */}
            <table className={styles.itemsTable} style={{ marginTop: isQuotation && document.title ? '8px' : '32px' }}>
              <thead>
                <tr>
                  <th className={styles.colDesc}>ITEM DESCRIPTION</th>
                  <th className={styles.colQty}>QTY</th>
                  {showPrices && <th className={styles.colPrice}>PRICE</th>}
                  {showPrices && <th className={styles.colAmount}>TOTAL</th>}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className={styles.colDesc}>{item.description}</td>
                    <td className={styles.colQty}>{item.qty ? item.qty : ''}</td>
                    {showPrices && <td className={styles.colPrice}>{item.unit_price ? `RM ${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}</td>}
                    {showPrices && <td className={styles.colAmount}>{item.amount ? `RM ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}</td>}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Spacer to push everything below to the bottom */}
            <div style={{ flex: 1 }} />

            {/* Only show the summary and signatures on the last page */}
            {isLastPage ? (
              <div className={styles.bottomWrapper}>
                {/* Summary Box */}
                {showPrices && (
                  <div className={styles.summaryContainer}>
                    <div className={styles.summaryBlock}>
                      <div className={`${styles.summaryRow} ${styles.grandTotal}`}>
                        <span>Grand Total:</span>
                        <span>RM {subTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Section */}
                <div className={styles.bottomSection}>
                  {(document.type === 'Invoice' || (document.type === 'Quotation' && document.show_bank_details)) && (tenant.bank_name || tenant.bank_account_number || tenant.bank_account_name) && (
                    <div className={styles.bankBlock}>
                      <div className={styles.bankHeader}>Kindly Bankin To:</div>
                      <div className={styles.bankDetails}>
                        {tenant.bank_name && <div style={{ fontWeight: 600 }}>{tenant.bank_name}</div>}
                        {tenant.bank_account_number && <div>{tenant.bank_account_number}</div>}
                        {tenant.bank_account_name && <div style={{ color: '#64748b', fontSize: '10pt', marginTop: '2px' }}>{tenant.bank_account_name}</div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Terms and Conditions */}
                {document.terms && (
                  <div className={styles.termsBlock}>
                    <div className={styles.termsTitle}>NOTES:</div>
                    <div className={styles.termsText}>{document.terms}</div>
                  </div>
                )}

                {/* Signatures for Delivery Order and Quotation */}
                {isDO && (
                  <div className={styles.signatures}>
                    <div className={styles.sigBox}>
                      <div className={styles.sigLine}>ISSUED BY</div>
                      <div className={styles.sigSub}>{tenant.name}</div>
                    </div>
                    <div className={styles.sigBox}>
                      <div className={styles.sigLine}>RECEIVED BY</div>
                      <div className={styles.sigSub}>(Signature & Company Chop)</div>
                      <div className={styles.sigField}>
                        <span className={styles.sigLabel}>Name:</span>
                        <div className={styles.sigInput}></div>
                      </div>
                      <div className={styles.sigField}>
                        <span className={styles.sigLabel}>Date:</span>
                        <div className={styles.sigInput}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.footer} style={{ marginTop: 'auto', borderTop: 'none' }}>
                <div style={{ fontStyle: 'italic' }}>Continued on next page...</div>
              </div>
            )}

            {isLastPage && (
              <div className={styles.footer}>
                <div>This is a computer-generated document.</div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

