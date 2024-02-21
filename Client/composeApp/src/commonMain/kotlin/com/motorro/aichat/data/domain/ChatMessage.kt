package com.motorro.aichat.data.domain

import dev.gitlive.firebase.firestore.Timestamp
import kotlinx.serialization.Serializable

@Serializable
data class ChatMessage(
    val userId: String,
    val dispatchId : String,
    val author: ChatMessageAuthor,
    val text: String,
    val inBatchSortIndex: Int,
    val createdAt: Timestamp
)

@Serializable
enum class ChatMessageAuthor {
    user,
    ai
}