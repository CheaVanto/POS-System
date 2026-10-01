/** Static reference data (auto-imported as PredefinedUtil). */
export class PredefinedUtil {
    static paymentMethods = ['CASH', 'CARD', 'KHQR', 'ABA', 'GIFT_CARD', 'WALLET'];

    static orderStatuses = ['DRAFT', 'COMPLETED', 'REFUNDED', 'VOID'];

    static stockKinds = ['SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN', 'TRANSFER_IN', 'TRANSFER_OUT'];

    static purchaseStatuses = ['DRAFT', 'ORDERED', 'PARTIAL', 'RECEIVED', 'CANCELLED'];

    /** Sidebar menu — each item gates on a permission (empty = always visible). */
    static menus = [
        { label: 'Dashboard', route: '/', icon: 'grid', permission: '' },
        { label: 'Products', route: '/product', icon: 'box', permission: 'product:read' },
        { label: 'Categories', route: '/category', icon: 'tag', permission: 'product:read' },
        { label: 'Inventory', route: '/inventory', icon: 'layers', permission: 'inventory:read' },
        { label: 'Stock History', route: '/stock-history', icon: 'history', permission: 'inventory:history' },
        { label: 'Purchases', route: '/purchase', icon: 'clipboard', permission: 'purchase:read' },
        { label: 'Suppliers', route: '/supplier', icon: 'truck', permission: 'supplier:read' },
        { label: 'Sales', route: '/sale', icon: 'receipt', permission: 'sale:read' },
        { label: 'Reports', route: '/report', icon: 'chart', permission: 'report:read' },
    ];
}
