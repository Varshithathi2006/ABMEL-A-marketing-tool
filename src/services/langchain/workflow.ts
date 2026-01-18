import { RunnableSequence, RunnableLambda } from "@langchain/core/runnables";
import { PlanningAgent } from "../agents/PlanningAgent";
import { MarketIntelligenceAgent } from "../agents/MarketIntelligenceAgent";
import { PersonaModelingAgent } from "../agents/PersonaModelingAgent";
import { CreativeGenerationAgent } from "../agents/CreativeGenerationAgent";
import { DecisionAgent } from "../agents/DecisionAgent";
// 1. Define State
export interface AbmelState {
    product: string;
    goal: string;
    brandGuidelines?: string;
    loopCount?: number;
    campaignId?: string; // Persistence

    // Context accumulators
    plan?: any;
    marketData?: any;
    personas?: any;
    creativeVariants?: any[];
    decision?: any;

    // Status
    error?: string; // Fail-fast flag

    // Events (for UI)
    onEvent?: (event: any) => void;
}

// 2. Instantiate Class Agents
const planner = new PlanningAgent();
const marketResearcher = new MarketIntelligenceAgent();
const personaModeler = new PersonaModelingAgent();
const creativeGenerator = new CreativeGenerationAgent();
const decisionMaker = new DecisionAgent();

// 3. Define Runnables that wrap Class Agents

// --- Planning ---
const planningStep = RunnableLambda.from(async (state: AbmelState) => {
    if (state.error) return state;
    try {
        state.onEvent?.({ type: 'node_start', nodeId: 'planning', timestamp: new Date().toISOString() });

        const result = await planner.execute({
            product: state.product,
            audience: "General", // Initial loose audience
            goal: state.goal,
            brandGuidelines: state.brandGuidelines,
            campaignId: state.campaignId
        });

        if (result.status === 'failed') throw new Error(result.data.error);

        state.onEvent?.({ type: 'node_complete', nodeId: 'planning', data: result.data, timestamp: new Date().toISOString() });
        return { ...state, plan: result.data };
    } catch (e: any) {
        state.onEvent?.({ type: 'node_fail', nodeId: 'planning', data: { error: e.message }, timestamp: new Date().toISOString() });
        return { ...state, error: `Planning Failed: ${e.message}` };
    }
});

// --- Market Research ---
const marketStep = RunnableLambda.from(async (state: AbmelState) => {
    if (state.error) return state;
    try {
        state.onEvent?.({ type: 'node_start', nodeId: 'market_research', timestamp: new Date().toISOString() });

        const result = await marketResearcher.execute({
            product: state.product,
            audience: state.plan?.taskGraph?.context?.audience || "General"
        });

        if (result.status === 'failed') throw new Error(result.data.error);

        state.onEvent?.({ type: 'node_complete', nodeId: 'market_research', data: result.data, timestamp: new Date().toISOString() });
        return { ...state, marketData: result.data };
    } catch (e: any) {
        state.onEvent?.({ type: 'node_fail', nodeId: 'market_research', data: { error: e.message }, timestamp: new Date().toISOString() });
        return { ...state, error: `Market Research Failed: ${e.message}` };
    }
});

// --- Persona Modeling ---
const personaStep = RunnableLambda.from(async (state: AbmelState) => {
    if (state.error) return state;
    try {
        state.onEvent?.({ type: 'node_start', nodeId: 'persona_modeling', timestamp: new Date().toISOString() });

        const result = await personaModeler.execute({
            audience: state.plan?.taskGraph?.context?.audience || "General",
            marketSummary: state.marketData?.marketSummary,
            industry: state.marketData?.industry,
        });

        if (result.status === 'failed') throw new Error(result.data.error);

        state.onEvent?.({ type: 'node_complete', nodeId: 'persona_modeling', data: result.data, timestamp: new Date().toISOString() });
        return { ...state, personas: result.data };
    } catch (e: any) {
        state.onEvent?.({ type: 'node_fail', nodeId: 'persona_modeling', data: { error: e.message }, timestamp: new Date().toISOString() });
        return { ...state, error: `Persona Modeling Failed: ${e.message}` };
    }
});

// --- Creative Generation ---
const creativeStep = RunnableLambda.from(async (state: AbmelState) => {
    if (state.error) return state;
    try {
        state.onEvent?.({ type: 'node_start', nodeId: 'creative_generation', timestamp: new Date().toISOString() });

        const result = await creativeGenerator.execute({
            product: state.product,
            primaryPersona: state.personas?.primaryPersona,
            creativeConstraints: state.personas?.creativeConstraints,
            goal: state.goal,
            brandGuidelines: state.brandGuidelines,
            keyOpportunities: state.marketData?.keyOpportunities
        });

        if (result.status === 'failed') throw new Error(result.data.error);

        // Result data variants are already strictly typed CreativeVariant[]
        state.onEvent?.({ type: 'node_complete', nodeId: 'creative_generation', data: result.data, timestamp: new Date().toISOString() });
        return { ...state, creativeVariants: result.data.variants };
    } catch (e: any) {
        state.onEvent?.({ type: 'node_fail', nodeId: 'creative_generation', data: { error: e.message }, timestamp: new Date().toISOString() });
        return { ...state, error: `Creative Generation Failed: ${e.message}` };
    }
});

// --- Decision (Best Creative Selection) ---
const decisionStep = RunnableLambda.from(async (state: AbmelState) => {
    if (state.error) return state;
    try {
        state.onEvent?.({ type: 'node_start', nodeId: 'decision', timestamp: new Date().toISOString() });

        const result = await decisionMaker.execute({
            variants: state.creativeVariants,
            goal: state.goal,
            campaignId: state.campaignId
        });

        if (result.status === 'failed') throw new Error(result.data.error);

        state.onEvent?.({ type: 'node_complete', nodeId: 'decision', data: result.data, timestamp: new Date().toISOString() });
        return { ...state, decision: result.data };
    } catch (e: any) {
        state.onEvent?.({ type: 'node_fail', nodeId: 'decision', data: { error: e.message }, timestamp: new Date().toISOString() });
        return { ...state, error: `Decision Failed: ${e.message}` };
    }
});

// 4. Compose Workflow
export const abmelWorkflow = RunnableSequence.from([
    planningStep,
    marketStep,
    personaStep,
    creativeStep,
    decisionStep
]);
