package com.motorro.aichat.state

import com.motorro.aichat.data.MainScreenGesture
import com.motorro.aichat.data.MainScreenUiState
import io.github.aakira.napier.Napier

class ChatPrompt(context: MainScreenContext, message: String?) : MainScreenState(context) {
    private var message: String = message ?: "Hello! What is your name?"

    override fun doStart() {
        render()
    }

    override fun doProcess(gesture: MainScreenGesture) {
        when (gesture) {
            is MainScreenGesture.Text -> {
                message = gesture.text
                render()
            }
            is MainScreenGesture.Action -> onAction()
            else -> super.doProcess(gesture)
        }
    }

    private fun onAction() {
        if (message.isNotBlank()) {
            Napier.d { "Moving to chat creation..." }
            setMachineState(factory.creatingChat(message))
        }
    }

    private fun render() {
        setUiState(MainScreenUiState.Prompt(message, message.isNotBlank()))
    }
}