import {CalculateChatData} from "../data/CalculateChatData";
import {handOverProcessor, parseOperation} from "../common/calculator";
import {Part, VertexAI} from "@google-cloud/vertexai";
import {firestore} from "firebase-admin";
import {CHATS, VERTEXAI_THREADS} from "../data/Collections";
import {
    DefaultVertexAiMessageMapper,
    factory,
    VertexAiAssistantConfig,
    VertexAiChatState,
    VertexAiMessageMapper,
    VertexAiSystemInstructions
} from "@motorro/firebase-ai-chat-vertexai";
import {getFunctions} from "firebase-admin/functions";
import {DIVIDER_NAME, NAME, region, SUBTRACTOR_NAME} from "../env";
import {CalculateChatRequest} from "../data/CalculateChatRequest";
import {CalculateChatResponse} from "../data/CalculateChatResponse";
import {PostCalculateRequest} from "../data/PostCalculateRequest";
import {CloseCalculateRequest} from "../data/CloseCalculateRequest";
import {ChatWorker, MessageMiddleware, NewMessage} from "@motorro/firebase-ai-chat-core";
import {projectID} from "firebase-functions/params";
import {CalculatorMeta} from "../data/MessageMeta";
import {Content} from "@google-cloud/vertexai/src/types/content";
import CollectionReference = firestore.CollectionReference;
import DocumentReference = firestore.DocumentReference;
import {commandSchedulers} from "../common/commandSchedulers";
import {
    calculatorDividerInstructions,
    calculatorMainInstructions,
    calculatorSubtractorInstructions
} from "../common/instructions";

const db = firestore();
const chats = db.collection(CHATS) as CollectionReference<VertexAiChatState<CalculateChatData>>;
const chatFactory = factory(db, getFunctions(), region, undefined, undefined, true, true);
const assistantChat = chatFactory.chat<CalculateChatData>("calculator", commandSchedulers);

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const instructions: Record<string, VertexAiSystemInstructions<any, any, any>> = {
    [NAME]: calculatorMainInstructions,
    [SUBTRACTOR_NAME]: calculatorSubtractorInstructions,
    [DIVIDER_NAME]: calculatorDividerInstructions
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

const messageMapper: VertexAiMessageMapper = {
    toAi: function(message: NewMessage): Part[] {
        return DefaultVertexAiMessageMapper.toAi(message);
    },
    fromAi: function(message: Content): NewMessage | undefined {
        const text: Array<string> = [];
        for (const part of message.parts) {
            if (undefined !== part.text) {
                text.push(part.text);
            }
        }
        return parseOperation(text.join("\n"));
    }
};

export const getWorker = (): ChatWorker => {
    const vertexAi = new VertexAI({
        project: projectID.value(),
        location: region
    });
    const model = vertexAi.getGenerativeModel(
        {
            model: "gemini-1.5-flash",
            generationConfig: {
                candidateCount: 1
            }
        },
        {
            timeout: 30 * 1000
        }
    );

    const handOver: MessageMiddleware<CalculateChatData, CalculatorMeta> = chatFactory.handOverMiddleware(
        "calculator",
        handOverProcessor,
        commandSchedulers
    );
    return chatFactory.worker(
        model,
        VERTEXAI_THREADS,
        instructions,
        messageMapper,
        undefined,
        [handOver],
        commandSchedulers
    );
};

