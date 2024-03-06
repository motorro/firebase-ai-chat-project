package com.motorro.aichat.state

import com.motorro.aichat.data.MainScreenGesture
import com.motorro.aichat.data.MainScreenUiState
import io.github.aakira.napier.Napier

class ChatPrompt(context: MainScreenContext) : MainScreenState(context) {
    override fun doStart() {
        render()
    }

    override fun doProcess(gesture: MainScreenGesture) {
        when (gesture) {
            is MainScreenGesture.Action -> onAction()
            else -> super.doProcess(gesture)
        }
    }

    private fun onAction() {
        Napier.d { "Moving to chat creation..." }
        setMachineState(factory.creatingChat())
    }

    private fun render() {
        setUiState(MainScreenUiState.Prompt(true))
    }
}