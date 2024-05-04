package com.motorro.aichat.data.domain

import kotlinx.serialization.Serializable

@Serializable
data class CalculateChatRequest(
    val message: String,
    override val engine: String
) : WithEngine