package com.pos.security

import org.springframework.security.core.context.SecurityContextHolder

/** The authenticated principal placed on the SecurityContext by JwtAuthFilter. */
data class AuthPrincipal(
    val userId: String,
    val companyId: String,
    val email: String,
    val roles: List<String>,
    val permissions: List<String>,
)

/** Convenience accessor for controllers/services. */
object CurrentUser {
    fun get(): AuthPrincipal {
        val auth = SecurityContextHolder.getContext().authentication
            ?: error("No authentication in context")
        return auth.principal as AuthPrincipal
    }

    fun companyId(): String = get().companyId
    fun userId(): String = get().userId
}
