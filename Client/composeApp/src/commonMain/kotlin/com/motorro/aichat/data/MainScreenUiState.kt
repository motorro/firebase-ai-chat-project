package com.motorro.aichat.data

sealed class MainScreenUiState {
    class Loading(val message: String): MainScreenUiState()
}