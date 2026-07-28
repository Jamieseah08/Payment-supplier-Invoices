export type PaymentTermType = 
  | 'DUE_ON_RECEIPT'
  | 'NET_7'
  | 'NET_15'
  | 'NET_30'
  | 'NET_45'
  | 'NET_60'
  | 'NET_90'
  | 'EOM'
  | 'EOM_15'
  | 'EOM_30'
  | 'CUSTOM';

export type InvoiceStatus = 'UNPAID' | 'PAID' | 'PARTIAL' | 'ON_HOLD' | 'CANCELLED';

export type DueFlagStatus = 'OVERDUE' | 'DUE_SOON' | 'UPCOMING' | 'PAID' | 'ON_HOLD';

export type CategoryType = 
  | 'Raw Materials'
  | 'Logistics & Shipping'
  | 'Utilities & Office'
  | 'IT & Software'
  | 'Marketing & Ads'
  | 'Inventory & Goods'
  | 'Professional Services'
  | 'Equipment Repair'
  | 'Other';

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  method: 'Bank Transfer' | 'Credit Card' | 'Check' | 'Cash' | 'ACH' | 'Other';
  referenceNo?: string;
  note?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  category: CategoryType;
  invoiceDate: string; // YYYY-MM-DD
  paymentTerm: PaymentTermType;
  customDays?: number; // Used when paymentTerm === 'CUSTOM'
  calculatedDueDate: string; // YYYY-MM-DD (computed if needed)
  amount: number; // Total invoice amount
  amountPaid: number; // Amount paid so far
  currency: string; // Default '$'
  status: InvoiceStatus;
  poNumber?: string;
  notes?: string;
  imageUrl?: string; // Stored base64 image or URL of uploaded invoice image
  scannedBreakdown?: {
    subtotal?: number;
    tax?: number;
    shipping?: number;
    lineItems?: Array<{
      description: string;
      quantity?: number;
      unitPrice?: number;
      total?: number;
    }>;
  };
  payments: PaymentRecord[];
  createdAt: string;
}

export interface CalculatedInvoiceStatus {
  dueDate: string;
  daysRemaining: number; // Negative if overdue
  flagStatus: DueFlagStatus;
  outstandingAmount: number;
  isOverdue: boolean;
  isDueSoon: boolean;
}

export interface FilterOptions {
  searchQuery: string;
  statusFilter: 'ALL' | 'OVERDUE' | 'DUE_SOON' | 'UPCOMING' | 'PAID' | 'ON_HOLD';
  categoryFilter: string;
  supplierFilter: string;
  termFilter: string;
  sortBy: 'DUE_DATE_ASC' | 'DUE_DATE_DESC' | 'AMOUNT_DESC' | 'AMOUNT_ASC' | 'SUPPLIER_ASC' | 'INVOICE_DATE_DESC';
}

export interface AppSettings {
  referenceDate: string; // Default '2026-08-31'
  dueSoonThresholdDays: number; // Default 7
  companyName: string;
  currencySymbol: string;
}
