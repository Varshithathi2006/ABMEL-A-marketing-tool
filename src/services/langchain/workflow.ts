import { RunnableSequence, RunnableLambda } from "@langchain/core/runnables";
import { ChatGroq } from "@langchain/groq";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

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

    // Events (for UI)
    onEvent?: (event: any) => void;
}

// 2. Initialize Model
const model = new ChatGroq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    model: "llama3-70b-8192",
    temperature: 0.7
});

// 3. Define Agents as Runnables

// --- Planning Agent ---
const planningAgent = RunnableLambda.from(async (state: AbmelState) => {
    state.onEvent?.({ type: 'node_start', nodeId: 'planning', timestamp: new Date().toISOString() });

    // Logic: Decompose Campaign
    const plan = {
        id: 'plan-' + Date.now(),
        steps: ['Market Analysis', 'Persona Creation', 'Creative Ideation'],
        strategy: 'High-Velocity Viral Growth'
    };

    await new Promise(r => setTimeout(r, 800)); // Simulate think time

    state.onEvent?.({ type: 'node_complete', nodeId: 'planning', data: { taskGraph: plan }, timestamp: new Date().toISOString() });
    return { ...state, plan };
});

// --- Market Intelligence Agent ---
const marketAgent = RunnableLambda.from(async (state: AbmelState) => {
    state.onEvent?.({ type: 'node_start', nodeId: 'market_research', timestamp: new Date().toISOString() });

    // Logic: Simulate Search
    const marketData = {
        trends: ['AI Adoption', 'Privacy First'],
        competitors: ['CompA', 'CompB']
    };

    await new Promise(r => setTimeout(r, 1200));

    state.onEvent?.({ type: 'node_complete', nodeId: 'market_research', data: { marketSummary: "Growth Sector" }, timestamp: new Date().toISOString() });
    return { ...state, marketData };
});

// --- Persona Agent ---
const personaAgent = RunnableLambda.from(async (state: AbmelState) => {
    state.onEvent?.({ type: 'node_start', nodeId: 'persona_modeling', timestamp: new Date().toISOString() });

    const personas = {
        primaryPersona: { name: "The Tech Innovator", traits: ["Early Adopter", "High Spend"] }
    };

    await new Promise(r => setTimeout(r, 1000));

    state.onEvent?.({ type: 'node_complete', nodeId: 'persona_modeling', data: { personas }, timestamp: new Date().toISOString() });
    return { ...state, personas };
});

// --- Creative Agent (Using Real LLM) ---
const creativeAgent = RunnableLambda.from(async (state: AbmelState) => {
    state.onEvent?.({ type: 'node_start', nodeId: 'creative_generation', timestamp: new Date().toISOString() });

    try {
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", `You are a Creative Director. Generate 5 creative headlines and rationales for {product} targeting {persona}. Return JSON with key "prompts".`],
            ["user", "Generate creatives."]
        ]);

        const chain = prompt.pipe(model).pipe(new StringOutputParser());

        // Call LLM
        const resultString = await chain.invoke({
            product: state.product,
            persona: state.personas?.primaryPersona?.name || "General Audience"
        });

        // Parse JSON (Heuristic)
        let variants = [];
        try {
            const match = resultString.match(/\{[\s\S]*\}/);
            const json = JSON.parse(match ? match[0] : resultString);
            if (json.prompts) variants = json.prompts;
        } catch (e) {
            console.warn("Using fallback variants due to JSON parse error", e);
            variants = [
                { id: "1", headline: "Revolutionize Your Workflow", rationale: "Efficiency focus" },
                { id: "2", headline: "The Future is Now", rationale: "Innovation focus" },
                { id: "3", headline: "Security by Design", rationale: "Safety focus" },
                { id: "4", headline: "Built for Scale", rationale: "Growth focus" },
                { id: "5", headline: "Connect Globally", rationale: "Community focus" }
            ];
        }

        // Adapting to UI Format
        const uiVariants = variants.map((v: any, i: number) => ({
            id: (i + 1).toString(),
            headline: v.headline || v.strategy_name || "Untitled Strategy",
            body: v.rationale || v.persona_usage_context || "No description generated.",
            cta: "Learn More",
            platform: "Omnichannel",
            rationale: v.rationale || "AI Generated Strategy"
        })).slice(0, 5);

        // Ensure exactly 5
        while (uiVariants.length < 5) {
            uiVariants.push({ id: (uiVariants.length + 1).toString(), headline: "Bonus Strategy", body: "AI Bonus", cta: "View", platform: "Web", rationale: "Optimization" });
        }

        state.onEvent?.({ type: 'node_complete', nodeId: 'creative_generation', data: { variants: uiVariants }, timestamp: new Date().toISOString() });
        return { ...state, creativeVariants: uiVariants };

    } catch (err) {
        console.error("Creative Agent Error", err);
        state.onEvent?.({ type: 'node_fail', nodeId: 'creative_generation', data: { error: err }, timestamp: new Date().toISOString() });
        throw err;
    }
});


// 4. Compose Workflow
export const abmelWorkflow = RunnableSequence.from([
    planningAgent,
    marketAgent,
    personaAgent,
    creativeAgent
]);
