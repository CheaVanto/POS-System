/** Money utilities. All amounts are integer minor units; tax rates in basis points. */
export const Money = {
  round(value: number): number {
    return Math.round(value);
  },
  tax(baseMinor: number, rateBps: number): number {
    return Money.round((baseMinor * rateBps) / 10000);
  },
  lineNet(unitPrice: number, quantity: number, discount: number): number {
    return Math.max(0, unitPrice * quantity - discount);
  },
};
