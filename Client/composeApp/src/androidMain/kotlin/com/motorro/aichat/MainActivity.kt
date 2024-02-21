package com.motorro.aichat

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.ViewModel
import com.motorro.aichat.data.MainScreenGesture
import com.motorro.aichat.ui.MainScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val viewModel: MainViewModel by viewModels()
        setContent {
            val state by viewModel.uiState.collectAsState()
            MainScreen(
                state = state,
                onComplete = { finish() },
                onGesture = { viewModel.onGesture(it) }
            )
        }
    }
}

class MainViewModel : ViewModel() {
    private val model = Model()

    val uiState get() = model.uiState
    fun onGesture(gesture: MainScreenGesture) = model.onGesture(gesture)
}