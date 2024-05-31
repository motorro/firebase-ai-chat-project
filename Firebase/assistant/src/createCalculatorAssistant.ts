import OpenAI from "openai";
import ChatCompletionTool = OpenAI.ChatCompletionTool;
import {Beta} from "openai/resources";
import AssistantCreateParams = Beta.AssistantCreateParams;
import {FunctionTool} from "openai/src/resources/beta/assistants";

const instructions: string = `
You are a calculator which can add and subtract integers to an accumulated value
- The current accumulated value is stored in application state. 
- Call 'getSum' function to get current value
- If user asks you to add some value, call 'add' function and supply the argument provided by user.
- If user asks you to subtract some value, call 'subtract' function and supply the argument provided by user.
- If user asks you to multiply by some value, call 'multiply' function and supply the argument provided by user.
- If user asks you to divide by some value, call 'divide' function and provide a short summary of what should be done.
- Don't make assumptions about what values to plug into functions. Ask for clarification if a user request is ambiguous.
`;

const tools: Array<FunctionTool> = [
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
    },
    {
        type: "function",
        function: {
            name: "multiply",
            description: "Multiplies current accumulated value by supplied argument and returns new value or error if there is an error",
            parameters: {
                type: "object",
                properties: {
                    value: {
                        type: "integer",
                        description: "Value to multiply accumulated number by"
                    }
                },
                required: ["value"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "divide",
            description: `
                Use to call a special division assistant to help divide current accumulated number.
                The function will return the updated accumulated state and optionally a comment what has been
                done or what user wants to do next.
            `,
            parameters: {
                type: "object",
                properties: {
                    summary: {
                        type: "string",
                        description: "A short summary about the division task"
                    }
                },
                required: ["summary"]
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
        model: "gpt-4o"
    });
    console.log("Created assistant: ", assistant.id);
}

main();