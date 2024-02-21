package com.motorro.aichat.state

import dev.gitlive.firebase.functions.FirebaseFunctions

interface MainScreenContext {
    val factory: MainScreenStateFactory
    val functions: FirebaseFunctions
}