package com.motorro.aichat.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.motorro.aichat.data.MainScreenGesture
import com.motorro.aichat.data.MainScreenUiState

@Composable
fun Prompt(contentPadding: PaddingValues, state: MainScreenUiState.Prompt, onGesture: (MainScreenGesture) -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(contentPadding),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Button(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            enabled = state.actionEnabled,
            onClick = { onGesture(MainScreenGesture.Action) }
        ) {
            Text(text = "Chat...")
        }
    }
}