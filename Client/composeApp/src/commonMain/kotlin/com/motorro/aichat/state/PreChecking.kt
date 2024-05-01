package com.motorro.aichat.state

import com.motorro.aichat.data.MainScreenUiState
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.auth.auth
import io.github.aakira.napier.Napier

class PreChecking(context: MainScreenContext) : MainScreenState(context) {
    override fun doStart() {
        setUiState(MainScreenUiState.Loading("Checking user..."))
        checkAuth()
    }

    private fun checkAuth() {
        val user = try {
            Firebase.auth.currentUser
        } catch (e: Throwable) {
            Napier.e(e) { "Error checking user" }
            setMachineState(factory.preCheckError(e))
            return
        }
        if (null == user) {
            Napier.d { "User not authenticated, switching to anonymous user creation" }
            setMachineState(factory.loginPassword())
        } else {
            Napier.d { "User authenticated: ${user.displayName}" }
            setMachineState(factory.chatPrompt())
        }
    }
}