package com.motorro.aichat.data

sealed class MainScreenGesture {
    data object Back: MainScreenGesture()
    data object Action: MainScreenGesture()
}