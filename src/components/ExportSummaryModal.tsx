import React, { useState } from 'react';
import { X, Download, Copy, Printer, Check, FileText } from 'lucide-react';
import { Invoice, AppSettings } from '../types';
import { getCalculatedStatus, formatDateDisplay, formatCurrency, getTermLabel } from '../utils/dateUtils';

interface ExportSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  settings: AppSettings;
}

export const ExportSummaryModal: React.FC<ExportSummaryModalProps> = ({
  isOpen,
  onClose,
  invoices,
  settings,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate CSV
  const handleDownloadCsv = () => {
    const headers = ['Invoice Number', 'Supplier Name', 'Category', 'Invoice Date', 'Payment Term', 'Calculated Due Date', 'Status', 'Days Remaining', 'Total Amount', 'Amount Paid', 'Outstanding Balance', 'PO Number'];
    
    const rows = invoices.map((inv) => {
      const calc = getCalculatedStatus(inv, settings.referenceDate, settings.dueSoonThresholdDays);
      return [
        `"${inv.invoiceNumber}"`,
        `"${inv.supplierName}"`,
        `"${inv.category}"`,
        inv.invoiceDate,
        `"${getTermLabel(inv.paymentTerm, inv.customDays)}"`,
        calc.dueDate,
        calc.flagStatus,
        calc.daysRemaining,
        inv.amount.toFixed(2),
        inv.amountPaid.toFixed(2),
        calc.outstandingAmount.toFixed(2),
        `"${inv.poNumber || ''}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Supplier_Payment_Due_Report_${settings.referenceDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate Text Digest Summary
  const generateDigestText = () => {
    let text = `====================================================\n`;
    text += `SUPPLIER PAYMENT DUE DATE DIGEST (Ref: ${settings.referenceDate})\n`;
    text += `====================================================\n\n`;

    let totalOverdue = 0;
    let totalDueSoon = 0;

    invoices.forEach((inv) => {
      const calc = getCalculatedStatus(inv, settings.referenceDate, settings.dueSoonThresholdDays);
      if (calc.flagStatus === 'OVERDUE') totalOverdue += calc.outstandingAmount;
      if (calc.flagStatus === 'DUE_SOON') totalDueSoon += calc.outstandingAmount;
    });

    text += `TOTAL OVERDUE: ${formatCurrency(totalOverdue, settings.currencySymbol)}\n`;
    text += `TOTAL DUE SOON (Next ${settings.dueSoonThresholdDays} Days): ${formatCurrency(totalDueSoon, settings.currencySymbol)}\n\n`;

    text += `INVOICE BREAKDOWN:\n----------------------------------------------------\n`;
    invoices.forEach((inv) => {
      const calc = getCalculatedStatus(inv, settings.referenceDate, settings.dueSoonThresholdDays);
      text += `[${calc.flagStatus}] ${inv.invoiceNumber} | ${inv.supplierName}\n`;
      text += `  Invoice Date: ${inv.invoiceDate} | Terms: ${getTermLabel(inv.paymentTerm, inv.customDays)}\n`;
      text += `  CALCULATED DUE DATE: ${calc.dueDate} (${calc.daysRemaining} days relative to ref date)\n`;
      text += `  Outstanding: ${formatCurrency(calc.outstandingAmount, settings.currencySymbol)} / Total: ${formatCurrency(inv.amount, settings.currencySymbol)}\n\n`;
    });

    return text;
  };

  const handleCopyDigest = () => {
    navigator.clipboard.writeText(generateDigestText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Export & Print Payment Due Digest
              </h2>
              <p className="text-xs text-slate-400">
                Download spreadsheet or copy statement for accounting & bank transfer execution.
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

        <div className="p-6 space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleDownloadCsv}
              className="p-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 flex flex-col items-start text-left transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                <Download className="w-4 h-4" />
              </div>
              <strong className="text-slate-200 group-hover:text-emerald-300 font-semibold text-sm">
                Download CSV Spreadsheet
              </strong>
              <p className="text-slate-400 text-[11px] mt-1">
                Full table export compatible with Microsoft Excel, Google Sheets, & Xero.
              </p>
            </button>

            <button
              onClick={handleCopyDigest}
              className="p-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 flex flex-col items-start text-left transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </div>
              <strong className="text-slate-200 group-hover:text-indigo-300 font-semibold text-sm">
                {copied ? 'Digest Copied!' : 'Copy Text Statement'}
              </strong>
              <p className="text-slate-400 text-[11px] mt-1">
                Formatted plain text list ready to send to finance team or copy to email.
              </p>
            </button>
          </div>

          {/* Preview Box */}
          <div>
            <span className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Statement Text Preview:
            </span>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-300 font-mono max-h-56 overflow-y-auto whitespace-pre-wrap">
              {generateDigestText()}
            </pre>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
