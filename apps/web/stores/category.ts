import { defineStore } from 'pinia';

export const useCategoryStore = defineStore('category', {
    state: () => ({
        categories: [] as any,
    }),
    getters: {
        getCategories: (state) => (state.categories as any) || [],
    },
    actions: {
        async fetchData() {
            try {
                const response = await useNuxtApp().$api.get(`/categories`);
                this.categories = response.data;
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async create(body: any) {
            try {
                const response = await useNuxtApp().$api.post(`/categories`, body);
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async update(body: any) {
            try {
                const { id, ...data } = body;
                const response = await useNuxtApp().$api.patch(`/categories/${id}`, data);
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async delete(id: any) {
            try {
                const response = await useNuxtApp().$api.delete(`/categories/${id}`);
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },
    },
});
