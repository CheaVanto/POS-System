export default defineNuxtRouteMiddleware(() => {
    // Already signed in → skip the login page.
    const token = useCookie('access_token').value;
    if (token) {
        return navigateTo('/');
    }
});
