import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  Calculator,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  Tag,
  Building,
  Upload,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Eye,
} from 'lucide-react';
import { Invoice, PaymentTermType, CategoryType, AppSettings, InvoiceStatus } from '../types';
import { calculateDueDate, getCalculatedStatus, getTermLabel, formatDateDisplay, formatRelativeDays } from '../utils/dateUtils';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Partial<Invoice>) => void;
  initialInvoice?: Invoice | null;
  initialSupplierName?: string;
  onOpenBatchModal?: () => void;
  settings: AppSettings;
  existingSuppliers: string[];
}

const CATEGORIES: CategoryType[] = [
  'Raw Materials',
  'Logistics & Shipping',
  'Utilities & Office',
  'IT & Software',
  'Marketing & Ads',
  'Inventory & Goods',
  'Professional Services',
  'Equipment Repair',
  'Other',
];

const PAYMENT_TERMS: { value: PaymentTermType; label: string; description: string }[] = [
  { value: 'NET_30', label: 'Net 30 Days', description: 'Due 30 days after invoice date' },
  { value: 'NET_15', label: 'Net 15 Days', description: 'Due 15 days after invoice date' },
  { value: 'NET_7', label: 'Net 7 Days', description: 'Due 7 days after invoice date' },
  { value: 'NET_45', label: 'Net 45 Days', description: 'Due 45 days after invoice date' },
  { value: 'NET_60', label: 'Net 60 Days', description: 'Due 60 days after invoice date' },
  { value: 'NET_90', label: 'Net 90 Days', description: 'Due 90 days after invoice date' },
  { value: 'DUE_ON_RECEIPT', label: 'Due on Receipt', description: 'Due immediately upon invoice date' },
  { value: 'EOM', label: 'End of Month (EOM)', description: 'Due on last calendar day of invoice month' },
  { value: 'EOM_15', label: 'EOM + 15 Days', description: 'Due 15 days after end of invoice month' },
  { value: 'EOM_30', label: 'EOM + 30 Days', description: 'Due 30 days after end of invoice month' },
  { value: 'CUSTOM', label: 'Custom Days', description: 'Specify exact number of credit days' },
];

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialInvoice,
  initialSupplierName,
  onOpenBatchModal,
  settings,
  existingSuppliers,
}) => {
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [category, setCategory] = useState<CategoryType>('Raw Materials');
  const [invoiceDate, setInvoiceDate] = useState(settings.referenceDate || '2026-08-31');
  const [paymentTerm, setPaymentTerm] = useState<PaymentTermType>('NET_30');
  const [customDays, setCustomDays] = useState<number>(30);
  const [amount, setAmount] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<string>('0');
  const [status, setStatus] = useState<InvoiceStatus>('UNPAID');
  const [poNumber, setPoNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Image / PDF Scan States
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string>('image/png');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedSuccess, setScannedSuccess] = useState(false);
  const [scannedBreakdown, setScannedBreakdown] = useState<Invoice['scannedBreakdown'] | null>(null);

  // Pre-fill if editing existing or adding new
  useEffect(() => {
    if (initialInvoice) {
      setSupplierName(initialInvoice.supplierName);
      setInvoiceNumber(initialInvoice.invoiceNumber);
      setCategory(initialInvoice.category);
      setInvoiceDate(initialInvoice.invoiceDate);
      setPaymentTerm(initialInvoice.paymentTerm);
      setCustomDays(initialInvoice.customDays || 30);
      setAmount(initialInvoice.amount.toString());
      setAmountPaid((initialInvoice.amountPaid || 0).toString());
      setStatus(initialInvoice.status);
      setPoNumber(initialInvoice.poNumber || '');
      setNotes(initialInvoice.notes || '');
      setUploadedImage(initialInvoice.imageUrl || null);
      if (initialInvoice.imageUrl?.startsWith('data:application/pdf')) {
        setUploadedMimeType('application/pdf');
        setUploadedFileName('invoice_document.pdf');
      } else {
        setUploadedMimeType('image/png');
        setUploadedFileName('invoice_attachment');
      }
      setScannedBreakdown(initialInvoice.scannedBreakdown || null);
      setScannedSuccess(!!initialInvoice.scannedBreakdown);
      setScanError(null);
    } else {
      // Default clean setup for user's new invoice
      setSupplierName(initialSupplierName || '');
      setInvoiceNumber('');
      setCategory('Raw Materials');
      setInvoiceDate(settings.referenceDate || '2026-08-31');
      setPaymentTerm('NET_30');
      setCustomDays(30);
      setAmount('');
      setAmountPaid('0');
      setStatus('UNPAID');
      setPoNumber('');
      setNotes('');
      setUploadedImage(null);
      setUploadedMimeType('image/png');
      setUploadedFileName('');
      setScannedBreakdown(null);
      setScannedSuccess(false);
      setScanError(null);
    }
  }, [initialInvoice, initialSupplierName, isOpen, settings.referenceDate]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAndScanImage(file);
  };

  const processAndScanImage = (file: File) => {
    setScanError(null);
    setScannedSuccess(false);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const mime = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png');
      setUploadedImage(base64);
      setUploadedMimeType(mime);
      setUploadedFileName(file.name);
      scanInvoiceImage(base64, mime);
    };
    reader.readAsDataURL(file);
  };

  const scanInvoiceImage = async (base64Str: string, mimeTypeStr: string) => {
    setIsScanning(true);
    setScanError(null);
    try {
      const res = await fetch('/api/scan-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Str, mimeType: mimeTypeStr }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to scan invoice image');
      }

      const data = result.data;
      if (data.supplierName) setSupplierName(data.supplierName);
      if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber);
      if (data.invoiceDate) setInvoiceDate(data.invoiceDate);
      if (data.paymentTerm && PAYMENT_TERMS.some((t) => t.value === data.paymentTerm)) {
        setPaymentTerm(data.paymentTerm as PaymentTermType);
      }
      if (data.customDays) setCustomDays(data.customDays);
      if (data.amount !== undefined && data.amount !== null) {
        setAmount(data.amount.toString());
      }
      if (data.category && CATEGORIES.includes(data.category as CategoryType)) {
        setCategory(data.category as CategoryType);
      }
      if (data.poNumber) setPoNumber(data.poNumber);

      if (data.summaryNotes || (data.lineItems && data.lineItems.length > 0)) {
        let buildNotes = data.summaryNotes ? `Scan Summary: ${data.summaryNotes}` : '';
        if (data.lineItems && data.lineItems.length > 0) {
          const itemsStr = data.lineItems
            .map(
              (item: any) =>
                `• ${item.description || 'Item'}: ${item.quantity || 1} x $${item.unitPrice || 0} = $${item.total || 0}`
            )
            .join('\n');
          buildNotes = buildNotes ? `${buildNotes}\n\nLine Items:\n${itemsStr}` : `Line Items:\n${itemsStr}`;
        }
        setNotes((prev) => (prev ? `${prev}\n\n${buildNotes}` : buildNotes));
      }

      setScannedBreakdown({
        subtotal: data.subtotal,
        tax: data.tax,
        shipping: data.shipping,
        lineItems: data.lineItems,
      });
      setScannedSuccess(true);
    } catch (err: any) {
      console.error(err);
      setScanError(err.message || 'Could not auto-extract fields. You can still manually enter invoice details.');
    } finally {
      setIsScanning(false);
    }
  };

  if (!isOpen) return null;

  // Live calculation preview
  const liveDueDate = calculateDueDate(invoiceDate, paymentTerm, customDays);
  const dummyInvoiceForCalc: Invoice = {
    id: initialInvoice?.id || 'temp',
    invoiceNumber: invoiceNumber || 'INV-TEMP',
    supplierName: supplierName || 'Sample Supplier',
    category,
    invoiceDate,
    paymentTerm,
    customDays,
    calculatedDueDate: liveDueDate,
    amount: parseFloat(amount) || 0,
    amountPaid: parseFloat(amountPaid) || 0,
    currency: '$',
    status,
    payments: [],
    createdAt: new Date().toISOString(),
  };

  const liveCalc = getCalculatedStatus(dummyInvoiceForCalc, settings.referenceDate, settings.dueSoonThresholdDays);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert('Please fill in the Supplier Name.');
      return;
    }
    if (!invoiceDate) {
      alert('Please select an Invoice Date.');
      return;
    }

    const finalInvoiceNumber = invoiceNumber.trim() || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const numAmount = Math.max(0, parseFloat(amount) || 0);
    const numPaid = Math.max(0, parseFloat(amountPaid) || 0);

    let finalStatus = status;
    if (numPaid >= numAmount && numAmount > 0) {
      finalStatus = 'PAID';
    } else if (numPaid > 0 && numPaid < numAmount) {
      finalStatus = 'PARTIAL';
    }

    onSave({
      id: initialInvoice?.id,
      supplierName: supplierName.trim(),
      invoiceNumber: finalInvoiceNumber,
      category,
      invoiceDate,
      paymentTerm,
      customDays: paymentTerm === 'CUSTOM' ? customDays : undefined,
      calculatedDueDate: liveDueDate,
      amount: numAmount,
      amountPaid: numPaid,
      currency: '$',
      status: finalStatus,
      poNumber: poNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      imageUrl: uploadedImage || undefined,
      scannedBreakdown: scannedBreakdown || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {initialInvoice ? 'Edit Supplier Invoice' : 'Add New Supplier Invoice'}
              </h2>
              <p className="text-xs text-slate-400">
                Calculates due date & flags payment status automatically.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {!initialInvoice && onOpenBatchModal && (
            <div className="flex items-center justify-between p-2.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-indigo-200 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Entering multiple invoices at once?</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBatchModal();
                }}
                className="text-indigo-400 hover:text-indigo-200 font-semibold hover:underline"
              >
                Use Batch CSV Import &rarr;
              </button>
            </div>
          )}

          {/* Live Due Date Calculation Banner */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            liveCalc.flagStatus === 'OVERDUE'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : liveCalc.flagStatus === 'DUE_SOON'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                : liveCalc.flagStatus === 'PAID'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold uppercase tracking-wider text-[11px]">
                  Calculated Due Date:
                </span>
                <span className="text-base font-extrabold underline decoration-2">
                  {formatDateDisplay(liveDueDate)} ({liveDueDate})
                </span>
              </div>
              <p className="text-[11px] opacity-80">
                Formula: {invoiceDate} + {getTermLabel(paymentTerm, customDays)}
              </p>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900 border border-current shadow-sm">
                {liveCalc.flagStatus === 'OVERDUE' && '🚨 OVERDUE'}
                {liveCalc.flagStatus === 'DUE_SOON' && '⚠️ DUE SOON'}
                {liveCalc.flagStatus === 'UPCOMING' && '📅 UPCOMING'}
                {liveCalc.flagStatus === 'PAID' && '✅ SETTLED'}
                {liveCalc.flagStatus === 'ON_HOLD' && '⏸️ ON HOLD'}
                {' ('}{formatRelativeDays(liveCalc.daysRemaining, liveCalc.flagStatus)}{')'}
              </span>
            </div>
          </div>

          {/* AI Invoice Image Scan & Calculation Card */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-indigo-950/30 to-slate-950 rounded-xl border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                    <span>AI Invoice & PDF Scan & Calculation</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      OCR & Document AI
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Upload an invoice PDF or image photo to calculate totals and auto-fill supplier, dates & items.
                  </p>
                </div>
              </div>
            </div>

            {!uploadedImage ? (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 rounded-xl cursor-pointer bg-slate-900/60 hover:bg-slate-900 transition-all group">
                <Upload className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform mb-1.5" />
                <span className="text-xs font-semibold text-indigo-200">
                  Upload Invoice PDF or Image File
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Supports PDF documents, PNG, JPG, JPEG, WEBP (Paper invoices, PDF statements, receipts)
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    {uploadedMimeType.includes('pdf') || uploadedImage?.startsWith('data:application/pdf') || uploadedFileName.toLowerCase().endsWith('.pdf') ? (
                      <div className="w-12 h-12 bg-red-950/70 text-red-400 border border-red-500/30 rounded-md flex flex-col items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-red-400" />
                        <span className="text-[9px] font-extrabold tracking-wider mt-0.5">PDF</span>
                      </div>
                    ) : (
                      <img
                        src={uploadedImage}
                        alt="Uploaded Invoice"
                        className="w-12 h-12 object-cover rounded-md border border-slate-700 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-200 block truncate">
                        {uploadedFileName || (uploadedMimeType.includes('pdf') ? 'Attached Invoice Document.pdf' : 'Attached Invoice Photo')}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        {isScanning ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Analyzing with AI...
                          </span>
                        ) : scannedSuccess ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Extracted & Auto-Filled
                          </span>
                        ) : (
                          'Document attached'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => scanInvoiceImage(uploadedImage, uploadedMimeType)}
                      disabled={isScanning}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1 shadow transition-all"
                    >
                      {isScanning ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>{isScanning ? 'Scanning...' : 'Re-scan File'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUploadedImage(null);
                        setScannedSuccess(false);
                        setScannedBreakdown(null);
                        setScanError(null);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Remove attached image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {scanError && (
                  <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{scanError}</span>
                  </div>
                )}

                {scannedSuccess && scannedBreakdown && (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between text-emerald-300 font-bold border-b border-emerald-500/20 pb-1.5">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Calculated Financial Breakdown
                      </span>
                      <span className="font-mono text-sm text-emerald-200">
                        Total: ${amount || '0.00'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300">
                      {scannedBreakdown.subtotal !== undefined && (
                        <div>
                          <span className="text-slate-400 block">Subtotal</span>
                          <span className="font-mono font-semibold">${Number(scannedBreakdown.subtotal).toFixed(2)}</span>
                        </div>
                      )}
                      {scannedBreakdown.tax !== undefined && (
                        <div>
                          <span className="text-slate-400 block">Tax / VAT</span>
                          <span className="font-mono font-semibold">${Number(scannedBreakdown.tax).toFixed(2)}</span>
                        </div>
                      )}
                      {scannedBreakdown.shipping !== undefined && (
                        <div>
                          <span className="text-slate-400 block">Shipping / Fees</span>
                          <span className="font-mono font-semibold">${Number(scannedBreakdown.shipping).toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {scannedBreakdown.lineItems && scannedBreakdown.lineItems.length > 0 && (
                      <div className="pt-1.5 border-t border-emerald-500/20 text-[11px]">
                        <span className="font-semibold text-slate-300 block mb-1">
                          Extracted Line Items ({scannedBreakdown.lineItems.length}):
                        </span>
                        <ul className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {scannedBreakdown.lineItems.map((item, idx) => (
                            <li key={idx} className="flex justify-between text-slate-300 bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
                              <span className="truncate pr-2">{item.description} (x{item.quantity || 1})</span>
                              <span className="font-mono font-semibold text-emerald-300 shrink-0">${Number(item.total || 0).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Supplier Name & Invoice Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Supplier Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                list="suppliers-list"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Apex Raw Materials Ltd"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <datalist id="suppliers-list">
                {existingSuppliers.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Invoice Number / Ref # <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-2026-081"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Category & PO Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">PO / Reference #</label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. PO-9912"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Invoice Date & Payment Term Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Invoice Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                Payment Term <span className="text-rose-400">*</span>
              </label>
              <select
                value={paymentTerm}
                onChange={(e) => setPaymentTerm(e.target.value as PaymentTermType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {PAYMENT_TERMS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {paymentTerm === 'CUSTOM' && (
              <div className="sm:col-span-2 mt-2">
                <label className="block font-semibold text-slate-300 mb-1">Custom Credit Days</label>
                <input
                  type="number"
                  min={0}
                  value={customDays}
                  onChange={(e) => setCustomDays(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Amount & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Total Amount ($) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1500.00"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Amount Paid So Far ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Payment Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial Payment</option>
                <option value="PAID">Paid in Full</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Notes / Item Details</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Delivered to Warehouse B. Contact: John @ Ext 402"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              {initialInvoice ? 'Update Invoice' : 'Save Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
