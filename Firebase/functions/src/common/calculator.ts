import {
    FirebaseQueueTaskScheduler, tagLogger,
    ToolsDispatcher, ToolsHandOver
} from "@motorro/firebase-ai-chat-openai";
import {CalculateChatData} from "../data/CalculateChatData";
import {HttpsError} from "firebase-functions/v2/https";
import {
    AssistantConfig,
    ChatState,
    Continuation,
    ContinuationCommand, HandOverControl,
    isContinuationCommand, isStructuredMessage,
    NewMessage, StructuredMessage
} from "@motorro/firebase-ai-chat-core";
import {
    ChatDispatchData,
    DispatchResult,
    ToolDispatcherReturnValue
} from "@motorro/firebase-ai-chat-core/lib/aichat/ToolsDispatcher";
import {getFunctions} from "firebase-admin/functions";
import {DIVIDER_NAME, region, SUBTRACTOR_NAME} from "../env";
import {CalculatorMeta} from "../data/MessageMeta";
import {Meta, VertexAiAssistantConfig} from "@motorro/firebase-ai-chat-vertexai";

const logger = tagLogger("Tools");

const taskScheduler = new FirebaseQueueTaskScheduler(getFunctions(), region);
export const multiplierQueueName = "multiply";

export const calculateDispatcher: ToolsDispatcher<CalculateChatData, Meta, CalculatorMeta> = async (
    data: CalculateChatData,
    name: string,
    args: Record<string, unknown>,
    continuation: ContinuationCommand<unknown>,
    _chatData: ChatDispatchData<CalculatorMeta>,
    handOver: ToolsHandOver<Meta, CalculatorMeta>
): Promise<ToolDispatcherReturnValue<CalculateChatData>> => {
    switch (name) {
        case "getSum":
            logger.d("Getting sum. Current state: ", JSON.stringify(data));
            return {
                data: {
                    sum: data.sum
                }
            };
        case "add":
            logger.d("Adding: ", args.value);
            return {
                data: {
                    sum: data.sum + (args.value as number)
                }
            };
        case "subtract":
            logger.d("Handing-over subtract: ", args.value);
            handOver.handOver(
                {
                    config: {
                        engine: "vertexai",
                        instructionsId: SUBTRACTOR_NAME
                    },
                    messages: [
                        `User wants to subtract ${args.value as number}`
                    ],
                    chatMeta: {
                        aiMessageMeta: {
                            name: SUBTRACTOR_NAME,
                            engine: "VertexAi"
                        }
                    }
                }
            );
            return {
                result: "The request was passed to Divider. The number is being subtracted. Divider will come back with a new accumulated state"
            };
        case "multiply":
            logger.d("Multiply. Suspending multiplication: ", args.value);
            await taskScheduler.schedule(
                multiplierQueueName,
                {
                    data: data,
                    factor: (args.value as number),
                    continuationCommand: continuation
                },
                {
                    // To get rid of DEMO race condition when continuation sometimes
                    // resumed before data is saved
                    scheduleDelaySeconds: 2
                }
            );
            return Continuation.suspend();
        case "divide":
            logger.d("Division. Asking Divider for help...");
            logger.d("Arguments:", args);
            return {
                result: {
                    text: <string>args.summary || "User requested a division operation. Ask for the divider.",
                    data: {
                        operation: "division"
                    }
                }
            };
        default:
            logger.w(`Unimplemented function call: ${name}. Args:`, JSON.stringify(args));
            throw new HttpsError("unimplemented", "Unimplemented function call");
    }
};
export const subtractDispatcher: ToolsDispatcher<CalculateChatData, Meta, CalculatorMeta> = async (
    data: CalculateChatData,
    name: string,
    args: Record<string, unknown>,
    _continuation: ContinuationCommand<unknown>,
    _chatData: ChatDispatchData<CalculatorMeta>,
    handOver: ToolsHandOver<Meta, CalculatorMeta>
): Promise<DispatchResult<CalculateChatData> | Continuation<DispatchResult<CalculateChatData>>> => {
    switch (name) {
        case "getSum":
            logger.d("Getting sum. Current state: ", JSON.stringify(data));
            return {
                data: {
                    sum: data.sum
                }
            };
        case "subtract":
            logger.d("Subtracting: ", args.value);
            return {
                data: {
                    sum: data.sum - (args.value as number)
                }
            };
        case "returnToBoss":
            logger.d("Returning to main assistant: ", args);
            handOver.handBack([
                <string>args.summary || "Work done",
                `New data state: ${JSON.stringify({data: {sum: data.sum}})}`
            ]);
            return {
                result: "Returned to boss"
            };
        default:
            logger.w(`Unimplemented function call: ${name}. Args:`, JSON.stringify(args));
            throw new HttpsError("unimplemented", "Unimplemented function call");
    }
};

export const divideDispatcher: ToolsDispatcher<CalculateChatData, Meta, CalculatorMeta> = async (
    data: CalculateChatData,
    name: string,
    args: Record<string, unknown>
): Promise<DispatchResult<CalculateChatData> | Continuation<DispatchResult<CalculateChatData>>> => {
    switch (name) {
        case "getSum":
            logger.d("Getting sum. Current state: ", JSON.stringify(data));
            return {
                data: {
                    sum: data.sum
                }
            };
        case "divide":
            logger.d("Dividing: ", args.value);
            return {
                data: {
                    sum: data.sum / (args.value as number)
                }
            };
        default:
            logger.w(`Unimplemented function call: ${name}. Args:`, JSON.stringify(args));
            throw new HttpsError("unimplemented", "Unimplemented function call");
    }
};

export interface MultiplyCommand extends Record<string, unknown>{
    readonly data: CalculateChatData
    readonly factor: number
    readonly continuationCommand: ContinuationCommand<unknown>
}

export function isMultiplyCommand(data: unknown): data is MultiplyCommand {
    return "object" === typeof data && null != data
        && "factor" in data && "number" === typeof data.factor
        && "continuationCommand" in data && isContinuationCommand(data.continuationCommand);
}

export const handOverProcessor = async (
    messages: ReadonlyArray<NewMessage>,
    _chatDocumentPath: string,
    chatState: ChatState<AssistantConfig, CalculateChatData, CalculatorMeta>,
    control: HandOverControl<CalculateChatData, Meta, CalculatorMeta>
): Promise<void> => {
    const messagesToSave: Array<NewMessage> = [];
    for (const message of messages) {
        if (isStructuredMessage(message) && message.data) {
            switch (message.data["operation"]) {
                case "division":
                    await toDivision(message);
                    return;
                case "done":
                    await handBack(message);
                    return;
                default:
                    logger.w("Unknown operation:", JSON.stringify(message));
                    messagesToSave.push(`Unknown operation:\n${JSON.stringify(message)}`);
            }
        }
        messagesToSave.push(message);
    }
    await control.next(messages);

    async function saveSoFar(): Promise<void> {
        await control.safeUpdate(async (_tx, _updateState, saveMessages) => {
            saveMessages(messagesToSave);
        });
    }

    async function toDivision(message: StructuredMessage): Promise<void> {
        await saveSoFar();
        const config: VertexAiAssistantConfig = {
            engine: "vertexai",
            instructionsId: DIVIDER_NAME
        };
        const meta: CalculatorMeta = {
            aiMessageMeta: {
                name: DIVIDER_NAME,
                engine: "VertexAi"
            }
        };
        logger.d("Switching to divider...", JSON.stringify(message));
        await control.handOver({
            config: config,
            messages: [message.text],
            chatMeta: meta
        });
    }
    async function handBack(message: StructuredMessage): Promise<void> {
        logger.d("Switching back...", JSON.stringify(message));
        await control.handBack([
            message.text,
            `The new accumulated value is: ${chatState.data.sum}`
        ]);
    }
};

const operationParseRe = /^\[(\w+)]:\s*(.*)/i;
export function parseOperation(text: string): NewMessage {
    const parsed = operationParseRe.exec(text);
    if (null !== parsed) {
        return {
            text: parsed[2] || "",
            data: {
                operation: parsed[1].toLowerCase()
            }
        };
    }
    return text;
}

