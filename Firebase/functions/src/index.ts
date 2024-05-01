import * as admin from "firebase-admin/app";
import {setGlobalOptions, logger as fLogger} from "firebase-functions/v2";

if (0 === admin.getApps().length) {
    admin.initializeApp();
    setGlobalOptions({maxInstances: 10});
}

import {
    Logger,
    setLogger,
    OpenAiWrapper,
    ToolsDispatcher,
    factory,
    OpenAiChatState, OpenAiAssistantConfig
} from "@motorro/firebase-ai-chat-openai";
import {CalculateChatRequest} from "./data/CalculateChatRequest";
import {firestore} from "firebase-admin";
import {CalculateChatData} from "./data/CalculateChatData";
import {defineSecret, defineString} from "firebase-functions/params";
import CollectionReference = firestore.CollectionReference;
import {PostCalculateRequest} from "./data/PostCalculateRequest";
import DocumentReference = firestore.DocumentReference;
import {CloseCalculateRequest} from "./data/CloseCalculateRequest";
import {onTaskDispatched} from "firebase-functions/v2/tasks";
import OpenAI from "openai";
import {CHATS} from "./data/Collections";
import {CallableOptions, CallableRequest, HttpsError, onCall as onCall2} from "firebase-functions/v2/https";
import {getFunctions} from "firebase-admin/functions";

export const NAME = "calculator";
const logger: Logger = {
    d: (...args: unknown[]) => {
        fLogger.debug([NAME, ...args]);
    },
    i: (...args: unknown[]) => {
        fLogger.info([NAME, ...args]);
    },
    w: (...args: unknown[]) => {
        fLogger.warn([NAME, ...args]);
    },
    e: (...args: unknown[]) => {
        fLogger.error([NAME, ...args]);
    }
};
setLogger(logger);

const region = "europe-west1";
const openAiApiKey = defineSecret("OPENAI_API_KEY");
const openAiAssistantId = defineString("OPENAI_ASSISTANT_ID");

const dispatcher: ToolsDispatcher<{sum: number}> = function(
    data: CalculateChatData,
    name: string,
    args: Record<string, unknown>
): CalculateChatData | Promise<CalculateChatData> {
    switch (name) {
        case "getSum":
            return {
                sum: data.sum
            };
        case "add":
            return {
                sum: data.sum + (args.value as number)
            };
        case "subtract":
            return {
                sum: data.sum - (args.value as number)
            };
        default:
            throw new HttpsError("unimplemented", "Unimplemented function call");
    }
};
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const dispatchers: Record<string, ToolsDispatcher<any>> = {
    [NAME]: dispatcher
};

const options: CallableOptions = {
    secrets: [openAiApiKey],
    region: region,
    invoker: "public"
};

const db = firestore();
const chats = db.collection(CHATS) as CollectionReference<OpenAiChatState<CalculateChatData>>;
const chatFactory = factory(firestore(), getFunctions(), region);
const assistantChat = chatFactory.chat("calculator");

async function ensureAuth<DATA, RES>(request: CallableRequest<DATA>, block: (uid: string, data: DATA) => Promise<RES>): Promise<RES> {
    const uid = request.auth?.uid;
    if (undefined === uid) {
        logger.w("Unauthenticated");
        return Promise.reject<RES>(new HttpsError("unauthenticated", "Unauthenticated"));
    }
    return await block(uid, request.data);
}

export const calculate = onCall2(options, async (request: CallableRequest<CalculateChatRequest>) => {
    return ensureAuth(request, async (uid, data) => {
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
    });
});
export const postToCalculate = onCall2(options, async (request: CallableRequest<PostCalculateRequest>) => {
    return ensureAuth(request, async (uid, data) => {
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
    });
});
export const closeCalculate = onCall2(options, async (request: CallableRequest<CloseCalculateRequest>) => {
    return ensureAuth(request, async (uid, data) => {
        const result = await assistantChat.closeChat(
            db.doc(data.chatDocument) as DocumentReference<OpenAiChatState<CalculateChatData>>,
            uid,
        );
        return {
            chatDocument: data.chatDocument,
            status: result.status,
            data: result.data
        };
    });
});

export const calculator = onTaskDispatched(
    {
        secrets: [openAiApiKey],
        retryConfig: {
            maxAttempts: 1,
            minBackoffSeconds: 30
        },
        rateLimits: {
            maxConcurrentDispatches: 6
        },
        region: region
    },
    async (req) => {
        const ai = new OpenAiWrapper(
            new OpenAI({apiKey: openAiApiKey.value()})
        );
        await chatFactory.worker(ai, dispatchers).dispatch(req);
    }
);
