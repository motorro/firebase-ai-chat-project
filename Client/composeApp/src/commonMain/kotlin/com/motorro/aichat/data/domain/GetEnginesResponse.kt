package com.motorro.aichat.data.domain

import kotlinx.serialization.Serializable

@Serializable
data class GetEnginesResponse(val engines: List<Engine>)

@Serializable
data class Engine(val id: String, val name: String)