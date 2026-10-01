import { defineStore } from 'pinia';
import type { PaginationInterface } from '~/interfaces/pagination.interface';

export const useSupplierStore = defineStore('supplier', {
    state: () => ({
        suppliers: [] as any,
        supplierDetail: {} as any,
        pagination: {} as any,
    }),
    getters: {
        getSuppliers: (state) => (state.suppliers as any) || [],
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
                const response = await useNuxtApp().$api.get(`/suppliers${params}`);
                this.suppliers = response.data.data;
                this.pagination = response.data.meta;
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async create(body: any) {
            try {
                const response = await useNuxtApp().$api.post(`/suppliers`, body);
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async update(body: any) {
            try {
                const { id, ...data } = body;
                const response = await useNuxtApp().$api.patch(`/suppliers/${id}`, data);
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },
    },
});
