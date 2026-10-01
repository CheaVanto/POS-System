import { defineStore } from 'pinia';
import type { PaginationInterface } from '~/interfaces/pagination.interface';

export const useSaleStore = defineStore('sale', {
    state: () => ({
        sales: [] as any,
        saleDetail: {} as any,
        pagination: {} as any,
    }),
    getters: {
        getSales: (state) => (state.sales as any) || [],
        getSaleDetail: (state) => (state.saleDetail as any) || {},
        getPagination: (state): PaginationInterface => ({
            limit: state.pagination.limit || 10,
            totalPage: state.pagination.pages || 1,
            page: Number(state.pagination.page) || 1,
            length: state.pagination.total || 0,
        }),
    },
    actions: {
        async fetchData(params: string) {
            try {
                const response = await useNuxtApp().$api.get(`/sales${params}`);
                this.sales = response.data.data;
                this.pagination = response.data.meta;
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async fetchDetail(id: any) {
            try {
                const response = await useNuxtApp().$api.get(`/sales/${id}`);
                this.saleDetail = response.data;
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async checkout(body: any) {
            try {
                const response = await useNuxtApp().$api.post(`/sales/checkout`, body);
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async refund(id: any) {
            try {
                const response = await useNuxtApp().$api.post(`/sales/${id}/refund`);
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },
    },
});
