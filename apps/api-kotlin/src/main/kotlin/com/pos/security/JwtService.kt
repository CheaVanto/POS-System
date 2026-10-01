package com.pos.security

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.security.MessageDigest
import java.util.Date

@Service
class JwtService(
    @Value("\${app.jwt.access-secret}") accessSecret: String,
    @Value("\${app.jwt.access-ttl-seconds}") private val accessTtlSeconds: Long,
) {
    // Derive a guaranteed 256-bit HMAC key from the configured secret (any length).
    private val key = Keys.hmacShaKeyFor(
        MessageDigest.getInstance("SHA-256").digest(accessSecret.toByteArray()),
    )

    val accessTtl: Long get() = accessTtlSeconds

    fun issueAccessToken(principal: AuthPrincipal): String {
        val now = System.currentTimeMillis()
        return Jwts.builder()
            .subject(principal.userId)
            .claim("companyId", principal.companyId)
            .claim("email", principal.email)
            .claim("roles", principal.roles)
            .claim("permissions", principal.permissions)
            .issuedAt(Date(now))
            .expiration(Date(now + accessTtlSeconds * 1000))
            .signWith(key)
            .compact()
    }

    fun parse(token: String): Claims =
        Jwts.parser().verifyWith(key).build().parseSignedClaims(token).payload
}
