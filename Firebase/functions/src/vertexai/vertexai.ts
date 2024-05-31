import {CalculateChatData} from "../data/CalculateChatData";
import {calculateDispatcher, divideDispatcher} from "../common/calculator";
import {FunctionDeclarationSchemaType, VertexAI} from "@google-cloud/vertexai";
import {firestore} from "firebase-admin";
import {CHATS, VERTEXAI_THREADS} from "../data/Collections";
import {
    factory,
    VertexAiAssistantConfig,
    VertexAiChatState,
    VertexAiSystemInstructions
} from "@motorro/firebase-ai-chat-vertexai";
import {getFunctions} from "firebase-admin/functions";
import {DIVIDER_NAME, NAME, region} from "../env";
import {CalculateChatRequest} from "../data/CalculateChatRequest";
import {CalculateChatResponse} from "../data/CalculateChatResponse";
import {PostCalculateRequest} from "../data/PostCalculateRequest";
import {CloseCalculateRequest} from "../data/CloseCalculateRequest";
import {ChatError, ChatWorker, Continuation, ContinuationCommand, logger} from "@motorro/firebase-ai-chat-core";
import {projectID} from "firebase-functions/params";
import {ChatDispatchData} from "@motorro/firebase-ai-chat-openai";
import {CalculatorMeta} from "../data/MessageMeta";
import CollectionReference = firestore.CollectionReference;
import DocumentReference = firestore.DocumentReference;
import {ToolDispatcherReturnValue} from "@motorro/firebase-ai-chat-core/lib/aichat/ToolsDispatcher";

const db = firestore();
const chats = db.collection(CHATS) as CollectionReference<VertexAiChatState<CalculateChatData>>;
const chatFactory = factory(db, getFunctions(), region);
const assistantChat = chatFactory.chat<CalculateChatData>("calculator");
const continuationScheduler = chatFactory.continuationScheduler(NAME);

interface HandOverMeta extends CalculatorMeta {
    continuation: ContinuationCommand<unknown>
}

export const switchToDivider = async (
    chatData: ChatDispatchData,
    args: Record<string, unknown>,
    continuation: ContinuationCommand<unknown>
): Promise<ToolDispatcherReturnValue<CalculateChatData>> => {
    const config: VertexAiAssistantConfig = {
        engine: "vertexai",
        instructionsId: DIVIDER_NAME
    };
    const meta: HandOverMeta = {
        aiMessageMeta: {
            name: DIVIDER_NAME,
            engine: "VertexAi"
        },
        continuation: continuation
    };
    logger.d("Switching to divider:", chatData, args);
    const summary = args.summary as string;
    if (undefined === summary || 0 === summary.length) {
        return {
            error: "You should provide some summary about what user wants"
        };
    }
    await assistantChat.handOver(
        db.doc(chatData.chatDocumentPath) as DocumentReference<VertexAiChatState<CalculateChatData>>,
        chatData.ownerId,
        config,
        [(args.summary as string)],
        undefined,
        meta
    );
    return Continuation.suspend();
};

const switchToCalculator = async (data: CalculateChatData, chatData: ChatDispatchData, args: Record<string, unknown>): Promise<void> => {
    logger.d("Switching to calculator", chatData, args);
    const meta: HandOverMeta | null = <HandOverMeta>chatData.meta;
    if (null === meta) {
        return Promise.reject(new ChatError("invalid-argument", true, "No continuation in chat meta"));
    }
    await assistantChat.handBack(
        db.doc(chatData.chatDocumentPath) as DocumentReference<VertexAiChatState<CalculateChatData>>,
        chatData.ownerId
    );
    await continuationScheduler.continue(meta.continuation, {data: data, comment: (args.summary as string)});
};

const vertexMainInstructions: VertexAiSystemInstructions<CalculateChatData> = {
    instructions: `
        You are a calculator which can add and subtract integers to an accumulated value
        - The current accumulated value is stored in application state. 
        - Call 'getSum' function to get current value
        - If user asks you to add some value, call 'add' function and supply the argument provided by user.
        - If user asks you to subtract some value, call 'subtract' function and supply the argument provided by user.
        - If user asks you to multiply by some value, call 'multiply' function and supply the argument provided by user.
        - If user asks you to divide by some value, call 'divide' function and provide a short summary of what should be done.
        - Don't make assumptions about what values to plug into functions. Ask for clarification if a user request is ambiguous.
    `,
    examples: [
        {
            type: "functionCall",
            input: "What is the current sum?",
            name: "getSum",
            arguments: {}
        },
        {
            type: "functionCall",
            input: "Add 25",
            name: "add",
            arguments: {value: 25}
        },
        {
            type: "functionCall",
            input: "Subtract 25",
            name: "subtract",
            arguments: {value: 25}
        },
        {
            type: "functionCall",
            input: "Multiply by 25",
            name: "multiply",
            arguments: {value: 25}
        },
        {
            type: "functionCall",
            input: "I want to divide the value by some number",
            name: "divide",
            arguments: {summary: "User wants to divide current value by some number"}
        }
    ],
    tools: {
        dispatcher: calculateDispatcher(switchToDivider),
        definition: [
            {
                functionDeclarations: [
                    {
                        name: "getSum",
                        description: "Returns current accumulated value or error description if there is an error"
                    },
                    {
                        name: "add",
                        description: "Adds supplied argument to the accumulated value and returns new value or error if there is an error",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                value: {
                                    type: FunctionDeclarationSchemaType.NUMBER,
                                    description: "Value to add to accumulated number"
                                }
                            },
                            required: ["value"]
                        }
                    },
                    {
                        name: "subtract",
                        description: "Subtracts supplied argument from the accumulated value and returns new value or error if there is an error",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                value: {
                                    type: FunctionDeclarationSchemaType.NUMBER,
                                    description: "Value to subtract from accumulated number"
                                }
                            },
                            required: ["value"]
                        }
                    },
                    {
                        name: "multiply",
                        description: "Multiplies current accumulated value by supplied argument and returns new value or error if there is an error",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                value: {
                                    type: FunctionDeclarationSchemaType.NUMBER,
                                    description: "Value to multiply accumulated number by"
                                }
                            },
                            required: ["value"]
                        }
                    },
                    {
                        name: "divide",
                        description: `
                            Use to call a special division assistant to help divide current accumulated number.
                            The function will return the updated accumulated state and optionally a comment what has been
                            done or what user wants to do next.
                        `,
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                summary: {
                                    type: FunctionDeclarationSchemaType.STRING,
                                    description: "A short summary about the division task"
                                }
                            },
                            required: ["summary"]
                        }
                    }
                ]
            }
        ]
    }
};

const vertexDividerInstructions: VertexAiSystemInstructions<CalculateChatData> = {
    instructions: `
        You are a calculator assistant who divides passed accumulated value by some numbers. You have a boss - main 
        calculator who will call you from time to time to help with division.
        - The current accumulated value is stored in application state. 
        - Call 'getSum' function to get current value
        - If user asks you to divide by some value, call 'divide' function and provide a divider value.
        - If user asks you for some other operation you need to return the request to your boss. Ask user 
          for a confirmation to switch back and call 'returnToBoss' providing a short summary of what user wants to be done.
        - User may ask you to return to your boss. Call 'done' providing a short summary of what you have done so far.
        - Don't make assumptions about what values to plug into functions. Ask for clarification if a user request is ambiguous.
    `,
    examples: [
        {
            type: "functionCall",
            input: "What is the current sum?",
            name: "getSum",
            arguments: {}
        },
        {
            type: "functionCall",
            input: "Divide by 25",
            name: "divide",
            arguments: {value: 25}
        },
        {
            type: "functionCall",
            input: "Subtract 25",
            name: "returnToBoss",
            arguments: {comment: "Subtract 25"}
        },
        {
            type: "functionCall",
            input: "Done",
            name: "returnToBoss",
            arguments: {comment: "Work done"}
        }
    ],
    tools: {
        dispatcher: divideDispatcher(switchToCalculator),
        definition: [
            {
                functionDeclarations: [
                    {
                        name: "getSum",
                        description: "Returns current accumulated value or error description if there is an error"
                    },
                    {
                        name: "divide",
                        description: "Divides accumulated value by supplied argument and returns new value or error if there is an error",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                value: {
                                    type: FunctionDeclarationSchemaType.NUMBER,
                                    description: "Value to divide accumulated number by"
                                }
                            },
                            required: ["value"]
                        }
                    },
                    {
                        name: "returnToBoss",
                        description: "Hands control back to your boss when user needs anything else but to divide",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                summary: {
                                    type: FunctionDeclarationSchemaType.STRING,
                                    description: "Summary of what user wants to be done"
                                }
                            },
                            required: ["summary"]
                        }
                    },
                    {
                        name: "done",
                        description: "Hands control back to your boss when user is done with you",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                summary: {
                                    type: FunctionDeclarationSchemaType.NUMBER,
                                    description: "Short description of what have been done so far"
                                }
                            },
                            required: ["summary"]
                        }
                    }
                ]
            }
        ]
    }
};

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const instructions: Record<string, VertexAiSystemInstructions<any>> = {
    [NAME]: vertexMainInstructions,
    [DIVIDER_NAME]: vertexDividerInstructions
};

export const calculate = async (uid: string, data: CalculateChatRequest): Promise<CalculateChatResponse> => {
    const chat = chats.doc();
    const config: VertexAiAssistantConfig = {
        engine: "vertexai",
        instructionsId: NAME
    };
    const result = await assistantChat.create(
        chat,
        uid,
        {sum: 0},
        config,
        [data.message],
        undefined,
        <CalculatorMeta>{
            aiMessageMeta: {
                name: NAME,
                engine: "VertexAi"
            }
        }
    );
    return {
        chatDocument: chat.path,
        status: result.status,
        data: result.data
    };
};

export const postToCalculate = async (uid: string, data: PostCalculateRequest): Promise<CalculateChatResponse> => {
    const result = await assistantChat.postMessage(
        db.doc(data.chatDocument) as DocumentReference<VertexAiChatState<CalculateChatData>>,
        uid,
        [data.message]
    );
    return {
        chatDocument: data.chatDocument,
        status: result.status,
        data: result.data
    };
};

export const closeCalculate = async (uid: string, data: CloseCalculateRequest): Promise<CalculateChatResponse> => {
    const result = await assistantChat.closeChat(
        db.doc(data.chatDocument) as DocumentReference<VertexAiChatState<CalculateChatData>>,
        uid,
    );
    return {
        chatDocument: data.chatDocument,
        status: result.status,
        data: result.data
    };
};

export const getWorker = (): ChatWorker => {
    const vertexAi = new VertexAI({
        project: projectID.value(),
        location: region
    });
    const model = vertexAi.getGenerativeModel(
        {
            model: "gemini-1.0-pro",
            generationConfig: {
                candidateCount: 1
            }
        },
        {
            timeout: 30 * 1000
        }
    );

    return chatFactory.worker(
        model,
        VERTEXAI_THREADS,
        instructions
    );
};

