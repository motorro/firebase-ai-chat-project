package com.motorro.aichat.state

interface MainScreenStateFactory {
    fun preChecking(): MainScreenState
    fun createAnonymousUser(): MainScreenState
    fun chatPrompt(): MainScreenState
    fun creatingChat(message: String): MainScreenState
    fun preCheckError(error: Throwable): MainScreenState
    fun terminated(): MainScreenState
}

class MainScreenStateFactoryImpl : MainScreenStateFactory {

    private val context: MainScreenContext = object : MainScreenContext {
        override val factory: MainScreenStateFactory = this@MainScreenStateFactoryImpl
    }

    override fun preChecking(): MainScreenState = PreChecking(context)
    override fun createAnonymousUser(): MainScreenState = CreatingUser(context)
    override fun chatPrompt(): MainScreenState = ChatPrompt(context)
    override fun creatingChat(message: String): MainScreenState = CreatingChat(context, message)
    override fun preCheckError(error: Throwable): MainScreenState = Error(context, error) { preChecking() }
    override fun terminated(): MainScreenState = Terminated(context)
}