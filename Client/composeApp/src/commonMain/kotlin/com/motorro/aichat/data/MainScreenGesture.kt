package com.motorro.aichat.data

sealed class MainScreenGesture {
    data object Back: MainScreenGesture()
    data object Action: MainScreenGesture()
    data class Text(val text: String): MainScreenGesture()
}