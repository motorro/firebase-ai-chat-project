import {ChatMeta, Meta} from "@motorro/firebase-ai-chat-vertexai";

export interface MessageMeta extends Meta {
    readonly name: string,
    readonly engine: string
}

export interface CalculatorMeta extends ChatMeta {
    readonly aiMessageMeta: MessageMeta
}
