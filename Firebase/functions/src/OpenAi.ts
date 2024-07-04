import * as admin from "firebase-admin/app";

if (0 === admin.getApps().length) {
    admin.initializeApp();
}

import * as fs from "fs";
import {parse, stringify} from "envfile";
import OpenAI from "openai";
import {Beta, FunctionDefinition} from "openai/resources";
import {AssistantCreateParams} from "openai/resources/beta";
import {Meta, VertexAiSystemInstructions} from "@motorro/firebase-ai-chat-vertexai";
import {printAiExample} from "@motorro/firebase-ai-chat-core";
import {FunctionDeclarationSchema, FunctionDeclarationsTool} from "@google-cloud/vertexai";
import {FunctionParameters} from "openai/src/resources/shared";
import AssistantUpdateParams = Beta.AssistantUpdateParams;
import FunctionTool = Beta.FunctionTool;
import {calculatorMainInstructions} from "./common/instructions";
import {CalculateChatData} from "./data/CalculateChatData";
import {CalculatorMeta} from "./data/MessageMeta";

const openAi = new OpenAI();

export async function createAssistant(
    envPath: string,
    envName: string,
    params: AssistantCreateParams
): Promise<string> {
    let env: Record<string, string> = {};
    try {
        env = parse(await fs.promises.readFile(envPath, "utf8"));
    } catch (e) {
        console.warn("Error getting env file: ", e);
    }
    let assistantId = env[envName];
    if (assistantId) {
        assistantId = await doUpdateAssistant(assistantId, {
            name: params.name,
            description: params.description,
            instructions: params.instructions,
            tools: params.tools,
            model: params.model
        });
    } else {
        assistantId = await doCreateAssistant(params);
    }
    await fs.promises.writeFile(envPath, stringify({
        ...env,
        [envName]: assistantId
    }));
    return assistantId;
}

async function doCreateAssistant(params: AssistantCreateParams): Promise<string> {
    console.log("Creating assistant...");
    const assistant = await openAi.beta.assistants.create(params);
    console.log("Created assistant: ", assistant.id);
    return assistant.id;
}

async function doUpdateAssistant(id: string, params: AssistantUpdateParams): Promise<string> {
    console.log("Updating assistant", id);
    const assistant = await openAi.beta.assistants.update(id, params);
    console.log("Created assistant: ", assistant.id);
    return assistant.id;
}

function getOpenAiConfig(
    name: string,
    model: string,
    instructions: VertexAiSystemInstructions<CalculateChatData, Meta, CalculatorMeta>
): AssistantCreateParams {
    let openAiInstructions = instructions.instructions;
    if (instructions.examples && instructions.examples.length > 0) {
        instructions.examples.forEach((it, index) => {
            openAiInstructions += `\n${printAiExample(it, index + 1)}}`;
        });
    }
    const tools: Array<FunctionTool> = [];
    instructions.tools?.definition?.forEach((tool) => {
        const functionDeclarations = (<FunctionDeclarationsTool>tool).functionDeclarations;
        if (functionDeclarations) {
            functionDeclarations.forEach((func) => {
                const definition: FunctionDefinition = {
                    name: func.name,
                    description: func.description,
                    parameters: vertexParamsToOpenAi(func.parameters)
                };
                tools.push({type: "function", function: definition});
            });
        }
    });

    function vertexParamsToOpenAi(vertex?: FunctionDeclarationSchema): FunctionParameters | undefined {
        if (!vertex) {
            return undefined;
        }
        return {
            type: vertex.type.toLowerCase(),
            properties: typeToLower(vertex.properties),
            required: vertex.required
        };

        function typeToLower(record: Record<string, unknown>): Record<string, unknown> {
            const result = record;
            const keys = Object.keys(record);
            for (const key of keys) {
                if ("object" === typeof record[key] && null !== record[key]) {
                    result[key] = typeToLower(<Record<string, unknown>>record[key]);
                }
                if ("type" === key && "string" === typeof record[key]) {
                    result[key] = (<string>record[key]).toLowerCase();
                }
            }
            return result;
        }
    }

    return {
        name: name,
        instructions: openAiInstructions,
        model: model,
        tools: tools
    };
}

const openAiModel = "gpt-4o";

async function main() {
    console.log("Exporting assistants...");

    console.log("Calculator");
    await createAssistant(
        ".env.openaitest-b9962",
        "OPENAI_ASSISTANT_ID",
        getOpenAiConfig("Calculator", openAiModel, calculatorMainInstructions)
    );
}

main();
