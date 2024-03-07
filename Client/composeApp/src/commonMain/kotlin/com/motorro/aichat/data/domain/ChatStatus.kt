package com.motorro.aichat.data.domain

import kotlinx.serialization.Serializable

@Serializable
enum class ChatStatus {
    userInput,
    processing,
    closing,
    complete,
    failed
}