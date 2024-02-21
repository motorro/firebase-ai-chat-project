package com.motorro.aichat.data.domain

import kotlinx.serialization.Serializable

@Serializable
enum class ChatStatus {
    created,
    userInput,
    dispatching,
    processing,
    complete,
    failed
}