export const money = (value: number | undefined | null, currency = "NGN"): string =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value || 0);

export const formatDate = (value: string | Date | undefined | null): string => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "2-digit"
    });
  } catch {
    return "—";
  }
};

export function clsx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

const ONES = [
  "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen"
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function chunkToWords(value: number): string {
  if (value < 20) return ONES[value];
  if (value < 100) return `${TENS[Math.floor(value / 10)]}${value % 10 ? `-${ONES[value % 10]}` : ""}`;
  return `${ONES[Math.floor(value / 100)]} hundred${value % 100 ? ` and ${chunkToWords(value % 100)}` : ""}`;
}

export function numberToWords(input: number | undefined | null): string {
  const value = Math.floor(Math.abs(input || 0));
  if (value === 0) return "zero";
  const scales = ["", " thousand", " million", " billion", " trillion"];
  const parts: string[] = [];
  let remaining = value;
  let scaleIndex = 0;
  while (remaining > 0 && scaleIndex < scales.length) {
    const chunk = remaining % 1000;
    if (chunk) parts.unshift(`${chunkToWords(chunk)}${scales[scaleIndex]}`);
    remaining = Math.floor(remaining / 1000);
    scaleIndex += 1;
  }
  const words = parts.join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
