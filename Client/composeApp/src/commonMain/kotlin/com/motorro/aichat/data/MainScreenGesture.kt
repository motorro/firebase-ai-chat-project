package com.motorro.aichat.data

sealed class MainScreenGesture {
    data object Back: MainScreenGesture()
    data object Action: MainScreenGesture()
    data class EngineSelected(val engineId: String): MainScreenGesture()
    data class UserNameChanged(val userName: String): MainScreenGesture()
    data class PasswordChanged(val password: String): MainScreenGesture()
    data class Text(val text: String): MainScreenGesture()
}