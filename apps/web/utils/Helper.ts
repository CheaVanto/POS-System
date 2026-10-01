import dayjs from 'dayjs';

type FieldError = {
    field: string;
    message: string;
};

/**
 * Shared pure helpers (static methods, auto-imported as HelperUtil).
 * Adapted to the POS API: 1-based pagination, `{ data, meta }` envelope,
 * money stored as integer minor units.
 */
export class HelperUtil {
    static defaultError: FieldError[] = [
        { field: 'System', message: 'Network error. Please try again.' },
    ];

    /**
     * Permission gate. SUPER_ADMIN / COMPANY_ADMIN pass everything; otherwise the
     * principal must hold the permission. Used for page + action checks.
     */
    static can(requiredPermission: string): boolean {
        const auth = useAuthStore();
        if (auth.isAdmin) return true;
        return auth.getPermissions.includes(requiredPermission);
    }

    /** Build the list query string from the route (POS pagination is 1-based). */
    static getPageParams(query: any): string {
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;
        const search = (query.q as string) || '';
        let params = `?page=${page}&limit=${limit}`;
        if (search) params += `&q=${encodeURIComponent(search)}`;
        return params;
    }

    /** True for any 2xx axios response. */
    static isOk(res: any): boolean {
        const status = res?.status;
        return typeof status === 'number' && status >= 200 && status < 300;
    }

    /** Resolve a stored image path (e.g. /uploads/..) to a loadable URL. */
    static mediaUrl(path?: string | null): string {
        if (!path) return '';
        if (/^https?:\/\//.test(path)) return path;
        const base = (useRuntimeConfig().public.apiBase as string).replace(/\/api\/?$/, '');
        return `${base}${path}`;
    }

    static formatDate(date: string | number | Date, format = 'DD-MMM-YYYY HH:mm') {
        return date ? dayjs(date).format(format) : '';
    }

    /** Format integer minor units (cents) as a currency string. */
    static formatMoney(minor: number, currency = 'USD') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
            (minor ?? 0) / 100,
        );
    }

    /** Parse a decimal string ("2.50") into minor units (250). */
    static toMinor(value: string | number): number {
        const n = typeof value === 'string' ? parseFloat(value) : value;
        return Math.round((n || 0) * 100);
    }

    static formatNumber(number: any) {
        if (number == null) return 0;
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /** Normalize an API error into displayable field errors. */
    static throwError(response: any): FieldError[] {
        const status = response?.response?.status;
        const body = response?.response?.data;

        if (body?.message) {
            const msg = body.message;
            if (Array.isArray(msg)) return msg.map((m: string) => ({ field: 'Validation', message: m }));
            return [{ field: 'Message', message: String(msg) }];
        }
        if (status === 500) return [{ field: 'Message', message: 'Something went wrong.' }];
        return HelperUtil.defaultError;
    }

    /** First human-readable message from an API error. */
    static errorMessage(response: any): string {
        return HelperUtil.throwError(response)[0]?.message ?? 'Something went wrong';
    }
}
