package com.motorro.aichat.data.domain

import kotlinx.serialization.Serializable

@Serializable
enum class ChatStatus {
    creating,
    created,
    userInput,
    posting,
    processing,
    gettingMessages,
    closing,
    complete,
    failed
}