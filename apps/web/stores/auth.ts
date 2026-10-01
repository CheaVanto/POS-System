import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: {} as any,
    }),
    getters: {
        getUser: (state) => state.user || {},
        getRoles: (state) => (state.user.roles || []) as string[],
        getPermissions: (state) => (state.user.permissions || []) as string[],
        isAdmin: (state) =>
            (state.user.roles || []).some(
                (r: string) => r === 'SUPER_ADMIN' || r === 'COMPANY_ADMIN',
            ),
    },
    actions: {
        setUser(u: any) {
            this.user = {
                id: u?.id || u?.userId,
                email: u?.email,
                companyId: u?.companyId,
                roles: u?.roles || [],
                permissions: u?.permissions || [],
            };
        },

        async login(body: any) {
            try {
                const response = await useNuxtApp().$api.post(`/auth/login`, body);
                const data = response.data;
                useCookie('access_token').value = data.accessToken;
                useCookie('refresh_token').value = data.refreshToken;
                this.setUser(data.user);
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        /** Re-hydrate the principal from the token (used on app load / refresh). */
        async fetchMe() {
            try {
                const response = await useNuxtApp().$api.get(`/auth/me`);
                this.setUser(response.data);
                return response;
            } catch (error) {
                console.error('Fetch Error:', error);
                return error;
            }
        },

        async logout() {
            try {
                const refreshToken = useCookie('refresh_token').value;
                if (refreshToken) {
                    await useNuxtApp().$api.post(`/auth/logout`, { refreshToken });
                }
            } catch (error) {
                console.error('Fetch Error:', error);
            } finally {
                useCookie('access_token').value = '';
                useCookie('refresh_token').value = '';
                this.user = {};
            }
        },
    },
});
