import Vue3Toastify, { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(Vue3Toastify, {
        autoClose: 2500,
        position: toast.POSITION.TOP_RIGHT,
        theme: 'colored',
    });

    return {
        provide: {
            toast: {
                success: (message: string) => toast.success(message),
                error: (message: string) => toast.error(message),
                info: (message: string) => toast.info(message),
                warning: (message: string) => toast.warning(message),
            },
        },
    };
});
