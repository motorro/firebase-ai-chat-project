package com.motorro.aichat.data.domain

import kotlinx.serialization.Serializable

@Serializable
data class PostCalculateRequest(val chatDocument: String, val message: String)