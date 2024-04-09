package com.motorro.aichat.data.domain

import dev.gitlive.firebase.firestore.Timestamp
import kotlinx.serialization.Serializable

@Serializable
data class ChatState(
    val userId: String,
    val status: ChatStatus,
    val dispatchId: String?,
    val data: CalculateChatData,
    val lastMessageId: String?,
    val createdAt: Timestamp,
    val updatedAt: Timestamp
)
