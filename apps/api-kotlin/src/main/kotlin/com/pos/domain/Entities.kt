package com.pos.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.JoinTable
import jakarta.persistence.ManyToMany
import jakarta.persistence.Table
import java.time.Instant

/**
 * Entities map onto the existing Prisma-created schema. Field names match the
 * camelCase column names; global identifier quoting preserves the exact case.
 */

@Entity
@Table(name = "Company")
class Company(
    @Id
    val id: String = "",
    val name: String = "",
    val currency: String = "USD",
    val taxRateBps: Int = 0,
    val logoUrl: String? = null,
    val isActive: Boolean = true,
)

@Entity
@Table(name = "User")
class User(
    @Id
    val id: String = "",
    val companyId: String = "",
    val email: String = "",
    val passwordHash: String = "",
    val fullName: String = "",
    val isActive: Boolean = true,
    var lastLoginAt: Instant? = null,
    val deletedAt: Instant? = null,

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "UserRole",
        joinColumns = [JoinColumn(name = "userId")],
        inverseJoinColumns = [JoinColumn(name = "roleId")],
    )
    val roles: Set<Role> = emptySet(),
)

@Entity
@Table(name = "Role")
class Role(
    @Id
    val id: String = "",
    val companyId: String = "",
    val name: String = "",

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "RolePermission",
        joinColumns = [JoinColumn(name = "roleId")],
        inverseJoinColumns = [JoinColumn(name = "permissionId")],
    )
    val permissions: Set<Permission> = emptySet(),
)

@Entity
@Table(name = "Permission")
class Permission(
    @Id
    val id: String = "",
    @Column(name = "key")
    val key: String = "",
)

@Entity
@Table(name = "RefreshToken")
class RefreshToken(
    @Id
    val id: String = "",
    val userId: String = "",
    val tokenHash: String = "",
    val device: String? = null,
    val expiresAt: Instant = Instant.EPOCH,
    var revokedAt: Instant? = null,
    val createdAt: Instant = Instant.now(),
)
