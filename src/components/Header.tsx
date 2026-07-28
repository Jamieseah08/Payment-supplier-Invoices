import React from 'react';
import { 
  Building2, 
  PlusCircle, 
  FileSpreadsheet, 
  TrendingUp, 
  CalendarDays, 
  Download, 
  RefreshCw,
  Users,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenBatchModal: () => void;
  onOpenExportModal: () => void;
  activeView: 'list' | 'timeline' | 'suppliers';
  setActiveView: (view: 'list' | 'timeline' | 'suppliers') => void;
  totalInvoicesCount: number;
  referenceDate: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenBatchModal,
  onOpenExportModal,
  activeView,
  setActiveView,
  totalInvoicesCount,
  referenceDate,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Context Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-100">
                  Supplier Payment Tracker
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Small Business Edition
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Evaluation Date: <strong className="text-amber-400 font-medium">{referenceDate}</strong></span>
                <span className="text-slate-600">•</span>
                <span>{totalInvoicesCount} Total Invoices</span>
              </p>
            </div>
          </div>

          {/* Navigation View Selector */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/80 self-start md:self-auto">
            <button
              id="view-tab-list"
              onClick={() => setActiveView('list')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Invoices List</span>
            </button>
            <button
              id="view-tab-timeline"
              onClick={() => setActiveView('timeline')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Cash Outflow Timeline</span>
            </button>
            <button
              id="view-tab-suppliers"
              onClick={() => setActiveView('suppliers')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === 'suppliers'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Suppliers View</span>
            </button>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-scan-invoice"
              onClick={onOpenAddModal}
              className="px-3 py-1.5 rounded-lg border border-indigo-500/40 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 hover:from-indigo-800/80 hover:to-purple-800/80 text-indigo-200 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
              title="Upload invoice image or photo to auto-calculate details"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Scan Image</span>
            </button>

            <button
              id="btn-batch-import"
              onClick={onOpenBatchModal}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1.5 transition-colors"
              title="Import or paste multiple invoices"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Batch Import</span>
            </button>

            <button
              id="btn-export-summary"
              onClick={onOpenExportModal}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1.5 transition-colors"
              title="Export report or CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              id="btn-add-invoice"
              onClick={onOpenAddModal}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center space-x-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
