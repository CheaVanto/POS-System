package com.pos.auth

import com.pos.common.UnauthorizedException
import com.pos.domain.RefreshToken
import com.pos.domain.RefreshTokenRepository
import com.pos.domain.User
import com.pos.domain.UserRepository
import com.pos.security.AuthPrincipal
import com.pos.security.JwtService
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Instant
import java.util.UUID

@Service
class AuthService(
    private val users: UserRepository,
    private val refreshTokens: RefreshTokenRepository,
    private val jwt: JwtService,
    private val encoder: PasswordEncoder,
    @Value("\${app.jwt.refresh-ttl-seconds}") private val refreshTtlSeconds: Long,
) {
    private val random = SecureRandom()

    @Transactional
    fun login(req: LoginRequest, device: String?): TokenResponse {
        val user = users.findFirstByEmailAndIsActiveTrueAndDeletedAtIsNull(req.email.lowercase())
            ?: throw UnauthorizedException("Invalid credentials")
        if (!encoder.matches(req.password, user.passwordHash)) {
            throw UnauthorizedException("Invalid credentials")
        }
        user.lastLoginAt = Instant.now()
        users.save(user)
        return issueSession(user, device)
    }

    @Transactional
    fun refresh(req: RefreshRequest, device: String?): TokenResponse {
        val stored = refreshTokens.findFirstByTokenHashAndRevokedAtIsNull(hash(req.refreshToken))
        if (stored == null || stored.expiresAt.isBefore(Instant.now())) {
            throw UnauthorizedException("Invalid or expired refresh token")
        }
        stored.revokedAt = Instant.now()
        refreshTokens.save(stored)
        val user = users.findById(stored.userId).orElseThrow { UnauthorizedException("User not found") }
        return issueSession(user, device)
    }

    @Transactional
    fun logout(refreshToken: String) {
        refreshTokens.findFirstByTokenHashAndRevokedAtIsNull(hash(refreshToken))?.let {
            it.revokedAt = Instant.now()
            refreshTokens.save(it)
        }
    }

    fun me(userId: String): SessionUser {
        val user = users.findById(userId).orElseThrow { UnauthorizedException("User not found") }
        return sessionUser(user)
    }

    // ── internals ──────────────────────────────────────────

    private fun issueSession(user: User, device: String?): TokenResponse {
        val su = sessionUser(user)
        val principal = AuthPrincipal(su.id, su.companyId, su.email, su.roles, su.permissions)
        val access = jwt.issueAccessToken(principal)

        val raw = randomToken()
        refreshTokens.save(
            RefreshToken(
                id = UUID.randomUUID().toString(),
                userId = user.id,
                tokenHash = hash(raw),
                device = device,
                expiresAt = Instant.now().plusSeconds(refreshTtlSeconds),
                createdAt = Instant.now(),
            ),
        )

        return TokenResponse(
            accessToken = access,
            refreshToken = raw,
            tokenType = "Bearer",
            expiresIn = jwt.accessTtl,
            user = su,
        )
    }

    private fun sessionUser(user: User): SessionUser {
        val roles = user.roles.map { it.name }
        val permissions = user.roles.flatMap { r -> r.permissions.map { it.key } }.distinct()
        return SessionUser(user.id, user.email, user.companyId, roles, permissions)
    }

    private fun randomToken(): String {
        val bytes = ByteArray(48)
        random.nextBytes(bytes)
        return bytes.joinToString("") { "%02x".format(it) }
    }

    private fun hash(token: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(token.toByteArray())
        return digest.joinToString("") { "%02x".format(it) }
    }
}
