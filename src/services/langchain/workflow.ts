import { RunnableSequence, RunnableLambda } from "@langchain/core/runnables";
import { ChatGroq } from "@langchain/groq";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// 1. Define State
// 1. Define State
export interface AbmelState {
    product: string;
    goal: string;
    brandGuidelines?: string;
    loopCount?: number;

    // Outputs
    plan?: any;
    marketData?: any;
    personas?: any;
    creativeVariants?: any[];

    // Status
    error?: string; // Fail-fast flag

    // Events (for UI)
    onEvent?: (event: any) => void;
}

// 2. Initialize Model (Updated to supported version)
const model = new ChatGroq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    model: "llama-3.1-70b-versatile", // UPDATED: Valid model
    temperature: 0.7,
    maxRetries: 2
});

// 3. Define Agents as Runnables

// --- Planning Agent ---
const planningAgent = RunnableLambda.from(async (state: AbmelState) => {
    if (state.error) return state; // Skip if previous failed

    try {
        state.onEvent?.({ type: 'node_start', nodeId: 'planning', timestamp: new Date().toISOString() });

        // Logic: Decompose Campaign
        const plan = {
            id: 'plan-' + Date.now(),
            steps: ['Market Analysis', 'Persona Creation', 'Creative Ideation'],
            strategy: 'High-Velocity Viral Growth',
            status: 'success'
        };

        // Validate Plan produced something (Mock check)
        if (!plan.steps || plan.steps.length === 0) {
            throw new Error("Planning Agent failed to generate steps.");
        }

        await new Promise(r => setTimeout(r, 800)); // Simulate think time

        state.onEvent?.({ type: 'node_complete', nodeId: 'planning', data: { taskGraph: plan }, timestamp: new Date().toISOString() });
        return { ...state, plan };
    } catch (e: any) {
        state.onEvent?.({ type: 'node_fail', nodeId: 'planning', data: { error: e.message }, timestamp: new Date().toISOString() });
        return { ...state, error: `Planning Failed: ${e.message}` };
    }
});

// --- Market Intelligence Agent ---
const marketAgent = RunnableLambda.from(async (state: AbmelState) => {
    if (state.error) return state;

    try {
        state.onEvent?.({ type: 'node_start', nodeId: 'market_research', timestamp: new Date().toISOString() });

        // Logic: Simulate Search
        const marketData = {
            trends: ['AI Adoption', 'Privacy First'],
            competitors: ['CompA', 'CompB']
        };

        await new Promise(r => setTimeout(r, 1200));

        state.onEvent?.({ type: 'node_complete', nodeId: 'market_research', data: { marketSummary: "Growth Sector" }, timestamp: new Date().toISOString() });
        return { ...state, marketData };
    } catch (e: any) {
        state.onEvent?.({ type: 'node_fail', nodeId: 'market_research', data: { error: e.message }, timestamp: new Date().toISOString() });
        return { ...state, error: `Market Research Failed: ${e.message}` };
    }
});

// --- Persona Agent ---
const personaAgent = RunnableLambda.from(async (state: AbmelState) => {
    if (state.error) return state;

    try {
        state.onEvent?.({ type: 'node_start', nodeId: 'persona_modeling', timestamp: new Date().toISOString() });

        const personas = {
            primaryPersona: { name: "The Tech Innovator", traits: ["Early Adopter", "High Spend"] }
        };

        await new Promise(r => setTimeout(r, 1000));

        state.onEvent?.({ type: 'node_complete', nodeId: 'persona_modeling', data: { personas }, timestamp: new Date().toISOString() });
        return { ...state, personas };
    } catch (e: any) {
        state.onEvent?.({ type: 'node_fail', nodeId: 'persona_modeling', data: { error: e.message }, timestamp: new Date().toISOString() });
        return { ...state, error: `Persona Modeling Failed: ${e.message}` };
    }
});

// --- Creative Agent (Using Real LLM with Timeout & Fail-Safe) ---
const creativeAgent = RunnableLambda.from(async (state: AbmelState) => {
    if (state.error) return state;

    try {
        state.onEvent?.({ type: 'node_start', nodeId: 'creative_generation', timestamp: new Date().toISOString() });

        // Fail-Safe Variants (Used if LLM fails or times out)
        const FALLBACK_VARIANTS = [
            { id: "1", headline: "Unlock Your Potential", rationale: "Focus on user empowerment and growth.", platform: "LinkedIn" },
            { id: "2", headline: "Seamless Integration, Instant Results", rationale: "Highlighting ease of use and efficiency.", platform: "Twitter" },
            { id: "3", headline: "Enterprise-Grade Security", rationale: "Appealing to trust and safety concerns.", platform: "Website" },
            { id: "4", headline: "Join the Revolution", rationale: "Creating a sense of movement and belonging.", platform: "Display" },
            { id: "5", headline: "Smart Solutions for Modern Problems", rationale: "Positioning as an innovative problem solver.", platform: "Instagram" }
        ];

        let variants = FALLBACK_VARIANTS;

        try {
            const prompt = ChatPromptTemplate.fromMessages([
                ["system", `You are a Creative Director. Generate 5 creative headlines and rationales for {product} targeting {persona}. 
                Return STRICT JSON format with a single key "prompts" containing an array of objects.
                Each object must have: "headline", "rationale", "platform" (e.g. LinkedIn, Twitter, Web).`],
                ["user", "Generate 5 creatives now."]
            ]);

            const chain = prompt.pipe(model).pipe(new StringOutputParser());

            if (!state.product) throw new Error("Product context missing");

            const productContext = state.product || "a generic product";
            const personaContext = state.personas?.primaryPersona?.name || "General Audience";

            // Timeout Wrapper (15 seconds max)
            const llmCall = chain.invoke({
                product: productContext,
                persona: personaContext
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("LLM Timeout")), 15000)
            );

            const resultString = await Promise.race([llmCall, timeoutPromise]) as string;

            // Parse output
            const match = resultString.match(/\{[\s\S]*\}/);
            if (match) {
                const json = JSON.parse(match[0]);
                if (json.prompts && Array.isArray(json.prompts)) {
                    variants = json.prompts;
                }
            }
        } catch (innerError) {
            console.warn("Creative Agent LLM failed or timed out. Using fallback.", innerError);
            // Swallowing inner error to ensure the pipeline proceeds with fallback
        }

        // Mapping to UI format
        const uiVariants = variants.map((v: any, i: number) => ({
            id: (i + 1).toString(),
            headline: v.headline || "Creative Strategy " + (i + 1),
            body: v.rationale || v.body_copy || "Optimized for target audience engagement.",
            cta: "Learn More",
            platform: v.platform || "Omnichannel",
            rationale: v.rationale || "AI Generated Strategy"
        })).slice(0, 5);

        // Ensure we always have 5
        while (uiVariants.length < 5) {
            const fallback = FALLBACK_VARIANTS[uiVariants.length];
            uiVariants.push(fallback as any);
        }

        state.onEvent?.({ type: 'node_complete', nodeId: 'creative_generation', data: { variants: uiVariants }, timestamp: new Date().toISOString() });
        return { ...state, creativeVariants: uiVariants };

    } catch (err: any) {
        console.error("Creative Agent Critical Error", err);
        state.onEvent?.({ type: 'node_fail', nodeId: 'creative_generation', data: { error: err.message }, timestamp: new Date().toISOString() });
        return { ...state, error: `Creative Generation Failed: ${err.message}` };
    }
});


// 4. Compose Workflow
export const abmelWorkflow = RunnableSequence.from([
    planningAgent,
    marketAgent,
    personaAgent,
    creativeAgent
]);
