import {ChatData} from "firebase-openai-chat";

export interface CalculateChatData extends ChatData{
    readonly sum: number
}
