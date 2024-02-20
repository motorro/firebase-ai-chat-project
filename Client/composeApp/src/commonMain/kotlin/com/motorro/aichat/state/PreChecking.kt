package com.motorro.aichat.state

import com.motorro.aichat.data.MainScreenUiState

class PreChecking(context: MainScreenContext) : MainScreenState(context) {
    override fun doStart() {
        setUiState(MainScreenUiState.Loading("Checking..."))
    }
}