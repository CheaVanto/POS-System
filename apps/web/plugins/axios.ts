import axios from 'axios';

let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((promise) => {
        if (token) {
            promise.resolve(token);
        } else {
            promise.reject(error);
        }
    });
    failedQueue = [];
};

export default defineNuxtPlugin(() => {
    const baseUrl = useRuntimeConfig().public.apiBase as string;

    const api = axios.create({
        baseURL: baseUrl,
        headers: {
            'Content-Type': 'application/json',
            'Accept-Language': 'en',
        },
    });

    // Request: attach Bearer from cookie, let the browser set multipart boundaries for FormData.
    api.interceptors.request.use(
        (config) => {
            const token = useCookie('access_token').value;
            if (token && config.headers) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            if (config.data instanceof FormData) {
                delete config.headers['Content-Type'];
            }
            return config;
        },
        (error) => Promise.reject(error),
    );

    // Response: on 401, run a single refresh and replay queued requests.
    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            if (error.response?.status === 401 && !originalRequest._retry) {
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        .then((token) => {
                            if (originalRequest.headers) {
                                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                            }
                            return api(originalRequest);
                        })
                        .catch((err) => Promise.reject(err));
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const refreshToken = useCookie('refresh_token').value;
                    const response = await axios.post(`${baseUrl}/auth/refresh`, {
                        refreshToken: refreshToken,
                    });
                    const data = response.data;
                    useCookie('access_token').value = data.accessToken;
                    useCookie('refresh_token').value = data.refreshToken;
                    processQueue(null, data.accessToken);
                    return api(originalRequest);
                } catch (err) {
                    processQueue(err, null);
                    useCookie('access_token').value = '';
                    useCookie('refresh_token').value = '';
                    if (import.meta.client) navigateTo('/login');
                    return Promise.reject(err);
                } finally {
                    isRefreshing = false;
                }
            }

            return Promise.reject(error);
        },
    );

    return {
        provide: {
            api,
        },
    };
});
