import { defineStore } from 'pinia';

/** Shared company context (currency, branch tree) used across pages. */
export const useMainStore = defineStore('main', {
    state: () => ({
        company: {} as any,
        branches: [] as any,
        warehouses: [] as any,
        tree: [] as any,
    }),
    getters: {
        getCurrency: (state) => state.company.currency || 'USD',
        getBranches: (state) => state.branches || [],
        getWarehouses: (state) => state.warehouses || [],
    },
    actions: {
        async fetchContext() {
            try {
                const response = await useNuxtApp().$api.get(`/company/context`);
                this.company = response.data.company;
                this.branches = response.data.branches;
                this.warehouses = response.data.warehouses;
                this.tree = response.data.tree;
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },
    },
});
