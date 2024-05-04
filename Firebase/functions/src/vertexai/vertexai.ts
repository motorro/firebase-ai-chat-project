import {CalculateChatData} from "../data/CalculateChatData";
import {calculateDispatcher} from "../common/calculator";
import {FunctionDeclarationSchemaType, VertexAI} from "@google-cloud/vertexai";
import {firestore} from "firebase-admin";
import {VERTEXAI_CHATS, VERTEXAI_THREADS} from "../data/Collections";
import {
    factory,
    VertexAiAssistantConfig,
    VertexAiChatState,
    VertexAiSystemInstructions
} from "@motorro/firebase-ai-chat-vertexai";
import {getFunctions} from "firebase-admin/functions";
import {NAME, region} from "../env";
import {CalculateChatRequest} from "../data/CalculateChatRequest";
import {CalculateChatResponse} from "../data/CalculateChatResponse";
import {PostCalculateRequest} from "../data/PostCalculateRequest";
import {CloseCalculateRequest} from "../data/CloseCalculateRequest";
import {ChatWorker} from "@motorro/firebase-ai-chat-core";
import CollectionReference = firestore.CollectionReference;
import DocumentReference = firestore.DocumentReference;
import {projectID} from "firebase-functions/params";

const vertexInstructions: VertexAiSystemInstructions<CalculateChatData> = {
    instructions: `
        You are a calculator which can add and subtract integers to an accumulated value
        - The current accumulated value is stored in application state. 
        - Call 'getSum' function to get current value
        - If user asks you to add some value, call 'add' function and supply the argument provided by user
        - If user asks you to subtract some value, call 'subtract' function and supply the argument provided by user
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
        }
    ],
    tools: {
        dispatcher: calculateDispatcher,
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
                    }
                ]
            }
        ]
    }
};

const db = firestore();
const chats = db.collection(VERTEXAI_CHATS) as CollectionReference<VertexAiChatState<CalculateChatData>>;
const chatFactory = factory(db, getFunctions(), region);
const assistantChat = chatFactory.chat<CalculateChatData>("calculator");
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const instructions: Record<string, VertexAiSystemInstructions<any>> = {
    [NAME]: vertexInstructions
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
        [data.message]
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
        chatFactory.ai(model, VERTEXAI_THREADS),
        instructions
    );
};

