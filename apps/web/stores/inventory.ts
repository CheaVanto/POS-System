import { defineStore } from 'pinia';
import type { PaginationInterface } from '~/interfaces/pagination.interface';

export const useInventoryStore = defineStore('inventory', {
    state: () => ({
        levels: [] as any,
        levelsPagination: {} as any,
        history: [] as any,
        historyPagination: {} as any,
    }),
    getters: {
        getLevels: (state) => (state.levels as any) || [],
        getHistory: (state) => (state.history as any) || [],
        getLevelsPagination: (state): PaginationInterface => ({
            limit: state.levelsPagination.limit || 10,
            totalPage: state.levelsPagination.pages || 1,
            page: Number(state.levelsPagination.page) || 1,
            length: state.levelsPagination.total || 0,
        }),
        getHistoryPagination: (state): PaginationInterface => ({
            limit: state.historyPagination.limit || 10,
            totalPage: state.historyPagination.pages || 1,
            page: Number(state.historyPagination.page) || 1,
            length: state.historyPagination.total || 0,
        }),
    },
    actions: {
        async fetchLevels(params: string) {
            try {
                const response = await useNuxtApp().$api.get(`/inventory/levels${params}`);
                this.levels = response.data.data;
                this.levelsPagination = response.data.meta;
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async fetchHistory(params: string) {
            try {
                const response = await useNuxtApp().$api.get(`/inventory/history${params}`);
                this.history = response.data.data;
                this.historyPagination = response.data.meta;
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async adjust(body: any) {
            try {
                const response = await useNuxtApp().$api.post(`/inventory/adjust`, body);
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },
    },
});
