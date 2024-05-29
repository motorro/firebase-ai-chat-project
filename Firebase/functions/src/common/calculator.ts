import {FirebaseQueueTaskScheduler, ToolsDispatcher} from "@motorro/firebase-ai-chat-openai";
import {CalculateChatData} from "../data/CalculateChatData";
import {HttpsError} from "firebase-functions/v2/https";
import {Continuation, ContinuationCommand, isContinuationCommand, logger} from "@motorro/firebase-ai-chat-core";
import {DispatchResult} from "@motorro/firebase-ai-chat-core/lib/aichat/ToolsDispatcher";
import {getFunctions} from "firebase-admin/functions";
import {region} from "../env";

const taskScheduler = new FirebaseQueueTaskScheduler(getFunctions(), region);
export const multiplierQueueName = "multiply";

export const calculateDispatcher: ToolsDispatcher<CalculateChatData> = async function(
    data: CalculateChatData,
    name: string,
    args: Record<string, unknown>,
    continuation: ContinuationCommand<unknown>
): Promise<DispatchResult<CalculateChatData> | Continuation<DispatchResult<CalculateChatData>>> {
    switch (name) {
        case "getSum":
            logger.d("Getting sum. Current state: ", JSON.stringify(data));
            return {
                data: {
                    sum: data.sum
                }
            };
        case "add":
            logger.d("Adding: ", args.value);
            return {
                data: {
                    sum: data.sum + (args.value as number)
                }
            };
        case "subtract":
            logger.d("Subtracting: ", args.value);
            return {
                data: {
                    sum: data.sum - (args.value as number)
                }
            };
        case "multiply":
            logger.d("Suspending multiplication: ", args.value);
            await taskScheduler.schedule(
                multiplierQueueName,
                {
                    data: data,
                    factor: (args.value as number),
                    continuationCommand: continuation
                },
                {
                    // To get rid of DEMO race condition when continuation sometimes
                    // resumed before data is saved
                    scheduleDelaySeconds: 2
                }
            );
            return Continuation.suspend();
        default:
            logger.w(`Unimplemented function call: ${name}. Args:`, JSON.stringify(args));
            throw new HttpsError("unimplemented", "Unimplemented function call");
    }
};

export interface MultiplyCommand extends Record<string, unknown>{
    readonly data: CalculateChatData
    readonly factor: number
    readonly continuationCommand: ContinuationCommand<unknown>
}

export function isMultiplyCommand(data: unknown): data is MultiplyCommand {
    return "object" === typeof data && null != data
        && "factor" in data && "number" === typeof data.factor
        && "continuationCommand" in data && isContinuationCommand(data.continuationCommand);
}

