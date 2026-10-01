package com.pos.common

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.time.Instant

@RestControllerAdvice
class ApiExceptionHandler {

    private fun body(status: HttpStatus, message: Any): Map<String, Any> = mapOf(
        "statusCode" to status.value(),
        "error" to status.name,
        "message" to message,
        "timestamp" to Instant.now().toString(),
    )

    @ExceptionHandler(ApiException::class)
    fun handleApi(ex: ApiException): ResponseEntity<Map<String, Any>> =
        ResponseEntity.status(ex.status).body(body(ex.status, ex.message ?: ex.status.reasonPhrase))

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(ex: MethodArgumentNotValidException): ResponseEntity<Map<String, Any>> {
        val messages = ex.bindingResult.fieldErrors.map { "${it.field} ${it.defaultMessage}" }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body(HttpStatus.BAD_REQUEST, messages))
    }

    @ExceptionHandler(Exception::class)
    fun handleOther(ex: Exception): ResponseEntity<Map<String, Any>> =
        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(body(HttpStatus.INTERNAL_SERVER_ERROR, ex.message ?: "Internal server error"))
}
