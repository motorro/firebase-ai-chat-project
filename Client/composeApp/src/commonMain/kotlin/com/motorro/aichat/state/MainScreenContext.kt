package com.motorro.aichat.state

import com.motorro.aichat.data.domain.Engine

interface MainScreenContext {
    val factory: MainScreenStateFactory
    var engine: Engine?
}