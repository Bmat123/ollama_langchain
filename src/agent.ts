import { 
    GoogleGenAI, 
    GenerateContentParameters,
    // Removed CitationMetadata and CitationSource imports to fix TS2305
} from '@google/genai';
import * as dotenv from 'dotenv'; 
import { TrainingPlan } from './training-plan';import { Rest } from './training-activity';
import { Running, Cycling, Swimming, TrainingActivity } from './training-activity';
import { Interval } from './interval';
import { COACH_SYSTEM_INSTRUCTION, EXAMPLE_USER_PROMPT, SHORT_PROMPT } from './prompts';

// Load environment variables from .env file
dotenv.config();

// --- CONFIGURATION ---

// The SDK will automatically use GEMINI_API_KEY from process.env if available.
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';

// Throw an error if the key is missing to fail early and securely
if (!API_KEY) {
    throw new Error("API Key Error: GEMINI_API_KEY is not set. Please create a .env file based on .env.example.");
}

// --- EXPONENTIAL BACKOFF UTILITY ---

/**
 * Sleeps for a calculated duration with exponential backoff and jitter.
 * @param attempt The current retry attempt (0-indexed).
 * @param baseDelayMs The starting delay in milliseconds (e.g., 500ms).
 */
function sleepWithBackoff(attempt: number, baseDelayMs: number): Promise<void> {
    const maxRetries = 5;
    if (attempt >= maxRetries) {
        throw new Error("Max retries exceeded.");
    }
    // Calculate exponential delay: baseDelay * 2^attempt
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
    // Add jitter (randomness) to prevent synchronized retries
    const jitter = Math.random() * exponentialDelay;
    const delay = Math.min(exponentialDelay + jitter, 10000); // Cap delay at 10 seconds

    return new Promise(resolve => setTimeout(resolve, delay));
}

// --- CORE AGENT FUNCTION ---

/**
 * Calls the Gemini API with resilience (backoff) and grounding (Google Search).
 * @param prompt The user's specific request (e.g., "Create a 12-week plan for an Olympic distance race").
 * @returns The generated text response and any associated citation sources.
 */
async function generateTriathlonPlan(prompt: string): Promise<{ text: string, sources: { uri: string, title: string }[] }> {
    // Initialize the AI client using the key from the environment
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // The core request payload contains only required, strictly-typed properties
    const request: GenerateContentParameters = {
        model: MODEL_NAME,
        contents: [{ role: "user", parts: [{ text: SHORT_PROMPT }] }],
    };

    // Use an 'augmentedRequest' cast as 'any' to include properties 
    // ('tools' and 'systemInstruction') that may cause TS errors in specific SDK versions.
    const augmentedRequest = {
        ...request,
        // FIX TS2353: Move systemInstruction here
        systemInstruction: { parts: [{ text: SHORT_PROMPT }] },
        // CRUCIAL: Enforce JSON output mode
        generationConfig: {
            responseMimeType: "application/json",
        },
        // CRUCIAL: Enable Google Search Grounding
        //tools: [{ googleSearch: {} }],
    } as any;


    const maxAttempts = 5;
    const baseDelay = 500; // Start with 0.5s delay

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            // Use the augmented request with all necessary properties
            const response = await ai.models.generateContent(augmentedRequest);

            const candidate = response.candidates?.[0];
            const text = candidate?.content?.parts?.[0]?.text || "Failed to generate content.";
            
            let sources: { uri: string, title: string }[] = [];
            
            // Use groundingMetadata, which is common for Google Search results
            const groundingMetadata = candidate?.groundingMetadata;

   
            if (groundingMetadata && (groundingMetadata as any).groundingAttributions) {
                sources = (groundingMetadata as any).groundingAttributions
                    .map((attribution: any) => ({ // Using 'any' since CitationSource import failed
                        uri: attribution.web?.uri || '',
                        title: attribution.web?.title || 'External Source',
                    }))
                    .filter((source: { uri: string, title: string }) => source.uri.length > 0 && source.title.length > 0);
            }
            
            return { text, sources };

        } catch (error) {
            // Check if this is a retriable error (e.g., rate limit, server error)
            if (attempt < maxAttempts - 1) {
                await sleepWithBackoff(attempt, baseDelay);
                // Continue to the next loop iteration (retry)
            } else {
                // Max retries reached, throw final error
                console.error("Agent failed after multiple retries.", error);
                throw new Error("The triathlon coach service is currently unavailable. Please try again later.");
            }
        }
    }
    // Should be unreachable but satisfies TS completion check
    throw new Error("Exited retry loop unexpectedly.");
}

// --- USAGE EXAMPLE ---

async function main() {
    console.log("--- Starting Triathlon Coach Agent ---");

    try {
        const result = await generateTriathlonPlan(SHORT_PROMPT);

        console.log("\n--- Raw Model Output ---");
        console.log(result.text); // Log the raw text for debugging

        try {
            const planJson = JSON.parse(result.text);
            console.log("\n--- Successfully Parsed Training Plan JSON ---");

            if (planJson.trainingPlan) {
                const agentPlan = new TrainingPlan();

                // Iterate through the dates in the generated plan
                Object.keys(planJson.trainingPlan).forEach(dateStr => {
                    const dayActivities = planJson.trainingPlan[dateStr];
                    if (Array.isArray(dayActivities)) {
                        dayActivities.forEach(activityData => {
                            let newActivity: TrainingActivity | null = null;
                            const activityDate = new Date(dateStr);

                            // Re-create the correct class instance based on the discipline
                            switch (activityData.discipline) {
                                case "Running":
                                    newActivity = new Running(activityDate, activityData.description, activityData.plannedDuration, activityData.distance);
                                    break;
                                case "Cycling":
                                    newActivity = new Cycling(activityDate, activityData.description, activityData.plannedDuration, activityData.distance);
                                    break;
                                case "Swimming":
                                    newActivity = new Swimming(activityDate, activityData.description, activityData.plannedDuration, activityData.distance);
                                    break;
                                case "Rest":
                                    newActivity = new Rest(activityDate, activityData.description);
                                    break;
                            }

                            if (newActivity) {
                                // Add intervals if they exist in the generated data
                                if (activityData.intervals && Array.isArray(activityData.intervals)) {
                                    activityData.intervals.forEach((intervalData: any) => {
                                        const interval = new Interval(intervalData.description, intervalData.duration, intervalData.intensity, intervalData.repetitions);
                                        newActivity.addInterval(interval);
                                    });
                                }
                                agentPlan.addActivity(newActivity);
                            }
                        });
                    }
                });

                // Save the populated plan to a file
                agentPlan.save("agent", "generated-plan");
                console.log("\n--- Agent-generated plan saved as 'generated-plan' for user 'agent' ---");
            }
        } catch (jsonError) {
            console.error("\n--- FAILED TO PARSE JSON ---");
            console.error("The model did not return a valid JSON object despite being in JSON mode.");
        }

        if (result.sources && result.sources.length > 0) {
            console.log("\n--- Grounding Sources (Real-time information used) ---");
            result.sources.forEach((s, index) => {
                console.log(`[${index + 1}] ${s.title}: ${s.uri}`);
            });
        }
        
    } catch (e) {
        if (e instanceof Error) {
            console.error(e.message);
        } else {
            console.error("An unknown error occurred.");
        }
    }
}

// Only run the main function if the script is executed directly
main();