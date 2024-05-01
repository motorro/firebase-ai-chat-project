package com.motorro.aichat.state

import com.motorro.aichat.data.Credentials
import com.motorro.aichat.data.MainScreenGesture
import com.motorro.aichat.data.MainScreenUiState

class LoginPassword(context: MainScreenContext, private var credentials: Credentials) : MainScreenState(context) {
    override fun doStart() {
        render()
    }

    override fun doProcess(gesture: MainScreenGesture) = when (gesture) {
        is MainScreenGesture.UserNameChanged -> {
            credentials = credentials.copy(login = gesture.userName)
            render()
        }
        is MainScreenGesture.PasswordChanged -> {
            credentials = credentials.copy(password = gesture.password)
            render()
        }
        is MainScreenGesture.Action -> {
            setMachineState(factory.loggingInUser(credentials))
        }
        is MainScreenGesture.Back -> {
            setMachineState(factory.terminated())
        }
        else -> super.doProcess(gesture)
    }

    private fun render() {
        setUiState(MainScreenUiState.LoginPassword(credentials))
    }
}