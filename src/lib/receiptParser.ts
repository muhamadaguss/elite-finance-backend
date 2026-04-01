/**
 * Receipt Parser - Pure regex-based engine
 * Extracts structured data from raw OCR text without any AI/API key.
 * Supports Indonesian receipts (Rp format, dd/mm/yyyy dates, etc.)
 * Also supports digital payment screenshots (Jago, GoPay, OVO, etc.)
 */

export interface ParsedReceipt {
  date: string; // YYYY-MM-DD
  description: string; // Merchant name
  amount: number; // Grand total in IDR
  type: "expense";
  items: { name: string; price: number }[];
  notes: string | null;
  confidence: "high" | "medium" | "low";
}

// ─── Amount parsing helpers ───────────────────────────────────────────────────

/**
 * Parse Indonesian-style currency strings into a number.
 * Handles:
 *  "Rp 50.000"      → 50000
 *  "Rp 50,000"      → 50000
 *  "50.000,00"      → 50000
 *  "50,000.00"      → 50000
 *  "85000"          → 85000
 */
function parseCurrency(raw: string): number {
  // Remove currency symbols, spaces
  let s = raw
    .replace(/Rp\.?\s*/gi, "")
    .replace(/IDR\s*/gi, "")
    .trim();

  // Remove trailing decimals (.00 or ,00)
  s = s.replace(/[.,]0{2}$/, "");

  // Detect format: if dot is thousands separator → "50.000" → "50000"
  // if comma is thousands separator → "50,000" → "50000"
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // e.g. "1.250.000" — dots are thousands separators
    s = s.replace(/\./g, "");
  } else if (/^\d{1,3}(,\d{3})+$/.test(s)) {
    // e.g. "1,250,000" — commas are thousands separators
    s = s.replace(/,/g, "");
  } else {
    // Fallback: remove non-digit chars
    s = s.replace(/[.,]/g, "");
  }

  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// ─── Date parsing helper ──────────────────────────────────────────────────────

const DATE_PATTERNS: {
  regex: RegExp;
  parse: (m: RegExpMatchArray) => string;
}[] = [
  // YYYY-MM-DD or YYYY/MM/DD
  {
    regex: /\b(20\d{2})[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/,
    parse: (m) => `${m[1]}-${m[2]}-${m[3]}`,
  },
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  {
    regex: /\b(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.](20\d{2})\b/,
    parse: (m) => `${m[3]}-${m[2]}-${m[1]}`,
  },
  // DD Mon YYYY  e.g. "31 Mar 2026" or "31 Maret 2026" or "22 Mar 2026, 20:52 WIB"
  {
    regex:
      /\b(0?[1-9]|[12]\d|3[01])\s+(Jan(?:uari)?|Feb(?:ruari)?|Mar(?:et)?|Apr(?:il)?|Mei|Jun(?:i)?|Jul(?:i)?|Agu(?:stus)?|Sep(?:tember)?|Okt(?:ober)?|Nov(?:ember)?|Des(?:ember)?)\s+(20\d{2})\b/i,
    parse: (m) => {
      const months: Record<string, string> = {
        jan: "01",
        feb: "02",
        mar: "03",
        apr: "04",
        mei: "05",
        jun: "06",
        jul: "07",
        agu: "08",
        sep: "09",
        okt: "10",
        nov: "11",
        des: "12",
      };
      const month = months[m[2].toLowerCase().slice(0, 3)] ?? "01";
      const day = m[1].padStart(2, "0");
      return `${m[3]}-${month}-${day}`;
    },
  },
];

function extractDate(text: string): string | null {
  for (const { regex, parse } of DATE_PATTERNS) {
    const m = text.match(regex);
    if (m) return parse(m);
  }
  return null;
}

// ─── Total amount extraction ──────────────────────────────────────────────────

/**
 * Look for grand total / jumlah bayar patterns.
 * Priority: Look for labeled totals first (Total, Grand Total, etc)
 */
const TOTAL_PATTERNS = [
  // PRIORITY 1: Labeled totals (most reliable)
  /(?:grand\s*total|total\s*bayar|total\s*tagihan|total\s*pembayaran)\s*[:\-]?\s*(?:Rp\.?\s*)?(\d[\d.,\s]+)/i,
  /(?:sub\s*total|total)\s*[:\-]?\s*(?:Rp\.?\s*)?(\d[\d.,\s]+)/i,
  /(?:jumlah\s*bayar|yang\s*dibayar|dibayar|jumlah)\s*[:\-]?\s*(?:Rp\.?\s*)?(\d[\d.,\s]+)/i,
  // PRIORITY 2: Amount with Rp prefix (but only if no labeled total found)
  /Rp\s*(\d[\d.,\s]*)/gi,
];

function extractTotal(text: string): number | null {
  // STEP 1: Try to find labeled totals first (highest priority)
  for (let i = 0; i < 3; i++) {
    const pattern = TOTAL_PATTERNS[i];
    const m = text.match(pattern);
    if (m?.[1]) {
      const val = parseCurrency(m[1]);
      if (val >= 100 && val <= 100000000) {
        return val;
      }
    }
  }

  // STEP 2: If no labeled total, collect all Rp amounts
  const rpAmounts: number[] = [];
  const rpMatches = text.matchAll(/Rp\s*(\d[\d.,\s]*)/gi);
  for (const match of rpMatches) {
    if (match[1]) {
      const val = parseCurrency(match[1]);
      if (val >= 100 && val <= 100000000) {
        rpAmounts.push(val);
      }
    }
  }

  // Take the LARGEST amount (usually the total)
  if (rpAmounts.length > 0) {
    const reasonableAmounts = rpAmounts.filter((v) => v <= 10000000);
    if (reasonableAmounts.length > 0) {
      return Math.max(...reasonableAmounts); // Take largest, not first
    }
    return Math.max(...rpAmounts);
  }

  // STEP 3: Last resort - look for reasonable numbers
  const firstPart = text.slice(0, 800);
  const cleanedText = firstPart.replace(/ID\s*Transaksi[:\s]*[\w\-]+/gi, "");

  const allNumbers = [...cleanedText.matchAll(/\b(\d{3,7})\b/g)]
    .map((m) => parseInt(m[1]))
    .filter((v) => v >= 1000 && v <= 10000000);

  if (allNumbers.length > 0) {
    return Math.max(...allNumbers); // Take largest
  }

  return null;
}

// ─── Merchant name extraction ─────────────────────────────────────────────────

const SKIP_LINES =
  /^\s*$|^\d+$|^Rp\s*\d|struk|receipt|nota|kasir|cashier|npwp|no\.|invoice|bill|kwitansi|sukses|berhasil|transaksi|id\s*transaksi|sumber\s*akun|sumber\s*dana|nama\s*acquirer|pan\s*merchant|pan\s*pelanggan|id\s*terminal|nomor\s*referensi|biaya|gratis|resi\s*ini/i;
const SKIP_WORDS =
  /^(syariah|jl\.|jalan|tel|phone|www|http|@|jago|gopay|ovo|dana|shopeepay|linkaja|bri|bca|mandiri|bni|cimb|permata|jenius|blu|tmrw|livin|brimo)$/i;

function extractMerchant(lines: string[]): string {
  // Scan lines for merchant name and try to combine consecutive caps lines
  let merchantLines: string[] = [];

  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const trimmed = lines[i].trim();
    if (trimmed.length < 3) continue;
    if (SKIP_LINES.test(trimmed)) continue;
    if (SKIP_WORDS.test(trimmed)) continue;

    // Check if it's mostly uppercase letters (for payment app screenshots)
    const upperRatio = (trimmed.match(/[A-Z]/g)?.length ?? 0) / trimmed.length;
    const letterRatio =
      (trimmed.match(/[a-zA-Z]/g)?.length ?? 0) / trimmed.length;

    if (letterRatio > 0.4 && upperRatio > 0.5) {
      merchantLines.push(trimmed);
      // Collect up to 3 consecutive lines that look like merchant name
      if (merchantLines.length >= 3) break;
    } else if (merchantLines.length > 0) {
      // Stop if we already have some merchant lines and hit a non-matching line
      break;
    }
  }

  if (merchantLines.length > 0) {
    return merchantLines.join(" ");
  }

  return "Pembayaran";
}

// ─── Line items extraction ────────────────────────────────────────────────────

/**
 * Look for lines like:
 *   "Nasi Goreng          25.000"
 *   "Kopi Susu  x2        18.000"
 */
const ITEM_LINE = /^(.{3,30?}?)\s{2,}((?:Rp\.?\s*)?\d[\d.,]{2,})$/;

function extractItems(lines: string[]): { name: string; price: number }[] {
  const items: { name: string; price: number }[] = [];
  for (const line of lines) {
    const m = line.match(ITEM_LINE);
    if (m) {
      const name = m[1].trim();
      const price = parseCurrency(m[2]);
      if (price > 0 && name.length > 1) {
        items.push({ name, price });
      }
    }
  }
  return items;
}

// ─── Main parse function ──────────────────────────────────────────────────────

export function parseReceiptText(rawText: string): ParsedReceipt {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const date = extractDate(rawText) ?? new Date().toISOString().slice(0, 10);
  const amount = extractTotal(rawText);
  const description = extractMerchant(lines);
  const items = extractItems(lines);

  // Confidence scoring
  const hasDate = extractDate(rawText) !== null;
  const hasTotal = amount !== null && amount > 0;
  const hasMerchant = description !== "Pembayaran" && description !== "Belanja";

  let confidence: "high" | "medium" | "low";
  if (hasDate && hasTotal && hasMerchant) confidence = "high";
  else if (hasDate && hasTotal) confidence = "high";
  else if (hasTotal) confidence = "medium";
  else confidence = "low";

  return {
    date,
    description,
    amount: amount ?? 0,
    type: "expense",
    items,
    notes: null, // Don't expose raw OCR text to reduce noise
    confidence,
  };
}
