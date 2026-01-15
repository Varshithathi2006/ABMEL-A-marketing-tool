import { BaseAgent } from './BaseAgent';
import type { AgentResult } from '../../types/abmel';
import type { TaskGraph, TaskNode } from '../../types/graph';

interface PlanningInput {
    product: string;
    audience: string;
    brandGuidelines?: string;
    goal?: string; // awareness, conversion, etc.
    platforms?: string[];
    price?: string;
}

export class PlanningAgent extends BaseAgent {
    constructor() {
        super('PlanningAgent');
    }

    async execute(input: any): Promise<AgentResult> {
        this.status = 'running';
        this.log('Initializing Planning Protocol...');

        try {
            // STEP 1: INPUT INTERPRETATION & NORMALIZATION
            const safeInput = this.normalizeInput(input);
            this.log(`Analyzed Context: ${safeInput.product} targeting ${safeInput.audience}`);

            // STEP 2 & 3: AGENT SELECTION & DECOMPOSITION
            // In a real LLM scenario, this would be dynamic.
            // For this deterministic version, we define the standard high-performance pipeline.
            const nodes = this.constructExecutionPipeline(safeInput);

            // STEP 4, 5, 6: GRAPH CONSTRUCTION (Edges, Data Flow, Retry Logic)
            const taskGraph: TaskGraph = {
                context: {
                    ...safeInput,
                    rejected_variants: [],
                    loop_count: 0,
                    history: []
                },
                nodes: nodes
            };

            this.log('Task Graph Generated: 9 Active Nodes defined.');
            this.status = 'completed';

            return {
                agentName: this.name,
                status: this.status,
                data: {
                    taskGraph,
                    reasoning: "Selected standard 4-stage pipeline based on Campaign Goal: Conversion."
                },
                timestamp: new Date().toISOString(),
                logs: this.logs
            };

        } catch (error: any) {
            this.status = 'failed';
            return {
                agentName: this.name,
                status: 'failed',
                data: { error: error.message },
                timestamp: new Date().toISOString(),
                logs: this.logs
            };
        }
    }

    private normalizeInput(input: any): PlanningInput {
        return {
            product: input.product || "Unknown Product",
            audience: input.audience || "General Audience",
            brandGuidelines: input.brandGuidelines || "",
            goal: input.goal || "awareness",
            platforms: Array.isArray(input.platforms) ? input.platforms : ['LinkedIn', 'Twitter'],
            price: input.price || "Not specified"
        };
    }

    private constructExecutionPipeline(input: PlanningInput): Record<string, TaskNode> {
        const nodes: Record<string, TaskNode> = {};

        // 1. Market Intelligence
        nodes['market_research'] = {
            id: 'market_research',
            agentName: 'MarketIntelligenceAgent',
            dependencies: [], // Root node
            status: 'idle',
            inputContextKeys: ['product', 'audience'],
            outputContextKeys: ['marketSummary', 'keyOpportunities', 'keyRisks', 'recommendedPositioning', 'suggestedMessagingAngles']
        };

        // 2. Persona Modeling (Dependent on Market Research)
        nodes['persona_modeling'] = {
            id: 'persona_modeling',
            agentName: 'PersonaModelingAgent',
            dependencies: ['market_research'],
            status: 'idle',
            inputContextKeys: ['audience', 'marketSummary', 'industry'],
            outputContextKeys: ['personas', 'primaryPersona', 'creativeConstraints']
        };

        // 3. Creative Generation (The Core)
        nodes['creative_generation'] = {
            id: 'creative_generation',
            agentName: 'CreativeGenerationAgent',
            dependencies: ['persona_modeling', 'market_research'],
            status: 'idle',
            inputContextKeys: ['product', 'primaryPersona', 'creativeConstraints', 'goal', 'brandGuidelines', 'keyOpportunities'],
            outputContextKeys: ['variants'] // Array of 5 CreativeVariant objects
        };

        // 4. STOP: Strictly terminate after Creative Generation.
        // Downstream agents (Evaluation, Decision, Guardrails) are forcefully excluded from this graph.

        return nodes;
    }
}
