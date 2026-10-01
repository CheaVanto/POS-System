package com.pos.auth

import com.pos.security.CurrentUser
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/auth")
class AuthController(private val auth: AuthService) {

    private fun device(req: HttpServletRequest): String? = req.getHeader("User-Agent")

    @PostMapping("/login")
    fun login(@Valid @RequestBody body: LoginRequest, req: HttpServletRequest): TokenResponse =
        auth.login(body, device(req))

    @PostMapping("/refresh")
    fun refresh(@Valid @RequestBody body: RefreshRequest, req: HttpServletRequest): TokenResponse =
        auth.refresh(body, device(req))

    @PostMapping("/logout")
    fun logout(@Valid @RequestBody body: RefreshRequest) = auth.logout(body.refreshToken)

    @GetMapping("/me")
    fun me(): SessionUser = auth.me(CurrentUser.userId())
}
