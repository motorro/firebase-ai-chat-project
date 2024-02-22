package com.motorro.aichat.state

import com.motorro.aichat.data.MainScreenUiState
import com.motorro.aichat.data.domain.CloseCalculateRequest
import dev.gitlive.firebase.functions.FirebaseFunctions
import io.github.aakira.napier.Napier
import kotlinx.coroutines.launch

class ClosingChat(context: MainScreenContext, private val document: String, functions: FirebaseFunctions) : MainScreenState(context) {
    private val closeCommand = functions.httpsCallable("closeCalculate")

    override fun doStart() {
        setUiState(MainScreenUiState.Loading("Closing chat..."))
        closeChat()
    }

    private fun closeChat() {
        Napier.d { "Closing chat..." }
        stateScope.launch {
            try {
                closeCommand(CloseCalculateRequest(document))
                setMachineState(factory.terminated())
            } catch (e: Throwable) {
                Napier.e(e) { "Error closing chat" }
                setMachineState(factory.terminated())
            }
        }
    }
}