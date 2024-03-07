package com.motorro.aichat.state

import com.motorro.aichat.Constants.REGION
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.functions.FirebaseFunctions
import dev.gitlive.firebase.functions.functions

interface MainScreenStateFactory {
    fun preChecking(): MainScreenState
    fun createAnonymousUser(): MainScreenState
    fun preCheckError(error: Throwable): MainScreenState
    fun chatPrompt(message: String? = null): MainScreenState
    fun creatingChat(message: String): MainScreenState
    fun chatCreationError(error: Throwable, message: String): MainScreenState
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
    override fun chatPrompt(message: String?): MainScreenState = ChatPrompt(context, message)
    override fun creatingChat(message: String): MainScreenState = CreatingChat(
        context,
        message,
        CreateChat.Impl(functions)
    )
    override fun chatCreationError(error: Throwable, message: String): MainScreenState = Error(
        context,
        error,
        { chatPrompt(message) },
        { creatingChat(message) }
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