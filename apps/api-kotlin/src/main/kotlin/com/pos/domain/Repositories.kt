package com.pos.domain

import org.springframework.data.jpa.repository.JpaRepository

interface CompanyRepository : JpaRepository<Company, String>

interface UserRepository : JpaRepository<User, String> {
    fun findFirstByEmailAndIsActiveTrueAndDeletedAtIsNull(email: String): User?
}

interface RefreshTokenRepository : JpaRepository<RefreshToken, String> {
    fun findFirstByTokenHashAndRevokedAtIsNull(tokenHash: String): RefreshToken?
}
