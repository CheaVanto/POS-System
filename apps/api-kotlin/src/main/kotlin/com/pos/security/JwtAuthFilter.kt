package com.pos.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class JwtAuthFilter(private val jwt: JwtService) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val header = request.getHeader("Authorization")
        if (header != null && header.startsWith("Bearer ")) {
            runCatching {
                val claims = jwt.parse(header.substring(7))
                @Suppress("UNCHECKED_CAST")
                val roles = (claims["roles"] as? List<String>) ?: emptyList()
                @Suppress("UNCHECKED_CAST")
                val perms = (claims["permissions"] as? List<String>) ?: emptyList()

                val principal = AuthPrincipal(
                    userId = claims.subject,
                    companyId = claims["companyId"] as? String ?: "",
                    email = claims["email"] as? String ?: "",
                    roles = roles,
                    permissions = perms,
                )

                // SUPER_ADMIN / COMPANY_ADMIN implicitly hold every permission.
                val authorities = buildList {
                    perms.forEach { add(SimpleGrantedAuthority(it)) }
                    roles.forEach { add(SimpleGrantedAuthority("ROLE_$it")) }
                }

                val auth = UsernamePasswordAuthenticationToken(principal, null, authorities)
                SecurityContextHolder.getContext().authentication = auth
            }
            // Invalid/expired tokens simply leave the context unauthenticated → 401 downstream.
        }
        filterChain.doFilter(request, response)
    }
}
