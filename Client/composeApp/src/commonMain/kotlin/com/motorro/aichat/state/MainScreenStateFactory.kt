package com.motorro.aichat.state

interface MainScreenStateFactory {
    fun preChecking(): MainScreenState
}

class MainScreenStateFactoryImpl : MainScreenStateFactory {

    private val context: MainScreenContext = object : MainScreenContext {
        override val factory: MainScreenStateFactory = this@MainScreenStateFactoryImpl
    }

    override fun preChecking(): MainScreenState = PreChecking(context)
}