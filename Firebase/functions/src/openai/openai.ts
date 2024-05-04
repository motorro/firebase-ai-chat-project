import {CalculateChatRequest} from "../data/CalculateChatRequest";
import {
    factory,
    OpenAiAssistantConfig,
    OpenAiChatState,
    OpenAiWrapper,
    ToolsDispatcher
} from "@motorro/firebase-ai-chat-openai";
import {PostCalculateRequest} from "../data/PostCalculateRequest";
import {CalculateChatData} from "../data/CalculateChatData";
import {firestore} from "firebase-admin";
import CollectionReference = firestore.CollectionReference;
import {NAME, openAiApiKey, openAiAssistantId, region} from "../env";
import {getFunctions} from "firebase-admin/functions";
import {CalculateChatResponse} from "../data/CalculateChatResponse";
import DocumentReference = firestore.DocumentReference;
import {ChatWorker} from "@motorro/firebase-ai-chat-core";
import OpenAI from "openai";
import {calculateDispatcher} from "../common/calculator";
import {CloseCalculateRequest} from "../data/CloseCalculateRequest";
import {OPENAI_CHATS} from "../data/Collections";

const db = firestore();
const chats = db.collection(OPENAI_CHATS) as CollectionReference<OpenAiChatState<CalculateChatData>>;
const chatFactory = factory(db, getFunctions(), region);
const assistantChat = chatFactory.chat<CalculateChatData>("calculator");
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const dispatchers: Record<string, ToolsDispatcher<any>> = {
    [NAME]: calculateDispatcher
};

export const calculate = async (uid: string, data: CalculateChatRequest): Promise<CalculateChatResponse> => {
    const chat = chats.doc();
    const config: OpenAiAssistantConfig = {
        engine: "openai",
        assistantId: openAiAssistantId.value(),
        dispatcherId: NAME
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
        db.doc(data.chatDocument) as DocumentReference<OpenAiChatState<CalculateChatData>>,
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
        db.doc(data.chatDocument) as DocumentReference<OpenAiChatState<CalculateChatData>>,
        uid,
    );
    return {
        chatDocument: data.chatDocument,
        status: result.status,
        data: result.data
    };
};

export const getWorker = (): ChatWorker => {
    return chatFactory.worker(
        new OpenAiWrapper(new OpenAI({apiKey: openAiApiKey.value()})),
        dispatchers
    );
};

