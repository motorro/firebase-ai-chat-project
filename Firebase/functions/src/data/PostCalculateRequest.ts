import {WithEngine} from "./WithEngine";

/**
 * Posts to suggest task chat
 */
export interface PostCalculateRequest extends WithEngine {
    readonly chatDocument: string
    readonly message: string
}
