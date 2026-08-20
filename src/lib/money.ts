/** Format integer cents at the render boundary. Never compute in floats. */

export function dollarsToCents(n: number | null | undefined): number | null {
  if (n == null) return null;
  return Math.round(Number(n) * 100);
}

export function formatMoney(cents: number): string {
  const n = cents / 100;
  return (
    "$" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatMoney0(cents: number): string {
  return "$" + Math.round(cents / 100).toLocaleString("en-US");
}

export function formatMoneyOrFree(cents: number): string {
  return cents === 0 ? "Free" : formatMoney(cents);
}
