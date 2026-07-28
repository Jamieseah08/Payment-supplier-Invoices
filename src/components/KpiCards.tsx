import React from 'react';
import { AlertTriangle, Clock, CalendarCheck, DollarSign, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Invoice, AppSettings } from '../types';
import { getCalculatedStatus, formatCurrency } from '../utils/dateUtils';

interface KpiCardsProps {
  invoices: Invoice[];
  settings: AppSettings;
  activeFilterStatus: string;
  onSelectStatusFilter: (status: 'ALL' | 'OVERDUE' | 'DUE_SOON' | 'UPCOMING' | 'PAID' | 'ON_HOLD') => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  invoices,
  settings,
  activeFilterStatus,
  onSelectStatusFilter,
}) => {
  let totalOutstanding = 0;
  let totalOutstandingCount = 0;

  let totalOverdue = 0;
  let overdueCount = 0;

  let totalDueSoon = 0;
  let dueSoonCount = 0;

  let totalUpcoming = 0;
  let upcomingCount = 0;

  let totalPaid = 0;
  let paidCount = 0;

  invoices.forEach((inv) => {
    const calc = getCalculatedStatus(inv, settings.referenceDate, settings.dueSoonThresholdDays);

    if (inv.status === 'PAID') {
      totalPaid += inv.amount;
      paidCount++;
      return;
    }

    if (calc.outstandingAmount > 0) {
      totalOutstanding += calc.outstandingAmount;
      totalOutstandingCount++;

      if (calc.flagStatus === 'OVERDUE') {
        totalOverdue += calc.outstandingAmount;
        overdueCount++;
      } else if (calc.flagStatus === 'DUE_SOON') {
        totalDueSoon += calc.outstandingAmount;
        dueSoonCount++;
      } else if (calc.flagStatus === 'UPCOMING') {
        totalUpcoming += calc.outstandingAmount;
        upcomingCount++;
      }
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 my-4">
      {/* 1. Total Outstanding */}
      <div 
        onClick={() => onSelectStatusFilter('ALL')}
        className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-indigo-500/50 ${
          activeFilterStatus === 'ALL' ? 'border-indigo-500 ring-1 ring-indigo-500/30 bg-indigo-950/20' : 'border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Outstanding</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-slate-100">
          {formatCurrency(totalOutstanding, settings.currencySymbol)}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
          <span>{totalOutstandingCount} Pending Invoices</span>
          <span className="text-indigo-400 font-medium">All Open</span>
        </div>
      </div>

      {/* 2. Overdue */}
      <div 
        onClick={() => onSelectStatusFilter('OVERDUE')}
        className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-rose-500/50 ${
          activeFilterStatus === 'OVERDUE' 
            ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-950/30' 
            : overdueCount > 0 
              ? 'border-rose-900/80 bg-rose-950/10' 
              : 'border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Overdue
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-rose-400">
          {formatCurrency(totalOverdue, settings.currencySymbol)}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-rose-300/80">
          <span className="font-medium">{overdueCount} {overdueCount === 1 ? 'Invoice' : 'Invoices'} Overdue</span>
          <span className="text-rose-400 font-semibold underline">Filter &rarr;</span>
        </div>
      </div>

      {/* 3. Due Soon */}
      <div 
        onClick={() => onSelectStatusFilter('DUE_SOON')}
        className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-amber-500/50 ${
          activeFilterStatus === 'DUE_SOON' 
            ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-950/30' 
            : dueSoonCount > 0 
              ? 'border-amber-900/60 bg-amber-950/10' 
              : 'border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Due Soon ({settings.dueSoonThresholdDays}d)
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-amber-300">
          {formatCurrency(totalDueSoon, settings.currencySymbol)}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-amber-300/80">
          <span>{dueSoonCount} {dueSoonCount === 1 ? 'Invoice' : 'Invoices'} Due Soon</span>
          <span className="text-amber-400 font-semibold underline">Filter &rarr;</span>
        </div>
      </div>

      {/* 4. Upcoming */}
      <div 
        onClick={() => onSelectStatusFilter('UPCOMING')}
        className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-blue-500/50 ${
          activeFilterStatus === 'UPCOMING' ? 'border-blue-500 ring-1 ring-blue-500/30 bg-blue-950/20' : 'border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Upcoming</span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-slate-100">
          {formatCurrency(totalUpcoming, settings.currencySymbol)}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
          <span>{upcomingCount} Invoices On Track</span>
          <span className="text-blue-400 font-medium">&gt; {settings.dueSoonThresholdDays} Days</span>
        </div>
      </div>

      {/* 5. Total Paid */}
      <div 
        onClick={() => onSelectStatusFilter('PAID')}
        className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-emerald-500/50 ${
          activeFilterStatus === 'PAID' ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-950/20' : 'border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Total Paid</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-400">
          {formatCurrency(totalPaid, settings.currencySymbol)}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-emerald-300/80">
          <span>{paidCount} Settled Invoices</span>
          <span className="text-emerald-400 font-medium">Cleared</span>
        </div>
      </div>
    </div>
  );
};
