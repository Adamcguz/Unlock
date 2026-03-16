import type { PlaidTransaction } from '../types/plaid';

// ── Bank CSV Format Definitions ────────────────────────────────

interface BankCSVFormat {
  name: string;
  dateColumn: number;
  descriptionColumn: number;
  amountColumn?: number; // single amount column
  debitColumn?: number; // separate debit column
  creditColumn?: number; // separate credit column
  negativeIsDebit: boolean; // true = negative values are debits (money out)
  skipRows: number; // header rows to skip
}

const KNOWN_FORMATS: { detect: (headers: string[]) => boolean; format: BankCSVFormat }[] = [
  {
    // Chase: Transaction Date, Post Date, Description, Category, Type, Amount
    detect: (h) =>
      h.some((c) => c.toLowerCase().includes('transaction date')) &&
      h.some((c) => c.toLowerCase().includes('post date')) &&
      h.some((c) => c.toLowerCase() === 'type'),
    format: {
      name: 'Chase',
      dateColumn: 0,
      descriptionColumn: 2,
      amountColumn: 5,
      negativeIsDebit: true,
      skipRows: 0,
    },
  },
  {
    // Bank of America: Date, Description, Amount, Running Bal.
    detect: (h) =>
      h.some((c) => c.toLowerCase() === 'date') &&
      h.some((c) => c.toLowerCase() === 'description') &&
      h.some((c) => c.toLowerCase().includes('running bal')),
    format: {
      name: 'Bank of America',
      dateColumn: 0,
      descriptionColumn: 1,
      amountColumn: 2,
      negativeIsDebit: true,
      skipRows: 0,
    },
  },
  {
    // Capital One: Transaction Date, Posted Date, Card No., Description, Category, Debit, Credit
    detect: (h) =>
      h.some((c) => c.toLowerCase().includes('card no')) &&
      h.some((c) => c.toLowerCase() === 'debit') &&
      h.some((c) => c.toLowerCase() === 'credit'),
    format: {
      name: 'Capital One',
      dateColumn: 0,
      descriptionColumn: 3,
      debitColumn: 5,
      creditColumn: 6,
      negativeIsDebit: false,
      skipRows: 0,
    },
  },
  {
    // Citi: Status, Date, Description, Debit, Credit
    detect: (h) =>
      h.some((c) => c.toLowerCase() === 'status') &&
      h.some((c) => c.toLowerCase() === 'debit') &&
      h.some((c) => c.toLowerCase() === 'credit'),
    format: {
      name: 'Citi',
      dateColumn: 1,
      descriptionColumn: 2,
      debitColumn: 3,
      creditColumn: 4,
      negativeIsDebit: false,
      skipRows: 0,
    },
  },
];

// ── CSV Parsing ────────────────────────────────────────────────

/**
 * Parse a raw CSV string into a 2D array of cells.
 * Handles quoted fields with commas and newlines.
 */
export function parseCSVString(raw: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < raw.length && raw[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current.trim());
        current = '';
      } else if (ch === '\n' || (ch === '\r' && raw[i + 1] === '\n')) {
        if (ch === '\r') i++; // skip \r in \r\n
        row.push(current.trim());
        if (row.some((c) => c !== '')) rows.push(row);
        row = [];
        current = '';
      } else {
        current += ch;
      }
    }
  }
  // Final row
  row.push(current.trim());
  if (row.some((c) => c !== '')) rows.push(row);

  return rows;
}

/**
 * Detect which bank format matches the CSV headers.
 * Falls back to generic auto-detection.
 */
export function detectBankFormat(headers: string[], rows: string[][]): BankCSVFormat {
  const normalized = headers.map((h) => h.replace(/["\s]+/g, ' ').trim());

  // Try known formats
  for (const known of KNOWN_FORMATS) {
    if (known.detect(normalized)) {
      return known.format;
    }
  }

  // Generic auto-detect by column header names
  let dateCol = -1;
  let descCol = -1;
  let amountCol = -1;
  let debitCol = -1;
  let creditCol = -1;

  normalized.forEach((h, i) => {
    const lower = h.toLowerCase();
    if (dateCol === -1 && (lower.includes('date') || lower === 'posted')) dateCol = i;
    if (descCol === -1 && (lower.includes('description') || lower.includes('memo') || lower.includes('payee') || lower === 'name')) descCol = i;
    if (lower === 'debit' || lower === 'debit amount') debitCol = i;
    if (lower === 'credit' || lower === 'credit amount') creditCol = i;
    if (amountCol === -1 && (lower === 'amount' || lower === 'transaction amount')) amountCol = i;
  });

  // Fallback: if no description column found, use column 1
  if (descCol === -1) descCol = Math.min(1, headers.length - 1);
  if (dateCol === -1) dateCol = 0;

  // Determine if there's a single amount or split debit/credit
  const hasSplitColumns = debitCol !== -1 && creditCol !== -1;

  if (hasSplitColumns) {
    return {
      name: 'Auto-detected (split debit/credit)',
      dateColumn: dateCol,
      descriptionColumn: descCol,
      debitColumn: debitCol,
      creditColumn: creditCol,
      negativeIsDebit: false,
      skipRows: 0,
    };
  }

  if (amountCol === -1) {
    // Try to find a numeric column
    if (rows.length > 0) {
      for (let i = 0; i < rows[0].length; i++) {
        if (i !== dateCol && i !== descCol) {
          const val = rows[0][i].replace(/[$,]/g, '');
          if (!isNaN(parseFloat(val))) {
            amountCol = i;
            break;
          }
        }
      }
    }
    if (amountCol === -1) amountCol = headers.length - 1;
  }

  return {
    name: 'Auto-detected',
    dateColumn: dateCol,
    descriptionColumn: descCol,
    amountColumn: amountCol,
    negativeIsDebit: true, // most common convention
    skipRows: 0,
  };
}

// ── Date Parsing ───────────────────────────────────────────────

function parseDate(raw: string): string | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;

  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  // Try MM/DD/YYYY or MM-DD-YYYY
  const mdyMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Try MM/DD/YY
  const mdyShort = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/);
  if (mdyShort) {
    const [, m, d, y] = mdyShort;
    const fullYear = parseInt(y) > 50 ? `19${y}` : `20${y}`;
    return `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Try parsing with Date constructor as fallback
  const date = new Date(cleaned);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  return null;
}

// ── Merchant Name Cleaning ─────────────────────────────────────

/**
 * Clean raw transaction descriptions to extract a readable merchant name.
 * Strips common bank prefixes, card numbers, reference numbers, etc.
 */
export function cleanMerchantName(raw: string): string {
  let cleaned = raw.trim();

  // Remove common prefixes
  const prefixes = [
    /^(POS|ACH|CHECKCARD|CHECK CARD|DEBIT CARD|PURCHASE|RECURRING|AUTOPAY|PAYMENT TO|DIRECT DEBIT|PREAUTHORIZED|PRE-AUTHORIZED|BILL PAY|ONLINE PMT|ONLINE PAYMENT|SQ \*|TST\*|SQUARE \*|PAYPAL \*|VENMO|ZELLE)\s*/i,
    /^\d{4}\s+/,  // leading 4-digit number (date codes)
    /^\d{2}\/\d{2}\s+/, // leading MM/DD
  ];

  for (const prefix of prefixes) {
    cleaned = cleaned.replace(prefix, '');
  }

  // Remove trailing reference numbers and phone numbers
  cleaned = cleaned.replace(/\s+\d{3}[-.]?\d{3}[-.]?\d{4}$/, ''); // phone numbers
  cleaned = cleaned.replace(/\s+#?\d{6,}$/, ''); // long reference numbers
  cleaned = cleaned.replace(/\s+[A-Z]{2}\s*\d{5}(-\d{4})?$/, ''); // state + zip
  cleaned = cleaned.replace(/\s{2,}.*$/, ''); // everything after double space (often location info)

  // Capitalize nicely
  cleaned = cleaned
    .toLowerCase()
    .replace(/(^|\s)\w/g, (c) => c.toUpperCase())
    .trim();

  return cleaned || raw.trim();
}

// ── Convert to PlaidTransaction ────────────────────────────────

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s"]/g, '').replace(/\((.+)\)/, '-$1');
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

/**
 * Convert parsed CSV rows to PlaidTransaction format.
 * Uses Plaid convention: positive = money out (debit), negative = money in (credit).
 */
export function csvToPlaidTransactions(
  rows: string[][],
  format: BankCSVFormat
): PlaidTransaction[] {
  const transactions: PlaidTransaction[] = [];
  const dataRows = rows.slice(format.skipRows);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];

    // Parse date
    const dateRaw = row[format.dateColumn];
    if (!dateRaw) continue;
    const date = parseDate(dateRaw);
    if (!date) continue;

    // Parse description
    const description = row[format.descriptionColumn] || 'Unknown';

    // Parse amount
    let amount: number;

    if (format.debitColumn !== undefined && format.creditColumn !== undefined) {
      // Split debit/credit columns
      const debit = parseAmount(row[format.debitColumn] || '');
      const credit = parseAmount(row[format.creditColumn] || '');

      if (debit !== null && debit !== 0) {
        amount = Math.abs(debit); // positive = money out (Plaid convention)
      } else if (credit !== null && credit !== 0) {
        amount = -Math.abs(credit); // negative = money in (Plaid convention)
      } else {
        continue; // no amount, skip
      }
    } else if (format.amountColumn !== undefined) {
      const rawAmount = parseAmount(row[format.amountColumn] || '');
      if (rawAmount === null) continue;

      if (format.negativeIsDebit) {
        // Bank uses: negative = debit (money out), positive = credit (money in)
        // Plaid uses: positive = debit (money out), negative = credit (money in)
        amount = -rawAmount;
      } else {
        // Bank uses: positive = debit
        amount = rawAmount;
      }
    } else {
      continue;
    }

    const merchantName = cleanMerchantName(description);

    transactions.push({
      transactionId: `csv-${i}-${Date.now()}`,
      accountId: 'csv-import',
      amount,
      date,
      name: description,
      merchantName,
      category: [],
      pending: false,
    });
  }

  // Sort by date descending (newest first)
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return transactions;
}

// ── Main Export: Parse a full CSV file ──────────────────────────

export interface CSVParseResult {
  success: true;
  transactions: PlaidTransaction[];
  bankName: string;
  dateRange: { start: string; end: string };
}

export interface CSVParseError {
  success: false;
  error: string;
}

export function parseCSVFile(raw: string): CSVParseResult | CSVParseError {
  try {
    const rows = parseCSVString(raw);

    if (rows.length < 2) {
      return { success: false, error: 'CSV file has too few rows. Please check the file format.' };
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const format = detectBankFormat(headers, dataRows);
    const transactions = csvToPlaidTransactions(dataRows, format);

    if (transactions.length === 0) {
      return { success: false, error: 'No transactions could be parsed. Make sure the file is a bank transaction export (CSV format).' };
    }

    const dates = transactions.map((t) => t.date).sort();

    return {
      success: true,
      transactions,
      bankName: format.name,
      dateRange: {
        start: dates[0],
        end: dates[dates.length - 1],
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to parse CSV file.',
    };
  }
}
