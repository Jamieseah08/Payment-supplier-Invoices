import React, { useState } from 'react';
import { X, CheckCircle2, DollarSign, CreditCard, Calendar, FileText } from 'lucide-react';
import { Invoice, PaymentRecord, AppSettings } from '../types';
import { formatCurrency, formatDateDisplay } from '../utils/dateUtils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  settings: AppSettings;
  onRecordPayment: (invoiceId: string, payment: PaymentRecord) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  settings,
  onRecordPayment,
}) => {
  if (!isOpen || !invoice) return null;

  const outstanding = Math.max(0, invoice.amount - (invoice.amountPaid || 0));
  
  const [paymentAmount, setPaymentAmount] = useState<string>(outstanding.toString());
  const [paymentDate, setPaymentDate] = useState<string>(settings.referenceDate);
  const [method, setMethod] = useState<'Bank Transfer' | 'Credit Card' | 'Check' | 'Cash' | 'ACH' | 'Other'>('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState<string>(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
  const [note, setNote] = useState<string>('Payment settlement');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) {
      alert('Please enter a valid payment amount greater than zero.');
      return;
    }

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      amount,
      date: paymentDate,
      method,
      referenceNo: referenceNo.trim() || undefined,
      note: note.trim() || undefined,
    };

    onRecordPayment(invoice.id, newPayment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Record Payment
              </h2>
              <p className="text-xs text-slate-400">
                Invoice <strong className="text-indigo-300">{invoice.invoiceNumber}</strong> • {invoice.supplierName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Outstanding Summary Box */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-2 gap-3 text-center">
            <div>
              <span className="text-[11px] text-slate-400 block">Total Invoice Amount</span>
              <strong className="text-slate-200 text-sm font-mono">
                {formatCurrency(invoice.amount, settings.currencySymbol)}
              </strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Remaining Balance</span>
              <strong className="text-amber-400 text-sm font-mono">
                {formatCurrency(outstanding, settings.currencySymbol)}
              </strong>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Payment Amount ($) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={outstanding}
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setPaymentAmount(outstanding.toString())}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] bg-slate-800 hover:bg-slate-700 text-indigo-300 px-2 py-1 rounded"
              >
                Pay Full Balance
              </button>
            </div>
          </div>

          {/* Payment Date & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Bank Transfer">Bank Transfer (Wire/EFT)</option>
                <option value="ACH">ACH Direct Debit</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Check">Check / Draft</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Reference # */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Transaction Ref / Receipt #</label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. TXN-99882"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Payment Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Paid via HSBC Business Account"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
