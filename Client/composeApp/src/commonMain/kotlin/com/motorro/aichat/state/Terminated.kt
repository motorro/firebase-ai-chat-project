package com.motorro.aichat.state

import com.motorro.aichat.data.MainScreenUiState

class Terminated(context: MainScreenContext) : MainScreenState(context) {
    /**
     * A part of [start] template to initialize state
     */
    override fun doStart() {
        setUiState(MainScreenUiState.Terminated)
    }
}