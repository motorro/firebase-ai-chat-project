package com.motorro.aichat.state

import com.motorro.aichat.data.MainScreenGesture
import com.motorro.aichat.data.MainScreenUiState
import com.motorro.commonstatemachine.coroutines.CoroutineState
import io.github.aakira.napier.Napier

abstract class MainScreenState(context: MainScreenContext) : CoroutineState<MainScreenGesture, MainScreenUiState>(), MainScreenContext by context {
    /**
     * A part of [process] template to process UI gesture
     */
    override fun doProcess(gesture: MainScreenGesture) {
        Napier.w { "Unsupported gesture $gesture" }
    }
}