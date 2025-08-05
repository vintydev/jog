


export const functionSchemas = [
    {
        type: "function",
        function: {
            name: "createMultipleJogs",
            description: "Create multiple jogs with name, start time, reminders, and optional steps",
            parameters: {
                type: "object",
                properties: {
                    jogs: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                jogName: { type: "string", description: "Name of the jog" },
                                startTime: { type: "string", description: "Due time for the jog (e.g., 4 PM, 16:00)" },
                                reminderTimes: {
                                    type: "array",
                                    items: { type: "number" },
                                    description: "Reminder intervals in minutes before the jog (5, 10, 15, 30, 60)",
                                },
                                isStepBased: {
                                    type: "boolean",
                                    description: "Whether this jog should be a step-based jog",
                                },
                                steps: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            title: { type: "string", description: "Name of the step." },
                                            dueDate: { type: "string", description: "Due time for the step (e.g., 4 PM, 16:00)" },
                                        },
                                        required: ["title", "dueDate"],
                                        additionalProperties: false,
                                    },
                                    description: "Steps for the jog. Only required if isStepBased is true",
                                    nullable: true, // Steps are optional
                                },
                            },
                            required: ["jogName", "startTime", "reminderTimes", "isStepBased", "steps"],
                            additionalProperties: false,
                        },
                    },
                },
                required: ["jogs"],
                additionalProperties: false,
            },
            strict: true,
        },
    },
]