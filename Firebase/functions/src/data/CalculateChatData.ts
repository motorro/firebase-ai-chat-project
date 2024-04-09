import {ChatData} from "@motorro/firebase-ai-chat-openai";

export interface CalculateChatData extends ChatData{
    readonly sum: number
}
