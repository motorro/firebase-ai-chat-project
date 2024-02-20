package com.motorro.aichat

import com.motorro.aichat.data.MainScreenGesture
import com.motorro.aichat.data.MainScreenUiState
import com.motorro.aichat.state.MainScreenStateFactory
import com.motorro.aichat.state.MainScreenStateFactoryImpl
import com.motorro.commonstatemachine.coroutines.FlowStateMachine

class Model {
    private val factory: MainScreenStateFactory = MainScreenStateFactoryImpl()
    private val machine = FlowStateMachine(MainScreenUiState.Loading("Loading")){ factory.preChecking() }

    val uiState get() = machine.uiState
    fun onGesture(gesture: MainScreenGesture) = machine.process(gesture)
}