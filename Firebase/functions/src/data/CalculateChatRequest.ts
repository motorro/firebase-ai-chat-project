import {WithEngine} from "./WithEngine";

export interface CalculateChatRequest extends WithEngine {
    readonly message: string
}


