import { defineStore } from 'pinia';
import type { PaginationInterface } from '~/interfaces/pagination.interface';

export const usePurchaseStore = defineStore('purchase', {
    state: () => ({
        orders: [] as any,
        orderDetail: {} as any,
        pagination: {} as any,
    }),
    getters: {
        getOrders: (state) => (state.orders as any) || [],
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
                const response = await useNuxtApp().$api.get(`/purchase-orders${params}`);
                this.orders = response.data.data;
                this.pagination = response.data.meta;
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async fetchDetail(id: any) {
            try {
                const response = await useNuxtApp().$api.get(`/purchase-orders/${id}`);
                this.orderDetail = response.data;
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async create(body: any) {
            try {
                const response = await useNuxtApp().$api.post(`/purchase-orders`, body);
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async action(id: any, name: 'submit' | 'receive' | 'cancel') {
            try {
                const response = await useNuxtApp().$api.post(`/purchase-orders/${id}/${name}`, {});
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },
    },
});
