package com.motorro.aichat.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.motorro.aichat.data.MainScreenGesture
import com.motorro.aichat.data.MainScreenUiState
import kotlinproject.composeapp.generated.resources.Res
import kotlinproject.composeapp.generated.resources.visibility_24
import kotlinproject.composeapp.generated.resources.visibility_off_24
import org.jetbrains.compose.resources.ExperimentalResourceApi
import org.jetbrains.compose.resources.vectorResource

@OptIn(ExperimentalMaterial3Api::class, ExperimentalResourceApi::class)
@Composable
fun Login(padding: PaddingValues, state: MainScreenUiState.LoginPassword, onGesture: (MainScreenGesture) -> Unit) {
    val loginEnabled = state.credentials.login.isNotEmpty() && state.credentials.password.isNotEmpty()
    val showPassword = remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.padding(padding).padding(horizontal = 15.dp)
    ) {
        Text(
            modifier = Modifier.padding(bottom = 5.dp),
            text = "Email:",
        )

        OutlinedTextField(
            modifier = Modifier.fillMaxWidth(),
            value = state.credentials.login,
            onValueChange = {
                onGesture(MainScreenGesture.UserNameChanged(it))
            }
        )

        Spacer(
            modifier = Modifier.height(12.dp)
        )

        Text(
            modifier = Modifier.padding(bottom = 5.dp),
            text = "Password:",
        )

        OutlinedTextField(
            modifier = Modifier.fillMaxWidth(),
            value = state.credentials.password,
            visualTransformation = if (showPassword.value) VisualTransformation.None else PasswordVisualTransformation(),
            onValueChange = {
                onGesture(MainScreenGesture.PasswordChanged(it))
            },
            trailingIcon = {
                val icon = if (showPassword.value) {
                    vectorResource(Res.drawable.visibility_24)
                } else {
                    vectorResource(Res.drawable.visibility_off_24)
                }

                Icon(
                    modifier = Modifier.clickable {
                        showPassword.value = !showPassword.value
                    },
                    imageVector = icon,
                    contentDescription = "Visibility"
                )
            }
        )

        Spacer(modifier = Modifier.height(12.dp))

        Button(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            enabled = loginEnabled,
            onClick = { onGesture(MainScreenGesture.Action) }
        ) {
            Text(text = "Login")
        }
    }
}