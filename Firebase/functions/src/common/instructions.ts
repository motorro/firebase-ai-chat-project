import {Meta, VertexAiSystemInstructions} from "@motorro/firebase-ai-chat-vertexai";
import {CalculateChatData} from "../data/CalculateChatData";
import {calculateDispatcher, divideDispatcher, subtractDispatcher} from "./calculator";
import {FunctionDeclarationSchemaType} from "@google-cloud/vertexai";
import {CalculatorMeta} from "../data/MessageMeta";

export const calculatorMainInstructions: VertexAiSystemInstructions<CalculateChatData, Meta, CalculatorMeta> = {
    instructions: `
You are a calculator which can add and subtract integers to an accumulated value

You have a special assistant called Subtractor that is in charge for number subtraction operations.
If the client wants to divide the accumulated value, call Subtractor by calling 'subtract' function.
The Subtractor will handle the request and return with a new accumulated value.

You have a special assistant called Divider that is in charge for the number division operations. 
If the client wants to divide the accumulated value, call Divider by posting a special message like:
"[DIVISION]: The client wants to divide by 5"
The Divider will handle the request and send you the new accumulated value when ready.

- The current accumulated value is stored in application state. 
- Call 'getSum' function to get current value
- If user asks you to add some value, call 'add' function and supply the argument provided by user.
- If user asks you to subtract some value, call 'subtract' function and supply the argument provided by user.
- If user asks you to multiply by some value, call 'multiply' function and supply the argument provided by user.
- If user asks you to divide by some value, call Divider as described above.
- Don't make assumptions about what values to plug into functions. Ask for clarification if a user request is ambiguous.
    `,
    examples: [
        {
            type: "functionCall",
            input: "What is the current sum?",
            name: "getSum",
            arguments: {}
        },
        {
            type: "functionCall",
            input: "Add 25",
            name: "add",
            arguments: {value: 25}
        },
        {
            type: "functionCall",
            input: "Subtract 25",
            name: "subtract",
            arguments: {value: 25}
        },
        {
            type: "functionCall",
            input: "Multiply by 25",
            name: "multiply",
            arguments: {value: 25}
        },
        {
            type: "response",
            input: "I want to divide the value by 10",
            output: "[DIVISION]: The client wants to divide by 10"
        }
    ],
    tools: {
        dispatcher: calculateDispatcher,
        definition: [
            {
                functionDeclarations: [
                    {
                        name: "getSum",
                        description: "Returns current accumulated value in the 'data' field or an error description if there is an error."
                    },
                    {
                        name: "add",
                        // eslint-disable-next-line max-len
                        description: "Adds supplied argument to the accumulated value and returns new value in the 'data' field or an error if there is an error.",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                value: {
                                    type: FunctionDeclarationSchemaType.NUMBER,
                                    description: "Value to add to accumulated number"
                                }
                            },
                            required: ["value"]
                        }
                    },
                    {
                        name: "subtract",
                        // eslint-disable-next-line max-len
                        description: "Calls Subtractor and returns confirmation in the 'result' field or an error if there is an error",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                value: {
                                    type: FunctionDeclarationSchemaType.NUMBER,
                                    description: "Value to subtract from accumulated number"
                                }
                            },
                            required: ["value"]
                        }
                    },
                    {
                        name: "multiply",
                        // eslint-disable-next-line max-len
                        description: "Multiplies current accumulated value by supplied argument and and returns new value in the 'data' field or an error if there is an error",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                value: {
                                    type: FunctionDeclarationSchemaType.NUMBER,
                                    description: "Value to multiply accumulated number by"
                                }
                            },
                            required: ["value"]
                        }
                    }
                ]
            }
        ]
    }
};

export const calculatorSubtractorInstructions: VertexAiSystemInstructions<CalculateChatData, Meta, CalculatorMeta> = {
    instructions: `
You are a calculator assistant who subtracts passed values from accumulated value. You have a boss - main 
calculator who will call you from time to time to help with subtraction.

- The current accumulated value is stored in application state. 
- Call 'getSum' function to get current value
- If user asks you to subtract some value, call 'subtract' function and provide a value to subtract.
- Don't make assumptions about what values to plug into functions. Ask for clarification if a user request is ambiguous.

When you are done with dividing, do the following:
1) Ask the client if he needs to do any more divisions
2) If no, call 'returnToBoss' function
Your boss will handle the request from this point.
    `,
    examples: [
        {
            type: "functionCall",
            input: "What is the current sum?",
            name: "getSum",
            arguments: {}
        },
        {
            type: "functionCall",
            input: "Divide by 25",
            name: "divide",
            arguments: {value: 25}
        },
        {
            type: "response",
            input: "Subtract 25",
            output: "[DONE]: Subtract 25"
        },
        {
            type: "response",
            input: "Done",
            output: "[DONE]: Done"
        }
    ],
    tools: {
        dispatcher: subtractDispatcher,
        definition: [
            {
                functionDeclarations: [
                    {
                        name: "getSum",
                        description: "Returns current accumulated value in the 'data' field or an error description if there is an error."
                    },
                    {
                        name: "subtract",
                        // eslint-disable-next-line max-len
                        description: "Subtracts passed value from accumulated value and returns new value in the 'data' field or an error if there is an error",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                value: {
                                    type: FunctionDeclarationSchemaType.NUMBER,
                                    description: "Value to subtract from accumulated value"
                                }
                            },
                            required: ["value"]
                        }
                    },
                    {
                        name: "returnToBoss",
                        // eslint-disable-next-line max-len
                        description: "Returns to boss when work is done",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                summary: {
                                    type: FunctionDeclarationSchemaType.STRING,
                                    description: "A summary of performed work or a new request from the client"
                                }
                            }
                        }
                    }
                ]
            }
        ]
    }
};

export const calculatorDividerInstructions: VertexAiSystemInstructions<CalculateChatData, Meta, CalculatorMeta> = {
    instructions: `
You are a calculator assistant who divides passed accumulated value by some numbers. You have a boss - main 
calculator who will call you from time to time to help with division.

- The current accumulated value is stored in application state. 
- Call 'getSum' function to get current value
- If user asks you to divide by some value, call 'divide' function and provide a divider value.
- Don't make assumptions about what values to plug into functions. Ask for clarification if a user request is ambiguous.

When you are done with dividing, do the following:
1) Ask the client if he needs to do any more divisions
2) If no, post a special message: "[DONE]: Done"
Your boss will handle the request from this point.
    `,
    examples: [
        {
            type: "functionCall",
            input: "What is the current sum?",
            name: "getSum",
            arguments: {}
        },
        {
            type: "functionCall",
            input: "Divide by 25",
            name: "divide",
            arguments: {value: 25}
        },
        {
            type: "response",
            input: "Subtract 25",
            output: "[DONE]: Subtract 25"
        },
        {
            type: "response",
            input: "Done",
            output: "[DONE]: Done"
        }
    ],
    tools: {
        dispatcher: divideDispatcher,
        definition: [
            {
                functionDeclarations: [
                    {
                        name: "getSum",
                        description: "Returns current accumulated value in the 'data' field or an error description if there is an error."
                    },
                    {
                        name: "divide",
                        // eslint-disable-next-line max-len
                        description: "Divides accumulated value by supplied argument and returns new value in the 'data' field or an error if there is an error",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                value: {
                                    type: FunctionDeclarationSchemaType.NUMBER,
                                    description: "Value to divide accumulated number by"
                                }
                            },
                            required: ["value"]
                        }
                    }
                ]
            }
        ]
    }
};
