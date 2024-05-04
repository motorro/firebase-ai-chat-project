package com.motorro.aichat.state

import com.motorro.aichat.data.MainScreenGesture
import com.motorro.aichat.data.MainScreenUiState
import com.motorro.aichat.data.domain.Engine
import com.motorro.commonstatemachine.CommonStateMachine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.kodein.mock.Mock
import org.kodein.mock.UsesMocks
import org.kodein.mock.tests.TestsWithMocks
import kotlin.test.AfterTest
import kotlin.test.Test

@ExperimentalCoroutinesApi
@UsesMocks(
    CommonStateMachine::class,
    MainScreenStateFactory::class,
    CreateChat::class
)
class CreatingChatTest : TestsWithMocks() {
    override fun setUpMocks() {
        injectMocks(mocker)
        init()
    }

    private val testMessage = "Test message"

    @Mock
    lateinit var stateMachine: CommonStateMachine<MainScreenGesture, MainScreenUiState>

    @Mock
    lateinit var factory: MainScreenStateFactory

    @Mock
    lateinit var createChat: CreateChat

    private lateinit var context: MainScreenContext
    private lateinit var nextState: MainScreenState
    private lateinit var state: MainScreenState

    private fun init() {
        every { stateMachine.setMachineState(isNotNull()) } returns Unit
        every { stateMachine.setUiState(isNotNull()) } returns Unit

        context = object : MainScreenContext {
            override val factory: MainScreenStateFactory get() = this@CreatingChatTest.factory
            override var engine: Engine? = Engine("test", "Test engine")
        }
        nextState = object : MainScreenState(context) {
            override fun doStart() = Unit
            override fun doProcess(gesture: MainScreenGesture) = Unit
        }

        every { factory.chat(isNotNull()) } returns nextState
        every { factory.chatCreationError(isNotNull(), isNotNull()) } returns nextState

        Dispatchers.setMain(UnconfinedTestDispatcher())

        state = CreatingChat(context, testMessage, createChat)
    }

    @AfterTest
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `should create chat`() = runTest {
        val testPath = "testPath"
        everySuspending { createChat(isNotNull(), isNotNull()) } returns testPath

        state.start(stateMachine)

        verifyWithSuspend {
            stateMachine.setUiState(isInstanceOf<MainScreenUiState.Loading>())
            createChat(testMessage, context.engine!!)
            factory.chat(testPath)
            stateMachine.setMachineState(nextState)
        }
    }

    @Test
    fun `should handle error`() = runTest {
        val testError = RuntimeException("Test error")
        everySuspending { createChat(isNotNull(), isNotNull()) } runs {
            throw testError
        }

        state.start(stateMachine)

        verifyWithSuspend {
            stateMachine.setUiState(isInstanceOf<MainScreenUiState.Loading>())
            threw { createChat(testMessage, context.engine!!) }
            factory.chatCreationError(testError, testMessage)
            stateMachine.setMachineState(nextState)
        }
    }
}