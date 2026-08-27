import { InvoiceItemType } from '@petflow/types';

export interface CalculationItemInput {
  description?: string;
  itemType?: InvoiceItemType;
  quantity: number;
  unitPriceMinor: number | bigint;
  discountMinor?: number | bigint;
  discountPercentage?: number;
  taxRate?: number; // e.g. 7.00 for 7% VAT, 0 for tax-exempt
  isTaxInclusive?: boolean;
}

export interface CalculatedItemResult {
  description?: string;
  itemType?: InvoiceItemType;
  quantity: number;
  unitPriceMinor: bigint;
  rawSubtotalMinor: bigint;
  discountMinor: bigint;
  netSubtotalMinor: bigint;
  taxRate: number;
  taxMinor: bigint;
  totalMinor: bigint;
}

export interface InvoiceCalculationOptions {
  invoiceDiscountMinor?: number | bigint;
  invoiceDiscountPercentage?: number;
  defaultTaxRate?: number; // Default 7.00
  isTaxInclusive?: boolean; // Default false (Thai tax-exclusive standard)
}

export interface CalculatedInvoiceResult {
  rawSubtotalMinor: bigint; // Total sum before any discounts
  totalItemDiscountMinor: bigint; // Sum of item-level discounts
  subtotalMinor: bigint; // rawSubtotalMinor - totalItemDiscountMinor
  invoiceDiscountMinor: bigint; // Invoice-level discount
  totalDiscountMinor: bigint; // totalItemDiscountMinor + invoiceDiscountMinor
  netTaxableSubtotalMinor: bigint; // subtotalMinor - invoiceDiscountMinor
  taxMinor: bigint; // Total VAT (7% default)
  totalMinor: bigint; // Total payable amount (netTaxableSubtotalMinor + taxMinor for tax-exclusive, or netTaxableSubtotalMinor for tax-inclusive)
  items: CalculatedItemResult[];
}

/**
 * Calculates financial amounts for a single invoice line item with exact satang integer precision.
 */
export function calculateLineItem(
  item: CalculationItemInput,
  defaultTaxRate = 7.0,
  defaultTaxInclusive = false
): CalculatedItemResult {
  const quantity = Math.max(0, Number(item.quantity) || 0);
  const unitPrice = Math.max(0, Math.round(Number(item.unitPriceMinor) || 0));
  const isTaxInclusive = item.isTaxInclusive ?? defaultTaxInclusive;
  const taxRate = Math.max(0, Number(item.taxRate ?? defaultTaxRate) || 0);

  // 1. Raw Subtotal = quantity * unitPrice (in satang)
  const rawSubtotalMinor = Math.round(quantity * unitPrice);

  // 2. Item-level Discount calculation
  let discountMinor = 0;
  if (item.discountMinor !== undefined && item.discountMinor !== null) {
    discountMinor = Math.min(
      rawSubtotalMinor,
      Math.max(0, Math.round(Number(item.discountMinor)))
    );
  } else if (item.discountPercentage !== undefined && item.discountPercentage !== null) {
    const pct = Math.min(100, Math.max(0, Number(item.discountPercentage)));
    discountMinor = Math.round((rawSubtotalMinor * pct) / 100);
  }

  // 3. Net Subtotal
  const netSubtotalMinor = Math.max(0, rawSubtotalMinor - discountMinor);

  // 4. Tax calculation (Satang integer precision)
  let taxMinor = 0;
  if (taxRate > 0 && netSubtotalMinor > 0) {
    if (isTaxInclusive) {
      // VAT = Net * Rate / (100 + Rate)
      taxMinor = Math.round((netSubtotalMinor * taxRate) / (100 + taxRate));
    } else {
      // VAT = Net * Rate / 100
      taxMinor = Math.round((netSubtotalMinor * taxRate) / 100);
    }
  }

  // 5. Total for this line item
  const totalMinor = isTaxInclusive
    ? netSubtotalMinor
    : netSubtotalMinor + taxMinor;

  return {
    description: item.description,
    itemType: item.itemType,
    quantity,
    unitPriceMinor: BigInt(unitPrice),
    rawSubtotalMinor: BigInt(rawSubtotalMinor),
    discountMinor: BigInt(discountMinor),
    netSubtotalMinor: BigInt(netSubtotalMinor),
    taxRate,
    taxMinor: BigInt(taxMinor),
    totalMinor: BigInt(totalMinor),
  };
}

/**
 * Calculates complete invoice totals with item breakdowns, discounts, tax, and satang rounding.
 */
export function calculateInvoice(
  items: CalculationItemInput[],
  options?: InvoiceCalculationOptions
): CalculatedInvoiceResult {
  const defaultTaxRate = options?.defaultTaxRate ?? 7.0;
  const isTaxInclusive = options?.isTaxInclusive ?? false;

  if (!items || items.length === 0) {
    return {
      rawSubtotalMinor: 0n,
      totalItemDiscountMinor: 0n,
      subtotalMinor: 0n,
      invoiceDiscountMinor: 0n,
      totalDiscountMinor: 0n,
      netTaxableSubtotalMinor: 0n,
      taxMinor: 0n,
      totalMinor: 0n,
      items: [],
    };
  }

  // 1. Calculate each line item individually
  const calculatedItems = items.map((item) =>
    calculateLineItem(item, defaultTaxRate, isTaxInclusive)
  );

  // 2. Aggregate line item sums
  const rawSubtotalMinor = calculatedItems.reduce(
    (acc, curr) => acc + curr.rawSubtotalMinor,
    0n
  );
  const totalItemDiscountMinor = calculatedItems.reduce(
    (acc, curr) => acc + curr.discountMinor,
    0n
  );
  const subtotalMinor = rawSubtotalMinor - totalItemDiscountMinor;

  // 3. Invoice-level discount calculation
  let invoiceDiscountMinor = 0n;
  const subtotalNum = Number(subtotalMinor);

  if (options?.invoiceDiscountMinor !== undefined && options?.invoiceDiscountMinor !== null) {
    const fixedDiscount = Math.max(0, Math.round(Number(options.invoiceDiscountMinor)));
    invoiceDiscountMinor = BigInt(Math.min(subtotalNum, fixedDiscount));
  } else if (
    options?.invoiceDiscountPercentage !== undefined &&
    options?.invoiceDiscountPercentage !== null
  ) {
    const pct = Math.min(100, Math.max(0, Number(options.invoiceDiscountPercentage)));
    invoiceDiscountMinor = BigInt(Math.round((subtotalNum * pct) / 100));
  }

  const totalDiscountMinor = totalItemDiscountMinor + invoiceDiscountMinor;
  const netTaxableSubtotalMinor = subtotalMinor > invoiceDiscountMinor
    ? subtotalMinor - invoiceDiscountMinor
    : 0n;

  // 4. Tax calculation with proportional distribution if invoice discount exists
  let totalTaxMinor = 0n;
  if (invoiceDiscountMinor === 0n) {
    // If no invoice-level discount, simply sum line item tax amounts
    totalTaxMinor = calculatedItems.reduce((acc, curr) => acc + curr.taxMinor, 0n);
  } else if (subtotalNum > 0) {
    // Pro-rate invoice discount across items to accurately apply item-specific tax rates
    const discountRatio = Number(netTaxableSubtotalMinor) / subtotalNum;

    totalTaxMinor = calculatedItems.reduce((acc, item) => {
      if (item.taxRate <= 0) return acc;
      const proRatedNet = Math.round(Number(item.netSubtotalMinor) * discountRatio);
      let itemTax = 0;
      if (isTaxInclusive) {
        itemTax = Math.round((proRatedNet * item.taxRate) / (100 + item.taxRate));
      } else {
        itemTax = Math.round((proRatedNet * item.taxRate) / 100);
      }
      return acc + BigInt(itemTax);
    }, 0n);
  }

  // 5. Total payable calculation
  const totalMinor = isTaxInclusive
    ? netTaxableSubtotalMinor
    : netTaxableSubtotalMinor + totalTaxMinor;

  return {
    rawSubtotalMinor,
    totalItemDiscountMinor,
    subtotalMinor,
    invoiceDiscountMinor,
    totalDiscountMinor,
    netTaxableSubtotalMinor,
    taxMinor: totalTaxMinor,
    totalMinor,
    items: calculatedItems,
  };
}

/**
 * Formats minor units (satang) to a standard Thai Baht string with 2 decimals.
 * Example: 55000n -> "550.00"
 */
export function formatMinorToBaht(minor: bigint | number): string {
  const num = Number(minor) / 100;
  return num.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parses Thai Baht amount to satang integer minor unit.
 * Example: 550.50 -> 55050n
 */
export function parseBahtToMinor(baht: number | string): bigint {
  const num = typeof baht === 'string' ? parseFloat(baht.replace(/,/g, '')) : baht;
  if (isNaN(num) || num < 0) return 0n;
  return BigInt(Math.round(num * 100));
}
