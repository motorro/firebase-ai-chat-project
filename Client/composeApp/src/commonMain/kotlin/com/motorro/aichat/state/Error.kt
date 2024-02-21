package com.motorro.aichat.state

import com.motorro.aichat.data.MainScreenGesture
import com.motorro.aichat.data.MainScreenUiState
import io.github.aakira.napier.Napier

class Error(
    context: MainScreenContext,
    private val error: Throwable,
    private val onBack: () -> MainScreenState,
    private val onAction: () -> MainScreenState
) : MainScreenState(context) {
    /**
     * A part of [start] template to initialize state
     */
    override fun doStart() {
        setUiState(MainScreenUiState.Error(error))
    }

    /**
     * A part of [process] template to process UI gesture
     */
    override fun doProcess(gesture: MainScreenGesture) = when (gesture) {
        is MainScreenGesture.Back -> {
            Napier.d { "Back pressed. Returning..."}
            setMachineState(onBack())
        }
        is MainScreenGesture.Action -> {
            Napier.d { "Action gesture. Retrying..."}
            setMachineState(onAction())
        }
        else -> super.doProcess(gesture)
    }
}