import { defineStore } from 'pinia';

export const useReportStore = defineStore('report', {
    state: () => ({
        dashboard: {} as any,
        sales: {} as any,
    }),
    getters: {
        getDashboard: (state) => state.dashboard || {},
        getSales: (state) => state.sales || {},
    },
    actions: {
        async fetchDashboard(branchId = '') {
            try {
                const params = branchId ? `?branchId=${branchId}` : '';
                const response = await useNuxtApp().$api.get(`/reports/dashboard${params}`);
                this.dashboard = response.data;
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async fetchSales(params: string) {
            try {
                const response = await useNuxtApp().$api.get(`/reports/sales${params}`);
                this.sales = response.data;
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async exportSalesCsv(params: string) {
            try {
                const response = await useNuxtApp().$api.get(`/reports/sales/export${params}`, {
                    responseType: 'blob',
                });
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },
    },
});
