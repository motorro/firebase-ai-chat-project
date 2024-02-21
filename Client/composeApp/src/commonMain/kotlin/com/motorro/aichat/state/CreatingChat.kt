package com.motorro.aichat.state

import com.motorro.aichat.data.MainScreenGesture
import com.motorro.aichat.data.MainScreenUiState
import com.motorro.aichat.data.domain.CalculateChatRequest
import com.motorro.aichat.data.domain.CalculateChatResponse
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.firestore.firestore
import io.github.aakira.napier.Napier
import kotlinx.coroutines.launch

class CreatingChat(context: MainScreenContext, private val message: String) : MainScreenState(context) {
    private val createChatCommand = functions.httpsCallable("calculate")

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
                val result: CalculateChatResponse = createChatCommand(CalculateChatRequest(message)).data()
                Napier.d { "Chat created: $result" }
                setMachineState(factory.chat(Firebase.firestore.document(result.chatDocument)))
            } catch (e: Throwable) {
                Napier.e(e) { "Error creating chat" }
                setMachineState(factory.chatCreationError(e, message))
            }
        }
    }

    /**
     * A part of [process] template to process UI gesture
     */
    override fun doProcess(gesture: MainScreenGesture) = when (gesture) {
        MainScreenGesture.Back -> {
            Napier.d { "Back pressed. Returning to prompt..."}
            setMachineState(factory.chatPrompt(message))
        }
        else -> super.doProcess(gesture)
    }
}