package com.pos.common

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

@RestController
@RequestMapping("/health")
class HealthController {
    @GetMapping
    fun check(): Map<String, String> = mapOf("status" to "ok", "ts" to Instant.now().toString())
}
