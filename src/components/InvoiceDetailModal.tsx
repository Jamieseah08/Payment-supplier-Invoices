import React from 'react';
import { X, Building2, Calendar, Clock, DollarSign, FileText, Tag, CheckCircle2, AlertTriangle, CreditCard, Plus, Image as ImageIcon } from 'lucide-react';
import { Invoice, AppSettings } from '../types';
import { getCalculatedStatus, formatDateDisplay, formatCurrency, getTermLabel, formatRelativeDays } from '../utils/dateUtils';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  settings: AppSettings;
  onRecordPayment: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  settings,
  onRecordPayment,
  onEditInvoice,
}) => {
  if (!isOpen || !invoice) return null;

  const calc = getCalculatedStatus(invoice, settings.referenceDate, settings.dueSoonThresholdDays);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{invoice.invoiceNumber}</span>
                <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {getTermLabel(invoice.paymentTerm, invoice.customDays)}
                </span>
              </h2>
              <p className="text-xs text-slate-400">{invoice.supplierName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          
          {/* Status & Due Date Highlight Box */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            calc.flagStatus === 'OVERDUE'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : calc.flagStatus === 'DUE_SOON'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                : calc.flagStatus === 'PAID'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
          }`}>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold opacity-80 block">
                Calculated Payment Deadline
              </span>
              <strong className="text-lg font-extrabold block mt-0.5">
                {formatDateDisplay(calc.dueDate)} ({calc.dueDate})
              </strong>
              <span className="text-xs font-medium opacity-90 mt-0.5 block">
                {formatRelativeDays(calc.daysRemaining, calc.flagStatus)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider font-semibold opacity-80 block">
                Outstanding Balance
              </span>
              <strong className="text-xl font-bold font-mono text-slate-100 block mt-0.5">
                {formatCurrency(calc.outstandingAmount, settings.currencySymbol)}
              </strong>
              <span className="text-[11px] opacity-75">
                Total: {formatCurrency(invoice.amount, settings.currencySymbol)}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 text-[11px] block">Supplier Name</span>
              <span className="font-semibold text-slate-100 text-sm">{invoice.supplierName}</span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Category</span>
              <span className="font-semibold text-slate-200">{invoice.category}</span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Invoice Date</span>
              <span className="font-mono text-slate-200">{invoice.invoiceDate}</span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Payment Term</span>
              <span className="font-semibold text-indigo-300">{getTermLabel(invoice.paymentTerm, invoice.customDays)}</span>
            </div>

            {invoice.poNumber && (
              <div>
                <span className="text-slate-400 text-[11px] block">PO / Reference #</span>
                <span className="font-mono text-slate-200">{invoice.poNumber}</span>
              </div>
            )}

            <div>
              <span className="text-slate-400 text-[11px] block">Amount Paid So Far</span>
              <span className="font-mono text-emerald-400 font-semibold">{formatCurrency(invoice.amountPaid, settings.currencySymbol)}</span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block font-semibold mb-1">Notes & Item Details:</span>
              <p className="text-slate-300 text-xs whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Attached Invoice Photo/PDF & Scanned Calculations */}
          {invoice.imageUrl && (
            <div className="bg-slate-950 p-3.5 rounded-xl border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-indigo-300 font-bold text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {invoice.imageUrl.startsWith('data:application/pdf')
                      ? 'Attached Original PDF Document'
                      : 'Attached Original Invoice Attachment'}
                  </span>
                </span>
                <a
                  href={invoice.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Open / Download File</span>
                </a>
              </div>
              <div className="flex gap-3 items-start">
                {invoice.imageUrl.startsWith('data:application/pdf') ? (
                  <div className="w-20 h-20 bg-red-950/70 border border-red-500/40 rounded-lg flex flex-col items-center justify-center shrink-0 text-red-400">
                    <FileText className="w-7 h-7" />
                    <span className="text-[10px] font-bold mt-1">PDF</span>
                  </div>
                ) : (
                  <img
                    src={invoice.imageUrl}
                    alt="Original Invoice"
                    className="w-20 h-20 object-cover rounded-lg border border-slate-800 shrink-0"
                  />
                )}
                {invoice.scannedBreakdown && (
                  <div className="text-[11px] text-slate-300 space-y-1 flex-1">
                    <div className="font-semibold text-slate-200">Scanned AI Calculations:</div>
                    {invoice.scannedBreakdown.subtotal !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Subtotal:</span>
                        <span className="font-mono">${Number(invoice.scannedBreakdown.subtotal).toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.scannedBreakdown.tax !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tax / VAT:</span>
                        <span className="font-mono">${Number(invoice.scannedBreakdown.tax).toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.scannedBreakdown.shipping !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Shipping:</span>
                        <span className="font-mono">${Number(invoice.scannedBreakdown.shipping).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Logs History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                Payment Audit Trail ({invoice.payments.length})
              </span>
              {invoice.status !== 'PAID' && (
                <button
                  onClick={() => {
                    onClose();
                    onRecordPayment(invoice);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              )}
            </div>

            {invoice.payments.length === 0 ? (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-500 italic text-center">
                No payment transactions recorded yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {invoice.payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">
                        {p.method} {p.referenceNo ? `(${p.referenceNo})` : ''}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatDateDisplay(p.date)} {p.note ? `• ${p.note}` : ''}
                      </div>
                    </div>
                    <div className="font-bold font-mono text-emerald-400">
                      +{formatCurrency(p.amount, settings.currencySymbol)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                onClose();
                onEditInvoice(invoice);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
            >
              Edit Invoice
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
