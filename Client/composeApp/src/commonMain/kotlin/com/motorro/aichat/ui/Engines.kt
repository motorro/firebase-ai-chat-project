package com.motorro.aichat.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.motorro.aichat.data.MainScreenGesture
import com.motorro.aichat.data.MainScreenUiState

@Composable
fun Engines(contentPadding: PaddingValues, state: MainScreenUiState.Engines, onGesture: (MainScreenGesture) -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(contentPadding),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        items(state.engines, key = {it.id}) { engine ->
            Button(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                onClick = { onGesture(MainScreenGesture.EngineSelected(engine.id)) }
            ) {
                Text(text = engine.name)
            }
        }
    }
}