package com.motorro.aichat.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.motorro.aichat.data.MainScreenGesture
import com.motorro.aichat.data.MainScreenUiState
import com.motorro.aichat.data.domain.ChatMessage
import com.motorro.aichat.data.domain.ChatMessageAuthor
import com.motorro.aichat.data.domain.ChatStatus
import kotlinx.coroutines.launch

@Composable
fun Chat(
    padding: PaddingValues,
    state: MainScreenUiState.Chat,
    onGesture: (MainScreenGesture) -> Unit
) {
    val chatScrollState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    Box(modifier = Modifier.padding(padding)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .imePadding()
                .navigationBarsPadding()
        ) {
            Row(
                Modifier.fillMaxWidth().background(Color.LightGray),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Accumulated value",
                    modifier = Modifier.padding(16.dp)
                )
                Text(
                    text = state.currentState.sum.toString(),
                    modifier = Modifier.padding(16.dp)
                )
            }
            LazyColumn(
                modifier = Modifier.weight(1f),
                state = chatScrollState
            ) {
                items(
                    items = state.messages,
                    key = { it.first }
                ) {
                    ChatItem(message = it.second)
                }

                if (state.isSendEnable().not()) {
                    item {
                        AwaitAssistant()
                    }
                }
            }

            ChatBox(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 5.dp),
                text = state.message,
                isSendEnable = state.isSendEnable(),
                onUpdate = { onGesture(MainScreenGesture.Text(it)) },
                onSend = {
                    onGesture(MainScreenGesture.Action)
                    scope.launch {
                        chatScrollState.scrollToItem(Int.MAX_VALUE)
                    }
                }
            )
        }

        LaunchedEffect(state) {
            chatScrollState.scrollToItem(Int.MAX_VALUE)
        }
    }
}

@Composable
private fun ChatItem(
    message: ChatMessage
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 10.dp, vertical = 5.dp)
    ) {
        Box(
            modifier = Modifier
                .align(if (message.isAssistant()) Alignment.CenterStart else Alignment.CenterEnd)
                .clip(
                    RoundedCornerShape(
                        topStart = 48f,
                        topEnd = 48f,
                        bottomStart = if (message.isAssistant()) 0f else 48f,
                        bottomEnd = if (message.isAssistant()) 48f else 0f
                    )
                )
                .background(if (message.isAssistant()) Color.Gray else Color.DarkGray)
                .padding(16.dp)
        ) {
            Text(
                text = message.text,
                color = Color.White
            )
        }
    }
}

@Composable
private fun ChatBox(
    modifier: Modifier,
    text: String,
    isSendEnable: Boolean,
    onUpdate: (String) -> Unit,
    onSend: () -> Unit
) {
    Row(modifier = modifier) {
        OutlinedTextField(
            value = text,
            modifier = Modifier
                .defaultMinSize(minHeight = 52.dp)
                .weight(1f),
            onValueChange = { newText ->
                onUpdate(newText)
            },
            placeholder = {
                Text(text = "Type your question here")
            },
            trailingIcon = {
                if (text.isNotEmpty()) {
                    Icon(
                        modifier = Modifier.clickable {
                            onUpdate("")
                        },
                        imageVector = Icons.Filled.Clear,
                        contentDescription = "Clear"
                    )
                }
            }
        )

        IconButton(
            modifier = Modifier,
            enabled = isSendEnable,
            content = {
                Icon(
                    imageVector = Icons.Default.Send,
                    contentDescription = "Send button",
                    tint = if (isSendEnable) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.surfaceVariant
                )
            },
            onClick = {
                onSend()
            }
        )
    }
}

@Composable
private fun AwaitAssistant() {
    val shimmerColors = listOf(
        Color.Gray.copy(alpha = 0.8f),
        Color.Gray.copy(alpha = 0.2f),
        Color.Gray.copy(alpha = 0.8f),
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 10.dp, vertical = 2.5.dp)
    ) {
        SkeletonAnimation(
            shimmerColors = shimmerColors
        ) { skeletonBrush ->
            Box(
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .clip(
                        RoundedCornerShape(
                            topStart = 48f,
                            topEnd = 48f,
                            bottomEnd = 48f,
                            bottomStart = 0f
                        )
                    )
                    .background(skeletonBrush)
                    .padding(16.dp)
            ) {
                Text(
                    text = "...",
                    color = Color.White
                )
            }
        }
    }
}
private fun ChatMessage.isAssistant(): Boolean {
    return author == ChatMessageAuthor.ai
}

private val userEnabledStates = setOf(
    ChatStatus.userInput
)
private fun MainScreenUiState.Chat.isSendEnable(): Boolean {
    return sending.not() && userEnabledStates.contains(status)
}