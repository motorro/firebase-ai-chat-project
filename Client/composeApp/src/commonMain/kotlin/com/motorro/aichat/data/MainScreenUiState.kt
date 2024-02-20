package com.motorro.aichat.data

sealed class MainScreenUiState {
    class Loading(val message: String): MainScreenUiState()
    class Prompt(val message: String, val actionEnabled: Boolean): MainScreenUiState()
    class Error(val error: Throwable): MainScreenUiState()
    data object Terminated: MainScreenUiState()
}