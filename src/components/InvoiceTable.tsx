import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  PauseCircle, 
  DollarSign, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  CreditCard, 
  Check, 
  Calendar,
  Tag,
  Building,
  FileText,
  Plus,
  PlusCircle,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import { Invoice, FilterOptions, AppSettings, DueFlagStatus, CategoryType } from '../types';
import { 
  getCalculatedStatus, 
  getTermLabel, 
  formatDateDisplay, 
  formatRelativeDays, 
  formatCurrency 
} from '../utils/dateUtils';

interface InvoiceTableProps {
  invoices: Invoice[];
  settings: AppSettings;
  filters: FilterOptions;
  onUpdateFilters: (newFilters: Partial<FilterOptions>) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onMarkPaid: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onSelectInvoiceForDetail: (invoice: Invoice) => void;
  onOpenAddModal: () => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  settings,
  filters,
  onUpdateFilters,
  onEditInvoice,
  onDeleteInvoice,
  onMarkPaid,
  onRecordPayment,
  onSelectInvoiceForDetail,
  onOpenAddModal,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Extract unique categories & suppliers for dropdown options
  const categories = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach(i => set.add(i.category));
    return Array.from(set).sort();
  }, [invoices]);

  const suppliers = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach(i => set.add(i.supplierName));
    return Array.from(set).sort();
  }, [invoices]);

  // Filter & Sort Logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const calc = getCalculatedStatus(inv, settings.referenceDate, settings.dueSoonThresholdDays);

      // Search Query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSupplier = inv.supplierName.toLowerCase().includes(query);
        const matchesNumber = inv.invoiceNumber.toLowerCase().includes(query);
        const matchesPo = (inv.poNumber || '').toLowerCase().includes(query);
        const matchesNotes = (inv.notes || '').toLowerCase().includes(query);
        if (!matchesSupplier && !matchesNumber && !matchesPo && !matchesNotes) {
          return false;
        }
      }

      // Status Filter
      if (filters.statusFilter !== 'ALL') {
        if (filters.statusFilter === 'OVERDUE' && calc.flagStatus !== 'OVERDUE') return false;
        if (filters.statusFilter === 'DUE_SOON' && calc.flagStatus !== 'DUE_SOON') return false;
        if (filters.statusFilter === 'UPCOMING' && calc.flagStatus !== 'UPCOMING') return false;
        if (filters.statusFilter === 'PAID' && calc.flagStatus !== 'PAID') return false;
        if (filters.statusFilter === 'ON_HOLD' && inv.status !== 'ON_HOLD') return false;
      }

      // Category Filter
      if (filters.categoryFilter && inv.category !== filters.categoryFilter) {
        return false;
      }

      // Supplier Filter
      if (filters.supplierFilter && inv.supplierName !== filters.supplierFilter) {
        return false;
      }

      // Term Filter
      if (filters.termFilter && inv.paymentTerm !== filters.termFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const calcA = getCalculatedStatus(a, settings.referenceDate, settings.dueSoonThresholdDays);
      const calcB = getCalculatedStatus(b, settings.referenceDate, settings.dueSoonThresholdDays);

      switch (filters.sortBy) {
        case 'DUE_DATE_ASC':
          return calcA.dueDate.localeCompare(calcB.dueDate);
        case 'DUE_DATE_DESC':
          return calcB.dueDate.localeCompare(calcA.dueDate);
        case 'AMOUNT_DESC':
          return b.amount - a.amount;
        case 'AMOUNT_ASC':
          return a.amount - b.amount;
        case 'SUPPLIER_ASC':
          return a.supplierName.localeCompare(b.supplierName);
        case 'INVOICE_DATE_DESC':
          return b.invoiceDate.localeCompare(a.invoiceDate);
        default:
          return calcA.dueDate.localeCompare(calcB.dueDate);
      }
    });
  }, [invoices, filters, settings]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredInvoices.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBatchMarkPaid = () => {
    selectedIds.forEach(id => {
      const inv = invoices.find(i => i.id === id);
      if (inv && inv.status !== 'PAID') {
        onMarkPaid(inv);
      }
    });
    setSelectedIds([]);
  };

  const getFlagBadge = (flag: DueFlagStatus, days: number, status: string) => {
    if (status === 'ON_HOLD') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          <PauseCircle className="w-3.5 h-3.5 mr-1 text-slate-400" />
          On Hold
        </span>
      );
    }

    switch (flag) {
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-400" />
            {formatRelativeDays(days, flag)}
          </span>
        );
      case 'DUE_SOON':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" />
            {formatRelativeDays(days, flag)}
          </span>
        );
      case 'UPCOMING':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
            <Calendar className="w-3.5 h-3.5 mr-1 text-blue-400" />
            {formatRelativeDays(days, flag)}
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            Paid
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden my-4">
      
      {/* Search & Filter Control Bar */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-3">
        
        {/* Status Filter Tabs & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-thin">
            {[
              { id: 'ALL', label: 'All Invoices' },
              { id: 'OVERDUE', label: '🚨 Overdue' },
              { id: 'DUE_SOON', label: '⚠️ Due Soon' },
              { id: 'UPCOMING', label: '📅 Upcoming' },
              { id: 'PAID', label: '✅ Paid' },
              { id: 'ON_HOLD', label: '⏸️ On Hold' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onUpdateFilters({ statusFilter: tab.id as any })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filters.statusFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenAddModal}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm flex items-center justify-center space-x-1.5 transition-all self-start sm:self-auto shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Invoice</span>
          </button>
        </div>

        {/* Input Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          
          {/* Search Bar */}
          <div className="relative sm:col-span-2 lg:col-span-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onUpdateFilters({ searchQuery: e.target.value })}
              placeholder="Search supplier, invoice #, PO..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="lg:col-span-3">
            <select
              value={filters.categoryFilter}
              onChange={(e) => onUpdateFilters({ categoryFilter: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Supplier Dropdown */}
          <div className="lg:col-span-3">
            <select
              value={filters.supplierFilter}
              onChange={(e) => onUpdateFilters({ supplierFilter: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Suppliers ({suppliers.length})</option>
              {suppliers.map((sup) => (
                <option key={sup} value={sup}>{sup}</option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filters.sortBy}
                onChange={(e) => onUpdateFilters({ sortBy: e.target.value as any })}
                className="w-full bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="DUE_DATE_ASC">Due Date (Earliest)</option>
                <option value="DUE_DATE_DESC">Due Date (Latest)</option>
                <option value="AMOUNT_DESC">Amount (Highest)</option>
                <option value="AMOUNT_ASC">Amount (Lowest)</option>
                <option value="SUPPLIER_ASC">Supplier A-Z</option>
                <option value="INVOICE_DATE_DESC">Invoice Date (Newest)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Selected Items Batch Action Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-indigo-950/60 border border-indigo-500/40 px-3.5 py-2 rounded-lg text-xs animate-fadeIn">
            <span className="text-indigo-200 font-medium">
              <strong>{selectedIds.length}</strong> invoice{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBatchMarkPaid}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs font-semibold flex items-center space-x-1 shadow"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Selected as Paid</span>
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-slate-400 hover:text-slate-200 px-2 py-1 text-xs"
              >
                Deselect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Table Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={filteredInvoices.length > 0 && selectedIds.length === filteredInvoices.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="py-3 px-3 min-w-[140px]">Flag Status</th>
              <th className="py-3 px-3 min-w-[180px]">Invoice & Supplier</th>
              <th className="py-3 px-3 min-w-[120px]">Category</th>
              <th className="py-3 px-3 min-w-[110px]">Invoice Date</th>
              <th className="py-3 px-3 min-w-[120px]">Terms</th>
              <th className="py-3 px-3 min-w-[130px]">Calculated Due Date</th>
              <th className="py-3 px-3 text-right min-w-[130px]">Amount / Outstanding</th>
              <th className="py-3 px-3 text-center min-w-[110px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <FileText className="w-8 h-8 text-slate-600" />
                    <div>
                      <p className="text-slate-300 font-medium text-sm">No invoices match your active view or search query.</p>
                      <p className="text-xs text-slate-500 mt-0.5">Try clearing filters or add your own custom invoice below.</p>
                    </div>
                    <button
                      onClick={onOpenAddModal}
                      className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-all"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add Your Custom Invoice</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => {
                const calc = getCalculatedStatus(inv, settings.referenceDate, settings.dueSoonThresholdDays);
                const isSelected = selectedIds.includes(inv.id);

                return (
                  <tr 
                    key={inv.id} 
                    className={`hover:bg-slate-800/50 transition-colors ${
                      isSelected ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(inv.id)}
                        className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Flag Badge */}
                    <td className="py-3 px-3">
                      {getFlagBadge(calc.flagStatus, calc.daysRemaining, inv.status)}
                    </td>

                    {/* Invoice # & Supplier Name */}
                    <td className="py-3 px-3">
                      <button
                        onClick={() => onSelectInvoiceForDetail(inv)}
                        className="text-left group"
                      >
                        <div className="font-semibold text-slate-100 group-hover:text-indigo-400 flex items-center gap-1 transition-colors">
                          <span>{inv.supplierName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                          <span className="font-mono text-indigo-300">{inv.invoiceNumber}</span>
                          {inv.imageUrl && (
                            <span className="inline-flex items-center text-[10px] text-indigo-300 bg-indigo-500/20 px-1.5 py-0.2 rounded border border-indigo-500/30" title="Scanned from uploaded invoice photo">
                              <ImageIcon className="w-2.5 h-2.5 mr-0.5" /> Scanned
                            </span>
                          )}
                          {inv.poNumber && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500">{inv.poNumber}</span>
                            </>
                          )}
                        </div>
                      </button>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center text-[11px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/80">
                        <Tag className="w-3 h-3 mr-1 text-slate-400" />
                        {inv.category}
                      </span>
                    </td>

                    {/* Invoice Date */}
                    <td className="py-3 px-3 text-slate-300 font-medium">
                      {formatDateDisplay(inv.invoiceDate)}
                    </td>

                    {/* Payment Terms */}
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-semibold">
                        {getTermLabel(inv.paymentTerm, inv.customDays)}
                      </span>
                    </td>

                    {/* Calculated Due Date */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-100">
                        {formatDateDisplay(calc.dueDate)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {calc.dueDate}
                      </div>
                    </td>

                    {/* Amount & Outstanding */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-bold text-slate-100 text-sm">
                        {formatCurrency(inv.amount, settings.currencySymbol)}
                      </div>
                      {inv.status === 'PAID' ? (
                        <div className="text-[11px] text-emerald-400 font-medium">Fully Paid</div>
                      ) : inv.amountPaid > 0 ? (
                        <div className="text-[11px] text-amber-300 font-medium">
                          Bal: {formatCurrency(calc.outstandingAmount, settings.currencySymbol)}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">Unpaid</div>
                      )}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {inv.status !== 'PAID' && (
                          <button
                            onClick={() => onMarkPaid(inv)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                            title="Mark as Paid in full"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {inv.status !== 'PAID' && (
                          <button
                            onClick={() => onRecordPayment(inv)}
                            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-colors"
                            title="Record Partial Payment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onEditInvoice(inv)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Edit Invoice"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteInvoice(inv.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info Summary */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div>
          Showing <strong className="text-slate-200">{filteredInvoices.length}</strong> of <strong className="text-slate-200">{invoices.length}</strong> total invoices
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Overdue
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Due Soon
          </span>
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Upcoming
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Paid
          </span>
        </div>
      </div>
    </div>
  );
};
