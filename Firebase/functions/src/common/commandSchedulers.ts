import {CommandScheduler, TaskScheduler} from "@motorro/firebase-ai-chat-core";
import {factory as openAiFactory} from "@motorro/firebase-ai-chat-openai";
import {factory as vertexAiFactory} from "@motorro/firebase-ai-chat-vertexai";
import {firestore} from "firebase-admin";
import {getFunctions} from "firebase-admin/functions";
import {region} from "../env";

export const commandSchedulers = (queueName: string, taskScheduler: TaskScheduler): ReadonlyArray<CommandScheduler> => {
    return [
        ...openAiFactory(firestore(), getFunctions(), region, undefined, undefined, true, true).createDefaultCommandSchedulers(queueName, taskScheduler),
        ...vertexAiFactory(firestore(), getFunctions(), region, undefined, undefined, true, true).createDefaultCommandSchedulers(queueName, taskScheduler)
    ];
};
