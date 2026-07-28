import React, { useMemo } from 'react';
import { CalendarDays, AlertTriangle, Clock, ArrowRight, DollarSign, Building2, CheckCircle2 } from 'lucide-react';
import { Invoice, AppSettings } from '../types';
import { getCalculatedStatus, formatDateDisplay, formatCurrency, formatRelativeDays } from '../utils/dateUtils';

interface CashflowTimelineProps {
  invoices: Invoice[];
  settings: AppSettings;
  onSelectInvoice: (invoice: Invoice) => void;
  onMarkPaid: (invoice: Invoice) => void;
}

interface TimeBucket {
  id: string;
  title: string;
  description: string;
  badgeColor: string;
  invoices: Invoice[];
  totalAmount: number;
}

export const CashflowTimeline: React.FC<CashflowTimelineProps> = ({
  invoices,
  settings,
  onSelectInvoice,
  onMarkPaid,
}) => {
  const buckets = useMemo(() => {
    const overdueList: Invoice[] = [];
    const dueThisWeekList: Invoice[] = [];
    const dueNextWeekList: Invoice[] = [];
    const dueLaterList: Invoice[] = [];
    const paidList: Invoice[] = [];

    invoices.forEach((inv) => {
      const calc = getCalculatedStatus(inv, settings.referenceDate, settings.dueSoonThresholdDays);

      if (inv.status === 'PAID') {
        paidList.push(inv);
        return;
      }

      if (calc.flagStatus === 'OVERDUE') {
        overdueList.push(inv);
      } else if (calc.daysRemaining <= 7) {
        dueThisWeekList.push(inv);
      } else if (calc.daysRemaining <= 14) {
        dueNextWeekList.push(inv);
      } else {
        dueLaterList.push(inv);
      }
    });

    const calculateTotal = (list: Invoice[]) =>
      list.reduce((sum, item) => sum + Math.max(0, item.amount - (item.amountPaid || 0)), 0);

    const timeBuckets: TimeBucket[] = [
      {
        id: 'overdue',
        title: '🚨 Overdue Outflow Required Immediately',
        description: 'Past due date relative to 31 Aug 2026. Immediate supplier hold risk.',
        badgeColor: 'border-rose-500/50 bg-rose-950/20 text-rose-300',
        invoices: overdueList,
        totalAmount: calculateTotal(overdueList),
      },
      {
        id: 'this_week',
        title: '⚠️ Immediate Focus (Next 7 Days)',
        description: 'Due between 31 Aug and 07 Sep 2026.',
        badgeColor: 'border-amber-500/50 bg-amber-950/20 text-amber-300',
        invoices: dueThisWeekList,
        totalAmount: calculateTotal(dueThisWeekList),
      },
      {
        id: 'next_week',
        title: '🗓️ Week 2 Cash Requirement (8–14 Days)',
        description: 'Due between 08 Sep and 14 Sep 2026.',
        badgeColor: 'border-indigo-500/50 bg-indigo-950/20 text-indigo-300',
        invoices: dueNextWeekList,
        totalAmount: calculateTotal(dueNextWeekList),
      },
      {
        id: 'later',
        title: '📅 Later Outflow Forecast (> 14 Days)',
        description: 'Due after 14 Sep 2026.',
        badgeColor: 'border-blue-500/50 bg-blue-950/20 text-blue-300',
        invoices: dueLaterList,
        totalAmount: calculateTotal(dueLaterList),
      },
    ];

    return timeBuckets;
  }, [invoices, settings]);

  return (
    <div className="space-y-6 my-4">
      {/* View Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Supplier Cash Outflow Forecast
            </h2>
            <p className="text-xs text-slate-400">
              Weekly payment timeline based on calculated invoice due dates relative to <strong className="text-amber-400">{settings.referenceDate}</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Bucket Cards */}
      <div className="grid grid-cols-1 gap-6">
        {buckets.map((bucket) => (
          <div
            key={bucket.id}
            className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all ${
              bucket.invoices.length > 0 ? bucket.badgeColor : 'border-slate-800/80 bg-slate-900/50'
            }`}
          >
            {/* Bucket Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>{bucket.title}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {bucket.invoices.length} {bucket.invoices.length === 1 ? 'Invoice' : 'Invoices'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{bucket.description}</p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Total Outflow</span>
                <strong className="text-lg font-bold text-slate-100 font-mono">
                  {formatCurrency(bucket.totalAmount, settings.currencySymbol)}
                </strong>
              </div>
            </div>

            {/* Invoices List in Bucket */}
            {bucket.invoices.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 italic">
                No invoices due in this timeframe.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {bucket.invoices.map((inv) => {
                  const calc = getCalculatedStatus(inv, settings.referenceDate, settings.dueSoonThresholdDays);
                  return (
                    <div
                      key={inv.id}
                      className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between transition-all group"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-indigo-300">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-[11px] font-semibold text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {inv.paymentTerm}
                          </span>
                        </div>

                        <div className="mt-1 font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                          {inv.supplierName}
                        </div>

                        <div className="text-xs text-slate-400 mt-0.5 flex items-center justify-between">
                          <span>Inv Date: {inv.invoiceDate}</span>
                          <span className="font-semibold text-slate-200">Due: {calc.dueDate}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-100 font-mono">
                            {formatCurrency(calc.outstandingAmount, settings.currencySymbol)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formatRelativeDays(calc.daysRemaining, calc.flagStatus)}
                          </div>
                        </div>

                        <button
                          onClick={() => onMarkPaid(inv)}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-xs font-semibold transition-all border border-emerald-500/30 flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Pay Now</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
