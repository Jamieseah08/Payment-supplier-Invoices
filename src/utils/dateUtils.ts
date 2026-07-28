import { PaymentTermType, Invoice, CalculatedInvoiceStatus, DueFlagStatus } from '../types';

/**
 * Parses a YYYY-MM-DD string safely into UTC midnight Date object to avoid time zone drift
 */
export function parseIsoDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(dateStr);
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);
  return new Date(Date.UTC(year, month, day));
}

/**
 * Formats a Date object to YYYY-MM-DD string
 */
export function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the exact Due Date based on Invoice Date and Payment Term
 */
export function calculateDueDate(
  invoiceDateStr: string,
  term: PaymentTermType,
  customDays: number = 0
): string {
  const date = parseIsoDate(invoiceDateStr);
  if (isNaN(date.getTime())) return invoiceDateStr;

  switch (term) {
    case 'DUE_ON_RECEIPT':
      return invoiceDateStr;

    case 'NET_7':
      date.setUTCDate(date.getUTCDate() + 7);
      return formatIsoDate(date);

    case 'NET_15':
      date.setUTCDate(date.getUTCDate() + 15);
      return formatIsoDate(date);

    case 'NET_30':
      date.setUTCDate(date.getUTCDate() + 30);
      return formatIsoDate(date);

    case 'NET_45':
      date.setUTCDate(date.getUTCDate() + 45);
      return formatIsoDate(date);

    case 'NET_60':
      date.setUTCDate(date.getUTCDate() + 60);
      return formatIsoDate(date);

    case 'NET_90':
      date.setUTCDate(date.getUTCDate() + 90);
      return formatIsoDate(date);

    case 'EOM': {
      // Last day of invoice month
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      // Month + 1, day 0 gives last day of current month
      const lastDay = new Date(Date.UTC(year, month + 1, 0));
      return formatIsoDate(lastDay);
    }

    case 'EOM_15': {
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const lastDay = new Date(Date.UTC(year, month + 1, 0));
      lastDay.setUTCDate(lastDay.getUTCDate() + 15);
      return formatIsoDate(lastDay);
    }

    case 'EOM_30': {
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const lastDay = new Date(Date.UTC(year, month + 1, 0));
      lastDay.setUTCDate(lastDay.getUTCDate() + 30);
      return formatIsoDate(lastDay);
    }

    case 'CUSTOM': {
      date.setUTCDate(date.getUTCDate() + (customDays || 0));
      return formatIsoDate(date);
    }

    default:
      return invoiceDateStr;
  }
}

/**
 * Calculates calendar days difference between Due Date and Reference Date.
 * Positive = due in future.
 * 0 = due today.
 * Negative = overdue by X days.
 */
export function calculateDaysDifference(dueDateStr: string, referenceDateStr: string): number {
  const due = parseIsoDate(dueDateStr);
  const ref = parseIsoDate(referenceDateStr);
  const diffTime = due.getTime() - ref.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Evaluates calculated invoice status, remaining days, and due flag based on reference date.
 */
export function getCalculatedStatus(
  invoice: Invoice,
  referenceDateStr: string,
  dueSoonThresholdDays: number = 7
): CalculatedInvoiceStatus {
  const dueDate = invoice.calculatedDueDate || calculateDueDate(invoice.invoiceDate, invoice.paymentTerm, invoice.customDays);
  const outstandingAmount = Math.max(0, invoice.amount - (invoice.amountPaid || 0));
  const isPaid = invoice.status === 'PAID' || outstandingAmount <= 0;
  
  if (isPaid) {
    return {
      dueDate,
      daysRemaining: 0,
      flagStatus: 'PAID',
      outstandingAmount: 0,
      isOverdue: false,
      isDueSoon: false
    };
  }

  if (invoice.status === 'ON_HOLD' || invoice.status === 'CANCELLED') {
    return {
      dueDate,
      daysRemaining: calculateDaysDifference(dueDate, referenceDateStr),
      flagStatus: 'ON_HOLD',
      outstandingAmount,
      isOverdue: false,
      isDueSoon: false
    };
  }

  const daysRemaining = calculateDaysDifference(dueDate, referenceDateStr);

  let flagStatus: DueFlagStatus = 'UPCOMING';
  let isOverdue = false;
  let isDueSoon = false;

  if (daysRemaining < 0) {
    flagStatus = 'OVERDUE';
    isOverdue = true;
  } else if (daysRemaining <= dueSoonThresholdDays) {
    flagStatus = 'DUE_SOON';
    isDueSoon = true;
  } else {
    flagStatus = 'UPCOMING';
  }

  return {
    dueDate,
    daysRemaining,
    flagStatus,
    outstandingAmount,
    isOverdue,
    isDueSoon
  };
}

/**
 * Friendly label for payment term
 */
export function getTermLabel(term: PaymentTermType, customDays?: number): string {
  switch (term) {
    case 'DUE_ON_RECEIPT': return 'Due on Receipt';
    case 'NET_7': return 'Net 7 Days';
    case 'NET_15': return 'Net 15 Days';
    case 'NET_30': return 'Net 30 Days';
    case 'NET_45': return 'Net 45 Days';
    case 'NET_60': return 'Net 60 Days';
    case 'NET_90': return 'Net 90 Days';
    case 'EOM': return 'End of Month (EOM)';
    case 'EOM_15': return 'EOM + 15 Days';
    case 'EOM_30': return 'EOM + 30 Days';
    case 'CUSTOM': return `Custom (${customDays || 0} Days)`;
    default: return term;
  }
}

/**
 * Formats a YYYY-MM-DD date for display: "31 Aug 2026" or "Aug 31, 2026"
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseIsoDate(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  
  return `${day} ${month} ${year}`;
}

/**
 * Format relative time string e.g. "Overdue by 5 days", "Due Today", "Due in 3 days"
 */
export function formatRelativeDays(days: number, flagStatus: DueFlagStatus): string {
  if (flagStatus === 'PAID') return 'Paid in full';
  if (flagStatus === 'ON_HOLD') return 'Payment On Hold';
  if (days < 0) {
    const abs = Math.abs(days);
    return abs === 1 ? 'Overdue by 1 day' : `Overdue by ${abs} days`;
  }
  if (days === 0) {
    return 'Due Today!';
  }
  if (days === 1) {
    return 'Due tomorrow';
  }
  return `Due in ${days} days`;
}

/**
 * Currency formatter
 */
export function formatCurrency(amount: number, symbol: string = '$'): string {
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
