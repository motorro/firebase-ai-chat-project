import * as admin from "firebase-admin/app";
import {setGlobalOptions, logger as fLogger} from "firebase-functions/v2";

if (0 === admin.getApps().length) {
    admin.initializeApp();
    setGlobalOptions({maxInstances: 10});
}

import {
    ChatWorker,
    Logger,
    setLogger
} from "@motorro/firebase-ai-chat-core";
import {CalculateChatRequest} from "./data/CalculateChatRequest";
import {PostCalculateRequest} from "./data/PostCalculateRequest";
import {CloseCalculateRequest} from "./data/CloseCalculateRequest";
import {onTaskDispatched} from "firebase-functions/v2/tasks";
import {CallableOptions, CallableRequest, HttpsError, onCall as onCall2} from "firebase-functions/v2/https";
import {Engine, GetEnginesResponse} from "./data/GetEnginesResponse";
import {NAME, openAiApiKey, region} from "./env";
import {CalculateChatResponse} from "./data/CalculateChatResponse";
import {
    calculate as openAiCalculate,
    postToCalculate as openAiPostToCalculate,
    closeCalculate as openAiCloseCalculate,
    getWorker as openAiGetWorker
} from "./openai/openai";
import {
    calculate as vertexAiCalculate,
    postToCalculate as vertexAiPostToCalculate,
    closeCalculate as vertexAiCloseCalculate,
    getWorker as vertexAiGetWorker
} from "./vertexai/vertexai";

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

const options: CallableOptions = {
    secrets: [openAiApiKey],
    region: region,
    invoker: "public"
};

async function ensureAuth<DATA, RES>(request: CallableRequest<DATA>, block: (uid: string, data: DATA) => Promise<RES>): Promise<RES> {
    const uid = request.auth?.uid;
    if (undefined === uid) {
        logger.w("Unauthenticated");
        return Promise.reject<RES>(new HttpsError("unauthenticated", "Unauthenticated"));
    }
    return await block(uid, request.data);
}

const supportedEngines: ReadonlyArray<Engine> = [
    {id: "openai", name: "OpenAI"},
    {id: "vertexai", name: "VertexAI"}
];
export const getEngines = onCall2(options, async (): Promise<GetEnginesResponse> => {
    return {engines: supportedEngines};
});

export const calculate = onCall2(options, async (request: CallableRequest<CalculateChatRequest>) => {
    return ensureAuth(request, async (uid, data): Promise<CalculateChatResponse> => {
        switch (data.engine) {
            case "vertexai":
                return await vertexAiCalculate(uid, data);
            default:
                return await openAiCalculate(uid, data);
        }
    });
});
export const postToCalculate = onCall2(options, async (request: CallableRequest<PostCalculateRequest>) => {
    return ensureAuth(request, async (uid, data): Promise<CalculateChatResponse> => {
        switch (data.engine) {
            case "vertexai":
                return await vertexAiPostToCalculate(uid, data);
            default:
                return await openAiPostToCalculate(uid, data);
        }
    });
});
export const closeCalculate = onCall2(options, async (request: CallableRequest<CloseCalculateRequest>) => {
    return ensureAuth(request, async (uid, data): Promise<CalculateChatResponse> => {
        switch (data.engine) {
            case "vertexai":
                return await vertexAiCloseCalculate(uid, data);
            default:
                return await openAiCloseCalculate(uid, data);
        }
    });
});

const workerFactories: ReadonlyArray<() => ChatWorker> = [
    openAiGetWorker,
    vertexAiGetWorker
];

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
        for (const factory of workerFactories) {
            if (await factory().dispatch(req)) {
                return;
            }
        }
        logger.w("Worker not found for request:", JSON.stringify(req.data));
    }
);
