import {
  calculateLineItem,
  calculateInvoice,
  formatMinorToBaht,
  parseBahtToMinor,
  CalculationItemInput,
} from './invoice-calculator';

describe('Invoice Calculation Engine (PF-034)', () => {
  describe('calculateLineItem', () => {
    it('calculates standard line item with integer quantity and satang price (Tax-Exclusive 7%)', () => {
      const item: CalculationItemInput = {
        description: 'บริการอาบน้ำตัดขนสุนัข',
        quantity: 1,
        unitPriceMinor: 50000n, // 500.00 THB
        taxRate: 7.0,
      };

      const result = calculateLineItem(item);

      expect(result.rawSubtotalMinor).toBe(50000n);
      expect(result.discountMinor).toBe(0n);
      expect(result.netSubtotalMinor).toBe(50000n);
      expect(result.taxMinor).toBe(3500n); // 500.00 * 7% = 35.00 THB = 3500 satang
      expect(result.totalMinor).toBe(53500n); // 535.00 THB
    });

    it('calculates fractional quantity (e.g. 2.5 kg of prescription pet food)', () => {
      const item: CalculationItemInput = {
        description: 'อาหารสุนัขแบ่งขาย (กก.)',
        quantity: 2.5,
        unitPriceMinor: 12000n, // 120.00 THB / kg
        taxRate: 7.0,
      };

      const result = calculateLineItem(item);

      expect(result.rawSubtotalMinor).toBe(30000n); // 2.5 * 120.00 = 300.00 THB = 30000 satang
      expect(result.netSubtotalMinor).toBe(30000n);
      expect(result.taxMinor).toBe(2100n); // 300 * 7% = 21.00 THB = 2100 satang
      expect(result.totalMinor).toBe(32100n); // 321.00 THB
    });

    it('applies fixed item-level discount in satang', () => {
      const item: CalculationItemInput = {
        description: 'สปาโอโซน',
        quantity: 1,
        unitPriceMinor: 40000n, // 400.00 THB
        discountMinor: 5000n, // 50.00 THB discount
        taxRate: 7.0,
      };

      const result = calculateLineItem(item);

      expect(result.rawSubtotalMinor).toBe(40000n);
      expect(result.discountMinor).toBe(5000n);
      expect(result.netSubtotalMinor).toBe(35000n); // 350.00 THB
      expect(result.taxMinor).toBe(2450n); // 350 * 7% = 24.50 THB = 2450 satang
      expect(result.totalMinor).toBe(37450n); // 374.50 THB
    });

    it('applies percentage item-level discount', () => {
      const item: CalculationItemInput = {
        description: 'แชมพูบำรุงขนสุนัข',
        quantity: 2,
        unitPriceMinor: 25000n, // 250.00 THB x 2 = 500.00 THB
        discountPercentage: 10, // 10% discount = 50.00 THB
        taxRate: 7.0,
      };

      const result = calculateLineItem(item);

      expect(result.rawSubtotalMinor).toBe(50000n);
      expect(result.discountMinor).toBe(5000n);
      expect(result.netSubtotalMinor).toBe(45000n); // 450.00 THB
      expect(result.taxMinor).toBe(3150n); // 450 * 7% = 31.50 THB = 3150 satang
      expect(result.totalMinor).toBe(48150n); // 481.50 THB
    });

    it('caps item discount at raw subtotal when discount exceeds price', () => {
      const item: CalculationItemInput = {
        description: 'บริการทดลองฟรี',
        quantity: 1,
        unitPriceMinor: 20000n, // 200.00 THB
        discountMinor: 30000n, // 300.00 THB discount (exceeds price)
        taxRate: 7.0,
      };

      const result = calculateLineItem(item);

      expect(result.rawSubtotalMinor).toBe(20000n);
      expect(result.discountMinor).toBe(20000n); // Capped at 200.00 THB
      expect(result.netSubtotalMinor).toBe(0n);
      expect(result.taxMinor).toBe(0n);
      expect(result.totalMinor).toBe(0n);
    });

    it('calculates Tax-Inclusive items correctly', () => {
      const item: CalculationItemInput = {
        description: 'ขนมแมวเลีย (ราคารวม VAT)',
        quantity: 1,
        unitPriceMinor: 10700n, // 107.00 THB (Gross)
        taxRate: 7.0,
        isTaxInclusive: true,
      };

      const result = calculateLineItem(item);

      expect(result.rawSubtotalMinor).toBe(10700n);
      expect(result.netSubtotalMinor).toBe(10700n);
      // 107 * 7 / 107 = 7.00 THB VAT
      expect(result.taxMinor).toBe(700n);
      expect(result.totalMinor).toBe(10700n); // Total is the gross inclusive amount
    });

    it('calculates 0% Tax-Exempt medical items', () => {
      const item: CalculationItemInput = {
        description: 'ยารักษาโรคหัวใจสุนัข (ยกเว้นภาษี)',
        quantity: 1,
        unitPriceMinor: 65000n, // 650.00 THB
        taxRate: 0,
      };

      const result = calculateLineItem(item);

      expect(result.rawSubtotalMinor).toBe(65000n);
      expect(result.taxMinor).toBe(0n);
      expect(result.totalMinor).toBe(65000n);
    });
  });

  describe('calculateInvoice', () => {
    it('returns zeroes for empty items list', () => {
      const result = calculateInvoice([]);

      expect(result.rawSubtotalMinor).toBe(0n);
      expect(result.subtotalMinor).toBe(0n);
      expect(result.totalDiscountMinor).toBe(0n);
      expect(result.taxMinor).toBe(0n);
      expect(result.totalMinor).toBe(0n);
      expect(result.items).toEqual([]);
    });

    it('calculates multi-item invoice with subtotal, tax, and total', () => {
      const items: CalculationItemInput[] = [
        {
          description: 'อาบน้ำตัดขน',
          quantity: 1,
          unitPriceMinor: 50000n, // 500.00 THB
          taxRate: 7.0,
        },
        {
          description: 'แชมพูกรูมมิ่ง',
          quantity: 2,
          unitPriceMinor: 20000n, // 200.00 x 2 = 400.00 THB
          taxRate: 7.0,
        },
      ];

      const result = calculateInvoice(items);

      expect(result.rawSubtotalMinor).toBe(90000n); // 900.00 THB
      expect(result.subtotalMinor).toBe(90000n);
      expect(result.totalDiscountMinor).toBe(0n);
      expect(result.taxMinor).toBe(6300n); // 900 * 7% = 63.00 THB = 6300 satang
      expect(result.totalMinor).toBe(96300n); // 963.00 THB
      expect(result.items).toHaveLength(2);
    });

    it('calculates invoice with fixed invoice-level discount in satang', () => {
      const items: CalculationItemInput[] = [
        {
          description: 'บริการตรวจสุขภาพ',
          quantity: 1,
          unitPriceMinor: 100000n, // 1,000.00 THB
          taxRate: 7.0,
        },
      ];

      const result = calculateInvoice(items, {
        invoiceDiscountMinor: 10000n, // 100.00 THB discount
      });

      expect(result.subtotalMinor).toBe(100000n);
      expect(result.invoiceDiscountMinor).toBe(10000n);
      expect(result.totalDiscountMinor).toBe(10000n);
      expect(result.netTaxableSubtotalMinor).toBe(90000n); // 900.00 THB
      expect(result.taxMinor).toBe(6300n); // 900 * 7% = 63.00 THB
      expect(result.totalMinor).toBe(96300n); // 963.00 THB
    });

    it('calculates invoice with percentage invoice-level discount', () => {
      const items: CalculationItemInput[] = [
        {
          description: 'แพ็กเกจวัคซีนรวม',
          quantity: 1,
          unitPriceMinor: 80000n, // 800.00 THB
          taxRate: 7.0,
        },
      ];

      const result = calculateInvoice(items, {
        invoiceDiscountPercentage: 10, // 10% discount = 80.00 THB
      });

      expect(result.subtotalMinor).toBe(80000n);
      expect(result.invoiceDiscountMinor).toBe(8000n); // 80.00 THB
      expect(result.netTaxableSubtotalMinor).toBe(72000n); // 720.00 THB
      expect(result.taxMinor).toBe(5040n); // 720 * 7% = 50.40 THB = 5040 satang
      expect(result.totalMinor).toBe(77040n); // 770.40 THB
    });

    it('calculates combined item-level discount and invoice-level discount', () => {
      const items: CalculationItemInput[] = [
        {
          description: 'บริการตัดขนสุนัข',
          quantity: 1,
          unitPriceMinor: 50000n, // 500.00 THB
          discountMinor: 5000n, // 50.00 THB item discount -> 450.00 THB net
          taxRate: 7.0,
        },
        {
          description: 'ขนมขบเคี้ยว',
          quantity: 1,
          unitPriceMinor: 15000n, // 150.00 THB
          taxRate: 7.0,
        },
      ];

      const result = calculateInvoice(items, {
        invoiceDiscountMinor: 10000n, // 100.00 THB invoice voucher
      });

      expect(result.rawSubtotalMinor).toBe(65000n); // 650.00 THB
      expect(result.totalItemDiscountMinor).toBe(5000n); // 50.00 THB
      expect(result.subtotalMinor).toBe(60000n); // 600.00 THB
      expect(result.invoiceDiscountMinor).toBe(10000n); // 100.00 THB
      expect(result.totalDiscountMinor).toBe(15000n); // 50 + 100 = 150.00 THB
      expect(result.netTaxableSubtotalMinor).toBe(50000n); // 500.00 THB
      expect(result.taxMinor).toBe(3500n); // 500 * 7% = 35.00 THB
      expect(result.totalMinor).toBe(53500n); // 535.00 THB
    });

    it('handles mixed tax rates (e.g. 7% taxable grooming + 0% tax-exempt veterinary prescription)', () => {
      const items: CalculationItemInput[] = [
        {
          description: 'บริการกรูมมิ่งอาบน้ำ (มี VAT 7%)',
          quantity: 1,
          unitPriceMinor: 50000n, // 500.00 THB
          taxRate: 7.0,
        },
        {
          description: 'ยาปฏิชีวนะรักษาโรคผิวหนัง (ยกเว้น VAT 0%)',
          quantity: 1,
          unitPriceMinor: 30000n, // 300.00 THB
          taxRate: 0.0,
        },
      ];

      const result = calculateInvoice(items);

      expect(result.subtotalMinor).toBe(80000n); // 800.00 THB
      // Tax applies ONLY to the 500.00 THB item: 500 * 7% = 35.00 THB = 3500 satang
      expect(result.taxMinor).toBe(3500n);
      expect(result.totalMinor).toBe(83500n); // 800 + 35 = 835.00 THB
    });

    it('handles precise financial satang rounding without precision drift', () => {
      const items: CalculationItemInput[] = [
        {
          description: 'รายการคำนวณเศษสตางค์ (333.33 บาท)',
          quantity: 1,
          unitPriceMinor: 33333n, // 333.33 THB
          taxRate: 7.0,
        },
      ];

      const result = calculateInvoice(items);

      expect(result.subtotalMinor).toBe(33333n);
      // 333.33 * 7% = 23.3331 -> rounded to 23.33 THB = 2333 satang
      expect(result.taxMinor).toBe(2333n);
      expect(result.totalMinor).toBe(35666n); // 333.33 + 23.33 = 356.66 THB
    });

    it('caps invoice discount at subtotal when invoice discount exceeds subtotal', () => {
      const items: CalculationItemInput[] = [
        {
          description: 'สินค้า',
          quantity: 1,
          unitPriceMinor: 10000n, // 100.00 THB
          taxRate: 7.0,
        },
      ];

      const result = calculateInvoice(items, {
        invoiceDiscountMinor: 20000n, // 200.00 THB (exceeds subtotal)
      });

      expect(result.subtotalMinor).toBe(10000n);
      expect(result.invoiceDiscountMinor).toBe(10000n);
      expect(result.netTaxableSubtotalMinor).toBe(0n);
      expect(result.taxMinor).toBe(0n);
      expect(result.totalMinor).toBe(0n);
    });
  });

  describe('Currency Conversion Utilities', () => {
    it('formats satang minor units to formatted Thai Baht string with 2 decimals', () => {
      expect(formatMinorToBaht(55000n)).toBe('550.00');
      expect(formatMinorToBaht(125050n)).toBe('1,250.50');
      expect(formatMinorToBaht(0n)).toBe('0.00');
      expect(formatMinorToBaht(75n)).toBe('0.75');
    });

    it('parses Thai Baht numbers and strings to satang integer minor units', () => {
      expect(parseBahtToMinor(550)).toBe(55000n);
      expect(parseBahtToMinor(550.5)).toBe(55050n);
      expect(parseBahtToMinor('1,250.75')).toBe(125075n);
      expect(parseBahtToMinor('0')).toBe(0n);
      expect(parseBahtToMinor(-10)).toBe(0n);
      expect(parseBahtToMinor('invalid')).toBe(0n);
    });
  });
});
