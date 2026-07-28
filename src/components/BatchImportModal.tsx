import React, { useState } from 'react';
import { X, FileSpreadsheet, Upload, CheckCircle, AlertCircle, Play, Layers } from 'lucide-react';
import { Invoice, PaymentTermType, CategoryType, AppSettings } from '../types';
import { calculateDueDate, getCalculatedStatus, formatDateDisplay } from '../utils/dateUtils';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportInvoices: (invoices: Invoice[]) => void;
  settings: AppSettings;
}

const PRESET_SCENARIOS = [
  {
    title: '🚨 High Overdue Risk Scenario',
    description: '3 overdue raw material & freight invoices from July 2026',
    data: `INV-2026-OVER1, Titanium Raw Materials, Raw Materials, 2026-07-05, NET_30, 8500.00, PO-701, Urgent polymer resin delivery
INV-2026-OVER2, Portside Shipping Co, Logistics & Shipping, 2026-07-10, NET_30, 2400.00, PO-702, Container demurrage fee
INV-2026-OVER3, Central Power Co, Utilities & Office, 2026-07-15, EOM, 1100.00, PO-703, Electricity utility July`
  },
  {
    title: '⚠️ September Critical Due Soon Set',
    description: 'Invoices due in early September 2026 requiring cash planning',
    data: `INV-2026-SEP1, Apex Components Inc, Inventory & Goods, 2026-08-18, NET_15, 3400.00, PO-801, Circuit boards shipment
INV-2026-SEP2, Global Cloud Services, IT & Software, 2026-08-05, EOM_15, 1250.00, PO-802, SaaS enterprise license
INV-2026-SEP3, CleanWork Services, Professional Services, 2026-08-20, NET_15, 800.00, PO-803, Facility maintenance`
  }
];

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  onImportInvoices,
  settings,
}) => {
  const [rawText, setRawText] = useState('');
  const [parsedItems, setParsedItems] = useState<Invoice[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseText = (text: string) => {
    setParseError(null);
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
    const results: Invoice[] = [];

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      // Format: InvoiceNo, Supplier, Category, InvoiceDate, PaymentTerm, Amount, PO, Notes
      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 5) {
        continue;
      }

      const invoiceNumber = parts[0] || `INV-IMP-${idx + 1}`;
      const supplierName = parts[1] || 'Imported Supplier';
      const category = (parts[2] as CategoryType) || 'Raw Materials';
      const invoiceDate = parts[3] || '2026-08-15';
      const termRaw = (parts[4] || 'NET_30').toUpperCase() as PaymentTermType;
      const amount = parseFloat(parts[5]) || 1000.0;
      const poNumber = parts[6] || undefined;
      const notes = parts[7] || undefined;

      const dueDate = calculateDueDate(invoiceDate, termRaw);

      results.push({
        id: `imp-${Date.now()}-${idx}`,
        invoiceNumber,
        supplierName,
        category,
        invoiceDate,
        paymentTerm: termRaw,
        calculatedDueDate: dueDate,
        amount,
        amountPaid: 0,
        currency: '$',
        status: 'UNPAID',
        poNumber,
        notes,
        payments: [],
        createdAt: new Date().toISOString(),
      });
    }

    if (results.length === 0 && text.trim().length > 0) {
      setParseError('Could not parse any valid invoice lines. Please check format.');
    } else {
      setParsedItems(results);
    }
  };

  const handleRawTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    parseText(val);
  };

  const handleSelectPreset = (presetData: string) => {
    setRawText(presetData);
    parseText(presetData);
  };

  const handleConfirmImport = () => {
    if (parsedItems.length === 0) return;
    onImportInvoices(parsedItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Batch Invoice Import & CSV Parser
              </h2>
              <p className="text-xs text-slate-400">
                Paste supplier invoice lines or select a demo preset to calculate due dates instantly.
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
          
          {/* Quick Presets */}
          <div>
            <span className="block font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Quick Load Sample Test Scenarios:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_SCENARIOS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(preset.data)}
                  className="text-left bg-slate-950 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-all group"
                >
                  <div className="font-semibold text-slate-200 group-hover:text-indigo-300">
                    {preset.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format Spec */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400">
            <p className="font-mono text-indigo-300 mb-1">
              CSV Line Format: Invoice#, Supplier, Category, InvoiceDate (YYYY-MM-DD), PaymentTerm, Amount, PO#, Notes
            </p>
            <p>
              Supported PaymentTerms: <code className="text-amber-300">NET_7</code>, <code className="text-amber-300">NET_15</code>, <code className="text-amber-300">NET_30</code>, <code className="text-amber-300">NET_60</code>, <code className="text-amber-300">EOM</code>, <code className="text-amber-300">EOM_15</code>, <code className="text-amber-300">DUE_ON_RECEIPT</code>
            </p>
          </div>

          {/* Textarea */}
          <div>
            <textarea
              rows={5}
              value={rawText}
              onChange={handleRawTextChange}
              placeholder="Paste comma-separated invoice lines here..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 font-mono text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {parseError && (
            <div className="p-3 bg-rose-950/50 border border-rose-500/40 text-rose-300 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Live Parsing Preview Table */}
          {parsedItems.length > 0 && (
            <div className="space-y-2">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Successfully Parsed {parsedItems.length} Invoices (Calculated Due Dates Preview):
              </span>
              <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg bg-slate-950">
                <table className="w-full text-left text-[11px] text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 sticky top-0">
                    <tr>
                      <th className="p-2">Invoice #</th>
                      <th className="p-2">Supplier</th>
                      <th className="p-2">Inv Date</th>
                      <th className="p-2">Term</th>
                      <th className="p-2">Calculated Due Date</th>
                      <th className="p-2">Evaluated Flag</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {parsedItems.map((inv) => {
                      const calc = getCalculatedStatus(inv, settings.referenceDate, settings.dueSoonThresholdDays);
                      return (
                        <tr key={inv.id}>
                          <td className="p-2 font-mono text-indigo-300">{inv.invoiceNumber}</td>
                          <td className="p-2 font-semibold text-slate-200">{inv.supplierName}</td>
                          <td className="p-2">{inv.invoiceDate}</td>
                          <td className="p-2">{inv.paymentTerm}</td>
                          <td className="p-2 font-bold text-slate-100">{calc.dueDate}</td>
                          <td className="p-2">
                            {calc.flagStatus === 'OVERDUE' && <span className="text-rose-400 font-bold">🚨 Overdue</span>}
                            {calc.flagStatus === 'DUE_SOON' && <span className="text-amber-400 font-bold">⚠️ Due Soon</span>}
                            {calc.flagStatus === 'UPCOMING' && <span className="text-blue-400">📅 Upcoming</span>}
                          </td>
                          <td className="p-2 text-right font-mono">${inv.amount.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={parsedItems.length === 0}
              onClick={handleConfirmImport}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>Import {parsedItems.length} Invoices</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
