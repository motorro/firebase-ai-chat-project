import {WithEngine} from "./WithEngine";

/**
 * Close chat
 */
export interface CloseCalculateRequest extends WithEngine {
    readonly chatDocument: string
}
