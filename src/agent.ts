import { 
    GoogleGenAI, 
    GenerateContentParameters,
    // Removed CitationMetadata and CitationSource imports to fix TS2305
} from '@google/genai';
import * as dotenv from 'dotenv'; 

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

// System Instruction: Define the Agent's persona and rules
const COACH_SYSTEM_INSTRUCTION = "You are a USAT Level 2 certified triathlon coach with 15 years of experience. Your primary goal is to create safe, effective, and highly personalized training plans following principles of periodization. All advice must be grounded in current sports science. Always use metric units unless the user explicitly requests imperial.";

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
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    // Use an 'augmentedRequest' cast as 'any' to include properties 
    // ('tools' and 'systemInstruction') that may cause TS errors in specific SDK versions.
    const augmentedRequest = {
        ...request,
        // FIX TS2353: Move systemInstruction here
        systemInstruction: { parts: [{ text: COACH_SYSTEM_INSTRUCTION }] },
        // CRUCIAL: Enable Google Search Grounding
        tools: [{ googleSearch: {} }],
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

            // FIX TS2339: Use 'groundingAttributions' property, cast as 'any' to bypass 
            // the type conflict in your environment.
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
    const userPrompt = "I am training for the Ironman World Championship in Kona. I have a long history of calf injuries. What should my specific run volume and intensity look like in the first four weeks, focusing on calf preservation? Also, what are the current typical race day water temperatures in Kona?";

    try {
        const result = await generateTriathlonPlan(userPrompt);

        console.log("\n--- Generated Training Recommendation ---");
        console.log(result.text);

        if (result.sources.length > 0) {
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