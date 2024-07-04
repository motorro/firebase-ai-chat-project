import {defineSecret, defineString} from "firebase-functions/params";

export const NAME = "calculator";
export const SUBTRACTOR_NAME = "subtractor";
export const DIVIDER_NAME = "divider";
export const region = "europe-west1";
export const openAiApiKey = defineSecret("OPENAI_API_KEY");
export const openAiAssistantId = defineString("OPENAI_ASSISTANT_ID");
