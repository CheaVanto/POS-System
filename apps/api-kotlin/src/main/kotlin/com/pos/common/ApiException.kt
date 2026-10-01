package com.pos.common

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

/** Base for domain errors that map to an HTTP status with a uniform JSON body. */
open class ApiException(val status: HttpStatus, message: String) : RuntimeException(message)

@ResponseStatus(HttpStatus.NOT_FOUND)
class NotFoundException(message: String) : ApiException(HttpStatus.NOT_FOUND, message)

@ResponseStatus(HttpStatus.BAD_REQUEST)
class BadRequestException(message: String) : ApiException(HttpStatus.BAD_REQUEST, message)

@ResponseStatus(HttpStatus.UNAUTHORIZED)
class UnauthorizedException(message: String) : ApiException(HttpStatus.UNAUTHORIZED, message)

@ResponseStatus(HttpStatus.CONFLICT)
class ConflictException(message: String) : ApiException(HttpStatus.CONFLICT, message)
