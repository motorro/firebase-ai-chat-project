package com.motorro.aichat.data.domain

import kotlinx.serialization.Serializable

@Serializable
data class CalculateChatResponse(
    val chatDocument: String,
    val status: ChatStatus,
    val data: CalculateChatData
)