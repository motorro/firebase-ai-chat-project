import OpenAI from "openai";
import ChatCompletionTool = OpenAI.ChatCompletionTool;
import {AssistantCreateParams} from "openai/src/resources/beta/assistants/assistants";

const instructions: string = `
You are a calculator which can add and subtract integers to an accumulated value
- The current accumulated value is stored in application state. 
- Call 'getSum' function to get current value
- If user asks you to add some value, call 'add' function and supply the argument provided by user
- If user asks you to subtract some value, call 'subtract' function and supply the argument provided by user
- Don't make assumptions about what values to plug into functions. Ask for clarification if a user request is ambiguous.
`;

const tools: Array<AssistantCreateParams.AssistantToolsFunction> = [
    {
        type: "function",
        function: {
            name: "getSum",
            description: "Returns current accumulated value",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "add",
            description: "Adds supplied argument to the accumulated value",
            parameters: {
                type: "object",
                properties: {
                    value: {
                        type: "integer",
                        description: "Value to add to accumulated number"
                    }
                },
                required: ["value"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "subtract",
            description: "Subtracts supplied argument from the accumulated value",
            parameters: {
                type: "object",
                properties: {
                    value: {
                        type: "integer",
                        description: "Value to subtract from accumulated number"
                    }
                },
                required: ["value"]
            }
        }
    }
];

async function main() {
    const openAi = new OpenAI();
    console.log("Creating calculator assistant...")
    const assistant = await openAi.beta.assistants.create({
        name: "Calculator",
        instructions: instructions,
        tools: tools,
        model: "gpt-3.5-turbo"
    });
    console.log("Created assistant: ", assistant.id);
}

main();