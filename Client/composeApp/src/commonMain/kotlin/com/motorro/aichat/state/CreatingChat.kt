package com.motorro.aichat.state

import com.motorro.aichat.data.MainScreenGesture
import com.motorro.aichat.data.MainScreenUiState
import com.motorro.aichat.data.domain.CalculateChatResponse
import dev.gitlive.firebase.functions.FirebaseFunctions
import io.github.aakira.napier.Napier
import kotlinx.coroutines.launch

class CreatingChat(
    context: MainScreenContext,
    private val create: CreateChat
) : MainScreenState(context) {
    /**
     * A part of [start] template to initialize state
     */
    override fun doStart() {
        setUiState(MainScreenUiState.Loading("Creating chat..."))
        createChat()
    }

    private fun createChat() {
        Napier.d { "Creating chat..." }
        stateScope.launch {
            try {
                val path = create()
                Napier.d { "Chat created: $path" }
                setMachineState(factory.chat(path))
            } catch (e: Throwable) {
                Napier.e(e) { "Error creating chat" }
                setMachineState(factory.chatCreationError(e))
            }
        }
    }

    /**
     * A part of [process] template to process UI gesture
     */
    override fun doProcess(gesture: MainScreenGesture) = when (gesture) {
        MainScreenGesture.Back -> {
            Napier.d { "Back pressed. Returning to prompt..."}
            setMachineState(factory.chatPrompt())
        }
        else -> super.doProcess(gesture)
    }
}

interface CreateChat {
    @Throws(Throwable::class)
    suspend operator fun invoke(): String

    class Impl(functions: FirebaseFunctions) : CreateChat {
        private val createChatCommand = functions.httpsCallable("calculate")

        @Throws(Throwable::class)
        override suspend operator fun invoke(): String {
            val result: CalculateChatResponse = createChatCommand().data()
            return result.chatDocument
        }
    }
}