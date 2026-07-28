import React, { useState } from 'react';
import { Calendar, AlertCircle, Clock, RotateCcw, Info, Settings2, CheckCircle2 } from 'lucide-react';
import { AppSettings } from '../types';

interface ReferenceDateBannerProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  overdueCount: number;
  dueSoonCount: number;
}

export const ReferenceDateBanner: React.FC<ReferenceDateBannerProps> = ({
  settings,
  onUpdateSettings,
  overdueCount,
  dueSoonCount,
}) => {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState(settings.referenceDate);
  const [showTermGuide, setShowTermGuide] = useState(false);

  const handleSaveDate = () => {
    if (tempDate) {
      onUpdateSettings({ referenceDate: tempDate });
      setIsEditingDate(false);
    }
  };

  const handleResetDate = () => {
    const defaultDate = '2026-08-31';
    setTempDate(defaultDate);
    onUpdateSettings({ referenceDate: defaultDate });
    setIsEditingDate(false);
  };

  return (
    <div className="bg-slate-800/90 border-b border-slate-700/80 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          
          {/* Reference Date Indicator */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Reference Date:</span>
              <strong className="text-amber-200 font-semibold">{settings.referenceDate}</strong>
            </span>

            {isEditingDate ? (
              <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-md border border-slate-700">
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="bg-slate-800 text-slate-100 text-xs px-2 py-0.5 rounded border border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  id="btn-save-ref-date"
                  onClick={handleSaveDate}
                  className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
                >
                  Apply
                </button>
                <button
                  id="btn-cancel-ref-date"
                  onClick={() => setIsEditingDate(false)}
                  className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <button
                  id="btn-edit-ref-date"
                  onClick={() => setIsEditingDate(true)}
                  className="text-slate-400 hover:text-slate-200 underline underline-offset-2 flex items-center space-x-1"
                >
                  <Settings2 className="w-3 h-3" />
                  <span>Change Date</span>
                </button>
                {settings.referenceDate !== '2026-08-31' && (
                  <button
                    id="btn-reset-ref-date"
                    onClick={handleResetDate}
                    className="text-amber-400 hover:text-amber-300 underline underline-offset-2 flex items-center space-x-1 ml-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to 31 Aug 2026</span>
                  </button>
                )}
              </div>
            )}

            <div className="hidden lg:block border-r border-slate-700 h-4 mx-1"></div>

            {/* Threshold dropdown */}
            <div className="flex items-center space-x-1 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Flag 'Due Soon' within:</span>
              <select
                id="select-due-soon-threshold"
                value={settings.dueSoonThresholdDays}
                onChange={(e) => onUpdateSettings({ dueSoonThresholdDays: Number(e.target.value) })}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value={3}>3 Days</option>
                <option value={7}>7 Days (Default)</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>
          </div>

          {/* Quick Warning Status & Terms Guide Trigger */}
          <div className="flex items-center space-x-3">
            {overdueCount > 0 && (
              <span className="flex items-center space-x-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-medium animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{overdueCount} Overdue</span>
              </span>
            )}
            {dueSoonCount > 0 && (
              <span className="flex items-center space-x-1 text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>{dueSoonCount} Due Soon</span>
              </span>
            )}

            <button
              id="btn-toggle-terms-guide"
              onClick={() => setShowTermGuide(!showTermGuide)}
              className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-medium underline underline-offset-2"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{showTermGuide ? 'Hide Terms Rulebook' : 'Payment Terms Rules'}</span>
            </button>
          </div>
        </div>

        {/* Expandable Payment Terms Guide */}
        {showTermGuide && (
          <div className="mt-2.5 p-3 bg-slate-900/90 rounded-lg border border-slate-700/80 text-xs space-y-2 text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Automatic Due Date Calculation Formulae
              </span>
              <span className="text-slate-400 text-[11px]">System automatically parses dates upon entry</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
              <div className="bg-slate-800/60 p-2 rounded border border-slate-700/50">
                <strong className="text-indigo-300">Net Terms (Net 7 / 15 / 30 / 60)</strong>
                <p className="text-slate-400 mt-0.5">Due Date = Invoice Date + X calendar days.</p>
              </div>
              <div className="bg-slate-800/60 p-2 rounded border border-slate-700/50">
                <strong className="text-indigo-300">Due on Receipt</strong>
                <p className="text-slate-400 mt-0.5">Due Date = Same as Invoice Date.</p>
              </div>
              <div className="bg-slate-800/60 p-2 rounded border border-slate-700/50">
                <strong className="text-indigo-300">End of Month (EOM)</strong>
                <p className="text-slate-400 mt-0.5">Due Date = Last calendar day of Invoice Month.</p>
              </div>
              <div className="bg-slate-800/60 p-2 rounded border border-slate-700/50">
                <strong className="text-indigo-300">EOM + 15 / EOM + 30</strong>
                <p className="text-slate-400 mt-0.5">Due Date = End of Invoice Month + 15 or 30 days.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
