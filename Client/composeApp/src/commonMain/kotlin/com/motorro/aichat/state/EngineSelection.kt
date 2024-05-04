package com.motorro.aichat.state

import com.motorro.aichat.data.MainScreenGesture
import com.motorro.aichat.data.MainScreenUiState
import com.motorro.aichat.data.domain.Engine
import com.motorro.aichat.data.domain.GetEnginesResponse
import dev.gitlive.firebase.functions.FirebaseFunctions
import io.github.aakira.napier.Napier
import kotlinx.coroutines.launch

class EngineSelection(context: MainScreenContext, private val getEngines: GetEngines) : MainScreenState(context) {
    private var engines: List<Engine> = emptyList()

    override fun doStart() {
        setUiState(MainScreenUiState.Loading("Getting engines..."))
        load()
    }

    private fun load() {
        Napier.d { "Getting engines..." }
        stateScope.launch {
            try {
                Napier.d { "Got engines: $engines" }
                engines = getEngines()
                setUiState(MainScreenUiState.Engines(engines))
            } catch (e: Throwable) {
                Napier.e(e) { "Error getting engines" }
                setMachineState(factory.enginesError(e))
            }
        }
    }

    override fun doProcess(gesture: MainScreenGesture) {
        when (gesture) {
            is MainScreenGesture.EngineSelected -> {
                val selected = engines.find { it.id == gesture.engineId }
                if (null != selected) {
                    Napier.e { "Engine selected: $selected" }
                    engine = selected
                    setMachineState(factory.chatPrompt())
                }
            }
            else -> super.doProcess(gesture)
        }
    }
}


interface GetEngines {
    suspend operator fun invoke(): List<Engine>

    class Impl(functions: FirebaseFunctions) : GetEngines {
        private val createGetEngines = functions.httpsCallable("getEngines")

        override suspend operator fun invoke(): List<Engine> {
            val result: GetEnginesResponse = createGetEngines().data()
            return result.engines
        }
    }
}