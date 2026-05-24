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
