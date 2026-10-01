export default defineNuxtRouteMiddleware(() => {
    // No session cookie → back to login.
    const token = useCookie('access_token').value;
    if (!token) {
        return navigateTo('/login');
    }
});
