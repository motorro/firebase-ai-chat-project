import {ToolsDispatcher} from "@motorro/firebase-ai-chat-openai";
import {CalculateChatData} from "../data/CalculateChatData";
import {HttpsError} from "firebase-functions/v2/https";
import {logger} from "@motorro/firebase-ai-chat-core";

export const calculateDispatcher: ToolsDispatcher<CalculateChatData> = function(
    data: CalculateChatData,
    name: string,
    args: Record<string, unknown>
): CalculateChatData | Promise<CalculateChatData> {
    switch (name) {
        case "getSum":
            logger.d("Getting sum. Current state: ", JSON.stringify(data));
            return {
                sum: data.sum
            };
        case "add":
            logger.d("Adding: ", args.value);
            return {
                sum: data.sum + (args.value as number)
            };
        case "subtract":
            logger.d("Subtracting: ", args.value);
            return {
                sum: data.sum - (args.value as number)
            };
        default:
            logger.w(`Unimplemented function call: ${name}. Args:`, JSON.stringify(args));
            throw new HttpsError("unimplemented", "Unimplemented function call");
    }
};
