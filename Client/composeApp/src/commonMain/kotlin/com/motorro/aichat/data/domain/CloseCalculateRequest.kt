package com.motorro.aichat.data.domain

import kotlinx.serialization.Serializable

@Serializable
data class CloseCalculateRequest(val chatDocument: String)