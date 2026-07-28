import React, { useMemo } from 'react';
import { Users, AlertTriangle, CheckCircle2, Building, ArrowUpRight, DollarSign, PlusCircle } from 'lucide-react';
import { Invoice, AppSettings } from '../types';
import { getCalculatedStatus, formatCurrency } from '../utils/dateUtils';

interface SupplierSummaryProps {
  invoices: Invoice[];
  settings: AppSettings;
  onFilterBySupplier: (supplierName: string) => void;
  onAddInvoiceForSupplier?: (supplierName: string) => void;
}

interface SupplierStat {
  name: string;
  totalInvoicesCount: number;
  unpaidCount: number;
  overdueCount: number;
  dueSoonCount: number;
  totalOutstandingAmount: number;
  totalPaidAmount: number;
  categories: string[];
}

export const SupplierSummary: React.FC<SupplierSummaryProps> = ({
  invoices,
  settings,
  onFilterBySupplier,
  onAddInvoiceForSupplier,
}) => {
  const supplierStats = useMemo(() => {
    const map = new Map<string, SupplierStat>();

    invoices.forEach((inv) => {
      const calc = getCalculatedStatus(inv, settings.referenceDate, settings.dueSoonThresholdDays);

      let stat = map.get(inv.supplierName);
      if (!stat) {
        stat = {
          name: inv.supplierName,
          totalInvoicesCount: 0,
          unpaidCount: 0,
          overdueCount: 0,
          dueSoonCount: 0,
          totalOutstandingAmount: 0,
          totalPaidAmount: 0,
          categories: [],
        };
        map.set(inv.supplierName, stat);
      }

      stat.totalInvoicesCount++;
      if (!stat.categories.includes(inv.category)) {
        stat.categories.push(inv.category);
      }

      if (inv.status === 'PAID') {
        stat.totalPaidAmount += inv.amount;
      } else {
        stat.unpaidCount++;
        stat.totalOutstandingAmount += calc.outstandingAmount;

        if (calc.flagStatus === 'OVERDUE') {
          stat.overdueCount++;
        } else if (calc.flagStatus === 'DUE_SOON') {
          stat.dueSoonCount++;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      // Sort by overdue count descending, then total outstanding descending
      if (b.overdueCount !== a.overdueCount) return b.overdueCount - a.overdueCount;
      return b.totalOutstandingAmount - a.totalOutstandingAmount;
    });
  }, [invoices, settings]);

  return (
    <div className="space-y-4 my-4">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Supplier Accounts & Credit Risk Directory
            </h2>
            <p className="text-xs text-slate-400">
              Breakdown of total business exposure, overdue counts, and payment history per vendor.
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Total Vendors Tracked: <strong className="text-slate-200">{supplierStats.length}</strong>
        </div>
      </div>

      {/* Grid of Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {supplierStats.map((stat) => {
          const hasOverdue = stat.overdueCount > 0;
          const hasDueSoon = stat.dueSoonCount > 0;

          return (
            <div
              key={stat.name}
              className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between transition-all hover:border-slate-700 shadow-lg ${
                hasOverdue
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : hasDueSoon
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-slate-100 text-sm">
                    {stat.name}
                  </div>
                  {hasOverdue ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {stat.overdueCount} Overdue
                    </span>
                  ) : stat.unpaidCount === 0 ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      All Clear
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {stat.unpaidCount} Pending
                    </span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap gap-1">
                  {stat.categories.map((cat) => (
                    <span key={cat} className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {cat}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Total Outstanding</span>
                    <strong className="text-sm font-bold text-slate-100 font-mono">
                      {formatCurrency(stat.totalOutstandingAmount, settings.currencySymbol)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Total Settled</span>
                    <strong className="text-sm font-bold text-emerald-400 font-mono">
                      {formatCurrency(stat.totalPaidAmount, settings.currencySymbol)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                {onAddInvoiceForSupplier && (
                  <button
                    onClick={() => onAddInvoiceForSupplier(stat.name)}
                    className="text-slate-300 hover:text-indigo-400 font-medium flex items-center space-x-1 transition-colors"
                    title={`Add new invoice for ${stat.name}`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>+ Add Invoice</span>
                  </button>
                )}
                <button
                  onClick={() => onFilterBySupplier(stat.name)}
                  className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1 group ml-auto"
                >
                  <span>View Invoices ({stat.totalInvoicesCount})</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
