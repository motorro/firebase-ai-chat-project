package com.motorro.aichat.state

import com.motorro.aichat.data.MainScreenGesture
import com.motorro.aichat.data.MainScreenUiState
import com.motorro.aichat.data.domain.Engine
import com.motorro.commonstatemachine.coroutines.CoroutineState
import io.github.aakira.napier.Napier

abstract class MainScreenState(context: MainScreenContext) : CoroutineState<MainScreenGesture, MainScreenUiState>(), MainScreenContext by context {
    /**
     * A part of [process] template to process UI gesture
     */
    override fun doProcess(gesture: MainScreenGesture) = when (gesture) {
        is MainScreenGesture.Back -> {
            Napier.d { "Back gesture. Terminating..." }
            setMachineState(factory.terminated())
        }
        else -> Napier.w { "Unsupported gesture $gesture" }
    }

    protected val selectedEngine: Engine
        get() = requireNotNull(engine) { "No engine selected" }
}