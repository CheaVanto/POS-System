import { defineStore } from 'pinia';
import type { PaginationInterface } from '~/interfaces/pagination.interface';

export const useProductStore = defineStore('product', {
    state: () => ({
        products: [] as any,
        productDetail: {} as any,
        pagination: {} as any,
    }),
    getters: {
        getProducts: (state) => (state.products as any) || [],
        getProductDetail: (state) => (state.productDetail as any) || {},
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
                const response = await useNuxtApp().$api.get(`/products${params}`);
                this.products = response.data.data;
                this.pagination = response.data.meta;
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async fetchDetail(id: any) {
            try {
                const response = await useNuxtApp().$api.get(`/products/${id}`);
                this.productDetail = response.data;
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async create(body: any) {
            try {
                const response = await useNuxtApp().$api.post(`/products`, body);
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        // Page passes the full object incl. id (house style); POS uses PATCH by path.
        // Strip id from the body — the API rejects unknown properties.
        async update(body: any) {
            try {
                const { id, ...data } = body;
                const response = await useNuxtApp().$api.patch(`/products/${id}`, data);
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async delete(id: any) {
            try {
                const response = await useNuxtApp().$api.delete(`/products/${id}`);
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async uploadImage(id: any, file: File) {
            try {
                const form = new FormData();
                form.append('file', file);
                const response = await useNuxtApp().$api.post(`/products/${id}/image`, form);
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async getCategories() {
            try {
                const response = await useNuxtApp().$api.get(`/categories`);
                return (response.data || []).filter((c: any) => c.isActive);
            } catch (error) {
                console.error('Fetch Error:', error);
                return [];
            }
        },
    },
});
