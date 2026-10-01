import { defineStore } from 'pinia';

/** Client-side cart state for the POS screen (no API — checkout hits saleStore). */
export const useCartStore = defineStore('cart', {
    state: () => ({
        lines: [] as any[],
        companyTaxRateBps: 0,
        orderDiscount: 0,
    }),
    getters: {
        count: (state) => state.lines.reduce((n, l) => n + l.quantity, 0),
        isEmpty: (state) => state.lines.length === 0,
        subtotal: (state) => state.lines.reduce((s, l) => s + l.product.sellPrice * l.quantity, 0),
        lineDiscountTotal: (state) => state.lines.reduce((s, l) => s + (l.discount || 0), 0),
        taxTotal(state): number {
            return state.lines.reduce((sum, l) => {
                const net = Math.max(0, l.product.sellPrice * l.quantity - (l.discount || 0));
                const rate = l.product.taxRateBps ?? state.companyTaxRateBps;
                return sum + Math.round((net * rate) / 10000);
            }, 0);
        },
        discountTotal(): number {
            return (this as any).lineDiscountTotal + this.orderDiscount;
        },
        grandTotal(): number {
            return this.subtotal - (this as any).discountTotal + (this as any).taxTotal;
        },
    },
    actions: {
        add(product: any) {
            const existing = this.lines.find((l) => l.product.id === product.id);
            if (existing) existing.quantity += 1;
            else this.lines.push({ product, quantity: 1, discount: 0 });
        },
        setQuantity(productId: string, qty: number) {
            const line = this.lines.find((l) => l.product.id === productId);
            if (!line) return;
            if (qty <= 0) this.remove(productId);
            else line.quantity = qty;
        },
        remove(productId: string) {
            this.lines = this.lines.filter((l) => l.product.id !== productId);
        },
        clear() {
            this.lines = [];
            this.orderDiscount = 0;
        },
        toCheckout(warehouseId: string, payments: any[], extra: any = {}) {
            return {
                warehouseId,
                items: this.lines.map((l) => ({
                    productId: l.product.id,
                    quantity: l.quantity,
                    discount: l.discount || 0,
                })),
                payments,
                orderDiscount: this.orderDiscount,
                ...extra,
            };
        },
    },
});
