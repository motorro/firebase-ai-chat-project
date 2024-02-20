import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.window.ComposeUIViewController
import com.motorro.aichat.Model
import com.motorro.aichat.ui.MainScreen
import platform.posix.exit

fun MainViewController() = ComposeUIViewController { App() }

@Composable
fun App() {
    val viewModel = Model()
    val viewState by viewModel.uiState.collectAsState()
    MainScreen(
        state = viewState,
        onComplete = { exit(0) },
        onGesture = { viewModel.onGesture(it) }
    )
}