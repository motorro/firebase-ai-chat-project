package com.motorro.aichat.state

import com.motorro.aichat.data.MainScreenGesture
import com.motorro.aichat.data.MainScreenUiState
import com.motorro.aichat.data.domain.CalculateChatData
import com.motorro.aichat.data.domain.ChatMessage
import com.motorro.aichat.data.domain.ChatState
import com.motorro.aichat.data.domain.ChatStatus
import com.motorro.aichat.data.domain.PostCalculateRequest
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.auth.auth
import dev.gitlive.firebase.firestore.Direction
import dev.gitlive.firebase.firestore.DocumentReference
import dev.gitlive.firebase.firestore.firestore
import dev.gitlive.firebase.firestore.orderBy
import dev.gitlive.firebase.firestore.where
import dev.gitlive.firebase.functions.FirebaseFunctions
import io.github.aakira.napier.Napier
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

class Chat(context: MainScreenContext, documentPath: String, functions: FirebaseFunctions) : MainScreenState(context) {
    private val chatDocument: DocumentReference = Firebase.firestore.document(documentPath)
    private val userId = requireNotNull(Firebase.auth.currentUser?.uid) { "User not logged in" }
    private val postMessage = functions.httpsCallable("postToCalculate")

    private var stateData: ChatStateData = ChatStateData(
        ChatStatus.processing,
        CalculateChatData(0),
        emptyList()
    )

    private var message: String = ""
    private var sending: Boolean = false

    override fun doStart() {
        render()
        subscribe()
    }

    override fun doProcess(gesture: MainScreenGesture) = when (gesture) {
        MainScreenGesture.Back -> {
            Napier.d { "Back pressed. Terminating chat..." }
            setMachineState(factory.closingChat(chatDocument.path))
        }
        is MainScreenGesture.Text -> {
            message = gesture.text
            render()
        }
        MainScreenGesture.Action -> onSend()
        else -> super.doProcess(gesture)
    }

    private fun subscribe() {
        Napier.d { "Subscribing to chat..." }
        subscribeDocument()
        subscribeMessages()
    }

    private fun subscribeDocument() {
        chatDocument.snapshots
            .onEach { snapshot ->
                val data: ChatState = snapshot.data()
                if (ChatStatus.failed == data.status) {
                    Napier.e { "Chat failed: ${data.lastError}" }
                    setMachineState(factory.chatError(IllegalStateException("Chat failed: ${data.lastError}"), chatDocument.path))
                    return@onEach
                }
                stateData = stateData.copy(
                    status = data.status,
                    data = data.data
                )
                render()
            }
            .catch {
                Napier.e(it) { "Error subscribing to chat" }
                setMachineState(factory.chatError(it, chatDocument.path))
            }
            .launchIn(stateScope)
    }

    private fun subscribeMessages() {
        chatDocument.collection("messages")
            .where { "userId".equalTo(userId) }
            .orderBy("createdAt", Direction.ASCENDING)
            .orderBy("inBatchSortIndex", Direction.ASCENDING)
            .snapshots
            .onEach { snapshots ->
                stateData = stateData.copy(
                    messages = snapshots.documents.map { document ->
                        val data: ChatMessage = document.data()
                        Pair(document.id, data)
                    }
                )
                render()
            }
            .catch {
                Napier.e(it) { "Error subscribing to chat messages" }
                setMachineState(factory.chatError(it, chatDocument.path))
            }
            .launchIn(stateScope)
    }

    private fun onSend() {
        if (message.isBlank()) return

        stateScope.launch {
            Napier.d { "Sending message: $message" }
            sending = true
            render()
            try {
                postMessage(PostCalculateRequest(chatDocument.path, message, selectedEngine.id))
                message = ""
                sending = false
            } catch (e: Throwable) {
                Napier.e(e) { "Error sending message" }
                setMachineState(factory.chatError(e, chatDocument.path))
            }
        }
    }

    private fun render() {
        setUiState(MainScreenUiState.Chat(
            selectedEngine,
            stateData.status,
            stateData.data,
            stateData.messages,
            message,
            sending
        ))
    }
}

private data class ChatStateData(
    val status: ChatStatus,
    val data: CalculateChatData,
    val messages: List<Pair<String, ChatMessage>>
)