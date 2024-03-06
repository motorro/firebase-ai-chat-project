package com.motorro.aichat.state

import com.motorro.aichat.Constants.REGION
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.functions.FirebaseFunctions
import dev.gitlive.firebase.functions.functions

interface MainScreenStateFactory {
    fun preChecking(): MainScreenState
    fun createAnonymousUser(): MainScreenState
    fun preCheckError(error: Throwable): MainScreenState
    fun chatPrompt(): MainScreenState
    fun creatingChat(): MainScreenState
    fun chatCreationError(error: Throwable): MainScreenState
    fun chat(chatDocumentPath: String): MainScreenState
    fun chatError(error: Throwable, chatDocumentPath: String): MainScreenState
    fun closingChat(chatDocumentPath: String): MainScreenState
    fun terminated(): MainScreenState
}

class MainScreenStateFactoryImpl : MainScreenStateFactory {

    private val functions: FirebaseFunctions = Firebase.functions(region = REGION)
    private val context: MainScreenContext = object : MainScreenContext {
        override val factory: MainScreenStateFactory = this@MainScreenStateFactoryImpl
    }

    override fun preChecking(): MainScreenState = PreChecking(context)
    override fun createAnonymousUser(): MainScreenState = CreatingUser(context)
    override fun preCheckError(error: Throwable): MainScreenState = Error(
        context = context,
        error = error,
        onBack = { terminated() },
        onAction = { preChecking() }
    )
    override fun chatPrompt(): MainScreenState = ChatPrompt(context)
    override fun creatingChat(): MainScreenState = CreatingChat(
        context,
        CreateChat.Impl(functions)
    )
    override fun chatCreationError(error: Throwable): MainScreenState = Error(
        context,
        error,
        { chatPrompt() },
        { creatingChat() }
    )
    override fun chat(chatDocumentPath: String): MainScreenState = Chat(
        context,
        chatDocumentPath,
        functions
    )
    override fun chatError(error: Throwable, chatDocumentPath: String): MainScreenState = Error(
        context,
        error,
        { chatPrompt() },
        { chat(chatDocumentPath) }
    )
    override fun closingChat(chatDocumentPath: String): MainScreenState = ClosingChat(
        context,
        chatDocumentPath,
        functions
    )
    override fun terminated(): MainScreenState = Terminated(context)
}