import {ChatStatus} from "firebase-openai-chat";
import {CalculateChatData} from "./CalculateChatData";

/**
 * Represents a response for suggesting a task.
 */
export interface CalculateChatResponse {
    /**
     * Created chat document
     */
    readonly chatDocument: string
    /**
     * Chat status
     */
    readonly status: ChatStatus,
    /**
     * Chat data
     */
    readonly data: CalculateChatData
}
