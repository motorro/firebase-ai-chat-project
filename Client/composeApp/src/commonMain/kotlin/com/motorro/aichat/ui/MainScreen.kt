package com.motorro.aichat.ui

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.text.style.TextOverflow
import com.motorro.aichat.data.MainScreenGesture
import com.motorro.aichat.data.MainScreenUiState

@Composable
fun MainScreen(state: MainScreenUiState, onGesture: (MainScreenGesture) -> Unit) {
    when(state) {
        is MainScreenUiState.Loading -> MainScreenScaffold(
            title = "Loading...",
            withBackButton = false,
            onGesture = onGesture,
            content = { padding, _ -> Loading(padding) }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainScreenScaffold(
    title: String,
    withBackButton: Boolean,
    onGesture: (MainScreenGesture) -> Unit,
    content: @Composable (PaddingValues, (MainScreenGesture) -> Unit) -> Unit
) {
    val snackbarHostState = remember { SnackbarHostState() }
    BackHandler { onGesture(MainScreenGesture.Back) }
    Scaffold(
        snackbarHost = {
            SnackbarHost(hostState = snackbarHostState)
        },
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        text = title,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                },
                navigationIcon = {
                    if (withBackButton) {
                        IconButton(onClick = { onGesture(MainScreenGesture.Back) }) {
                            Icon(
                                imageVector = Icons.Filled.ArrowBack,
                                contentDescription = "Back"
                            )
                        }
                    }
                }
            )
        },
        content = { contentPadding ->
            content(contentPadding, onGesture)
        }
    )
}