package com.motorro.aichat.data.domain

import kotlinx.serialization.Serializable

@Serializable
data class MessageMeta(val name: String, val engine: String)