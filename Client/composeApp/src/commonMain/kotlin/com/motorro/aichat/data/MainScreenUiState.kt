package com.motorro.aichat.data

import androidx.compose.runtime.Immutable
import com.motorro.aichat.data.domain.CalculateChatData
import com.motorro.aichat.data.domain.ChatMessage
import com.motorro.aichat.data.domain.ChatStatus
import com.motorro.aichat.data.domain.Engine

sealed class MainScreenUiState {
    data class Loading(val message: String): MainScreenUiState()
    data class LoginPassword(val credentials: Credentials): MainScreenUiState()
    data class Prompt(val message: String, val actionEnabled: Boolean): MainScreenUiState()
    data class Engines(val engines: List<Engine>): MainScreenUiState()
    @Immutable
    data class Chat(
        val engine: Engine,
        val status: ChatStatus,
        val currentState: CalculateChatData,
        val messages: List<Pair<String, ChatMessage>>,
        val message: String,
        val sending: Boolean
    ): MainScreenUiState()
    data class Error(val error: Throwable): MainScreenUiState()
    data object Terminated: MainScreenUiState()
}