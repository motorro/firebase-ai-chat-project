package com.motorro.aichat.state

import com.motorro.aichat.data.MainScreenUiState
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.auth.auth
import io.github.aakira.napier.Napier
import kotlinx.coroutines.launch

class CreatingUser(context: MainScreenContext) : MainScreenState(context) {
    override fun doStart() {
        setUiState(MainScreenUiState.Loading("Creating user..."))
        createUser()
    }

    private fun createUser() {
        stateScope.launch {
            Napier.d { "Creating anonymous user..." }
            val result = try {
                Firebase.auth.signInAnonymously()
            } catch (e: Throwable) {
                Napier.e(e) { "Error creating user" }
                setMachineState(factory.preCheckError(e))
                return@launch
            }

            val user = result.user
            if (null == user) {
                Napier.e { "User not created" }
                setMachineState(factory.preCheckError(IllegalStateException("User not created")))
                return@launch
            }

            Napier.d { "User created: ${user.uid}" }
            setMachineState(factory.chatPrompt())
        }
    }
}