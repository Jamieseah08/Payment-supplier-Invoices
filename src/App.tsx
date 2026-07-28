/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ReferenceDateBanner } from './components/ReferenceDateBanner';
import { KpiCards } from './components/KpiCards';
import { InvoiceTable } from './components/InvoiceTable';
import { InvoiceModal } from './components/InvoiceModal';
import { PaymentModal } from './components/PaymentModal';
import { BatchImportModal } from './components/BatchImportModal';
import { CashflowTimeline } from './components/CashflowTimeline';
import { SupplierSummary } from './components/SupplierSummary';
import { ExportSummaryModal } from './components/ExportSummaryModal';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';

import { Invoice, AppSettings, FilterOptions, PaymentRecord } from './types';
import { INITIAL_INVOICES } from './data/sampleInvoices';
import { getCalculatedStatus, calculateDueDate } from './utils/dateUtils';
import { RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';

const STORAGE_KEY_INVOICES = 'supplier_tracker_invoices_user_only_v4';
const STORAGE_KEY_SETTINGS = 'supplier_tracker_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  referenceDate: '2026-08-31',
  dueSoonThresholdDays: 7,
  companyName: 'Small Business Operations',
  currencySymbol: '$',
};

const DEFAULT_FILTERS: FilterOptions = {
  searchQuery: '',
  statusFilter: 'ALL',
  categoryFilter: '',
  supplierFilter: '',
  termFilter: '',
  sortBy: 'DUE_DATE_ASC',
};

export default function App() {
  // 1. App State & Settings
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INVOICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load saved invoices', e);
    }
    return INITIAL_INVOICES;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to load settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [activeView, setActiveView] = useState<'list' | 'timeline' | 'suppliers'>('list');
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);

  // 2. Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [presetSupplierName, setPresetSupplierName] = useState<string | undefined>(undefined);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));
    } catch (e) {
      console.error('Failed to persist invoices', e);
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to persist settings', e);
    }
  }, [settings]);

  // Derived counts
  const overdueCount = useMemo(() => {
    return invoices.filter(
      (i) => i.status !== 'PAID' && getCalculatedStatus(i, settings.referenceDate, settings.dueSoonThresholdDays).flagStatus === 'OVERDUE'
    ).length;
  }, [invoices, settings]);

  const dueSoonCount = useMemo(() => {
    return invoices.filter(
      (i) => i.status !== 'PAID' && getCalculatedStatus(i, settings.referenceDate, settings.dueSoonThresholdDays).flagStatus === 'DUE_SOON'
    ).length;
  }, [invoices, settings]);

  const existingSuppliers = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((i) => set.add(i.supplierName));
    return Array.from(set);
  }, [invoices]);

  // Handlers
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleUpdateFilters = (newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleSaveInvoice = (invoiceData: Partial<Invoice>) => {
    if (invoiceData.id) {
      // Edit existing
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoiceData.id ? ({ ...inv, ...invoiceData } as Invoice) : inv))
      );
    } else {
      // Create new
      const newInv: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: invoiceData.invoiceNumber || `INV-${Date.now()}`,
        supplierName: invoiceData.supplierName || 'New Supplier',
        category: invoiceData.category || 'Raw Materials',
        invoiceDate: invoiceData.invoiceDate || '2026-08-15',
        paymentTerm: invoiceData.paymentTerm || 'NET_30',
        customDays: invoiceData.customDays,
        calculatedDueDate: invoiceData.calculatedDueDate || calculateDueDate(invoiceData.invoiceDate || '2026-08-15', invoiceData.paymentTerm || 'NET_30', invoiceData.customDays),
        amount: invoiceData.amount || 0,
        amountPaid: invoiceData.amountPaid || 0,
        currency: '$',
        status: invoiceData.status || 'UNPAID',
        poNumber: invoiceData.poNumber,
        notes: invoiceData.notes,
        payments: [],
        createdAt: new Date().toISOString(),
      };
      setInvoices((prev) => [newInv, ...prev]);
    }
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      setInvoices((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleMarkPaid = (inv: Invoice) => {
    const fullAmount = inv.amount;
    const fullPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      amount: Math.max(0, fullAmount - (inv.amountPaid || 0)),
      date: settings.referenceDate,
      method: 'Bank Transfer',
      note: 'Full settlement marked via quick action',
    };

    setInvoices((prev) =>
      prev.map((i) =>
        i.id === inv.id
          ? {
              ...i,
              status: 'PAID',
              amountPaid: fullAmount,
              payments: [...i.payments, fullPayment],
            }
          : i
      )
    );
  };

  const handleRecordPayment = (invoiceId: string, payment: PaymentRecord) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;

        const updatedPaid = (inv.amountPaid || 0) + payment.amount;
        let newStatus = inv.status;

        if (updatedPaid >= inv.amount) {
          newStatus = 'PAID';
        } else if (updatedPaid > 0) {
          newStatus = 'PARTIAL';
        }

        return {
          ...inv,
          amountPaid: updatedPaid,
          status: newStatus,
          payments: [...inv.payments, payment],
        };
      })
    );
  };

  const handleImportInvoices = (imported: Invoice[]) => {
    setInvoices((prev) => [...imported, ...prev]);
  };

  const handleResetData = () => {
    if (window.confirm('Clear all invoices and start fresh?')) {
      setInvoices([]);
      setSettings(DEFAULT_SETTINGS);
      setFilters(DEFAULT_FILTERS);
      localStorage.removeItem(STORAGE_KEY_INVOICES);
      localStorage.removeItem(STORAGE_KEY_SETTINGS);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navbar Header */}
      <Header
        onOpenAddModal={() => {
          setEditingInvoice(null);
          setPresetSupplierName(undefined);
          setIsInvoiceModalOpen(true);
        }}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
        totalInvoicesCount={invoices.length}
        referenceDate={settings.referenceDate}
      />

      {/* Reference Date Bar & Calculation Guide */}
      <ReferenceDateBanner
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        overdueCount={overdueCount}
        dueSoonCount={dueSoonCount}
      />

      {/* Main Body Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* KPI Metrics Header */}
        <KpiCards
          invoices={invoices}
          settings={settings}
          activeFilterStatus={filters.statusFilter}
          onSelectStatusFilter={(status) => {
            setActiveView('list');
            handleUpdateFilters({ statusFilter: status });
          }}
        />

        {/* View Switching */}
        {activeView === 'list' && (
          <InvoiceTable
            invoices={invoices}
            settings={settings}
            filters={filters}
            onUpdateFilters={handleUpdateFilters}
            onEditInvoice={(inv) => {
              setEditingInvoice(inv);
              setPresetSupplierName(undefined);
              setIsInvoiceModalOpen(true);
            }}
            onDeleteInvoice={handleDeleteInvoice}
            onMarkPaid={handleMarkPaid}
            onRecordPayment={(inv) => {
              setPaymentInvoice(inv);
              setIsPaymentModalOpen(true);
            }}
            onSelectInvoiceForDetail={(inv) => setDetailInvoice(inv)}
            onOpenAddModal={() => {
              setEditingInvoice(null);
              setPresetSupplierName(undefined);
              setIsInvoiceModalOpen(true);
            }}
          />
        )}

        {activeView === 'timeline' && (
          <CashflowTimeline
            invoices={invoices}
            settings={settings}
            onSelectInvoice={(inv) => setDetailInvoice(inv)}
            onMarkPaid={handleMarkPaid}
          />
        )}

        {activeView === 'suppliers' && (
          <SupplierSummary
            invoices={invoices}
            settings={settings}
            onFilterBySupplier={(supplierName) => {
              handleUpdateFilters({ supplierFilter: supplierName, statusFilter: 'ALL' });
              setActiveView('list');
            }}
            onAddInvoiceForSupplier={(supplierName) => {
              setEditingInvoice(null);
              setPresetSupplierName(supplierName);
              setIsInvoiceModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Small Business Payment Due Date Engine • Evaluated on <strong>31 August 2026</strong></span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-amber-400 flex items-center space-x-1 underline transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sample Data</span>
            </button>
            <span>Auto-Calculates Net Terms & EOM</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setEditingInvoice(null);
          setPresetSupplierName(undefined);
        }}
        onSave={handleSaveInvoice}
        initialInvoice={editingInvoice}
        initialSupplierName={presetSupplierName}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        settings={settings}
        existingSuppliers={existingSuppliers}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentInvoice(null);
        }}
        invoice={paymentInvoice}
        settings={settings}
        onRecordPayment={handleRecordPayment}
      />

      <BatchImportModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onImportInvoices={handleImportInvoices}
        settings={settings}
      />

      <ExportSummaryModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        invoices={invoices}
        settings={settings}
      />

      <InvoiceDetailModal
        isOpen={Boolean(detailInvoice)}
        onClose={() => setDetailInvoice(null)}
        invoice={detailInvoice}
        settings={settings}
        onRecordPayment={(inv) => {
          setPaymentInvoice(inv);
          setIsPaymentModalOpen(true);
        }}
        onEditInvoice={(inv) => {
          setEditingInvoice(inv);
          setIsInvoiceModalOpen(true);
        }}
      />
    </div>
  );
}
