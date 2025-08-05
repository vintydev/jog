

type RetryOptions = {
    retries?: number;
    delayMs?: number;
    backoffFactor?: number;
    fallbackModel?: string;
};

export async function retryOpenAIRequest<T>(requestFn: (model: string) => Promise<T>, model = "gpt-4o", options: RetryOptions = {}) : Promise<T> {
    
    
    const {  retries = 2, delayMs = 1000, backoffFactor = 2, fallbackModel = "gpt-3.5-turbo"} = options;

    let attempt = 0;
    let currentDelay = delayMs;

    while (attempt <= retries) {
        try {
            return await requestFn(model);
        } catch (error: any) {

            const isFinalAttempt = attempt === retries;

            // Log error for internal tracking, but keep it silent to users
            console.warn("OpenAI error on attempt ${attempt + 1}:", error?.message || error);

            // If its a final attempt, try fallback model
            if (isFinalAttempt && model !== fallbackModel) {
                console.log("Retrying with fallback model:", fallbackModel);
                return await requestFn(fallbackModel);
            }

            // Wait before retrying
            await new Promise((res) => setTimeout(res, currentDelay));
            currentDelay *= backoffFactor;
            attempt++;
        }
    }

    throw new Error("All retries failed for OpenAI request.");
}