import { BaseAgent } from './BaseAgent';
import type { AgentResult } from '../../types/abmel';
import type { TaskGraph, TaskNode } from '../../types/graph';

interface PlanningInput {
    product: string;
    audience: string;
    brandGuidelines?: string;
    // Strict Enum for logic branching
    goal: 'AWARENESS' | 'CONVERSIONS' | 'ENGAGEMENT';
    platforms?: string[];
    price?: string;
    campaignId?: string;
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
            this.log(`Analyzed Context: ${safeInput.product} targeting ${safeInput.audience} for ${safeInput.goal}`);

            // STEP 2: BUILD DAG
            // Deterministic graph based on scope.
            const nodes = this.constructExecutionPipeline(safeInput);

            // STEP 3: GRAPH CONSTRUCTION
            const taskGraph: TaskGraph = {
                context: {
                    ...safeInput,
                    rejected_variants: [],
                    loop_count: 0,
                    history: [],
                    campaignId: safeInput.campaignId // Pass through ID for persistence
                },
                nodes: nodes
            };

            this.log('Task Graph Generated: 4 Active Nodes defined.');
            this.status = 'completed';

            return {
                agentName: this.name,
                status: this.status,
                data: {
                    taskGraph,
                    reasoning: `Selected standard pipeline for ${safeInput.goal}.`
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
        // Strict mapping for Campaign Goal
        const GOAL_MAP: Record<string, 'AWARENESS' | 'CONVERSIONS' | 'ENGAGEMENT'> = {
            'awareness': 'AWARENESS',
            'brand awareness': 'AWARENESS',
            'conversion': 'CONVERSIONS',
            'conversions': 'CONVERSIONS',
            'engagement': 'ENGAGEMENT'
        };

        const rawGoal = (input.goal || 'AWARENESS').toLowerCase().trim();
        const mappedGoal = GOAL_MAP[rawGoal];

        if (!mappedGoal) {
            throw new Error(`Invalid Campaign Goal: "${input.goal}". Must be Awareness, Conversions, or Engagement.`);
        }

        return {
            product: input.product || "Unknown Product",
            audience: input.audience || "General Audience",
            brandGuidelines: input.brandGuidelines || "",
            goal: mappedGoal,
            platforms: Array.isArray(input.platforms) ? input.platforms : ['LinkedIn', 'Twitter'],
            price: input.price || "Not specified",
            campaignId: input.campaignId
        };
    }

    private constructExecutionPipeline(_input: PlanningInput): Record<string, TaskNode> {
        const nodes: Record<string, TaskNode> = {};

        // 1. Market Intelligence
        nodes['market_research'] = {
            id: 'market_research',
            agentName: 'MarketIntelligenceAgent',
            dependencies: [],
            status: 'idle',
            inputContextKeys: ['product', 'audience'],
            outputContextKeys: ['marketSummary', 'keyOpportunities', 'keyRisks', 'recommendedPositioning', 'suggestedMessagingAngles']
        };

        // 2. Persona Modeling
        nodes['persona_modeling'] = {
            id: 'persona_modeling',
            agentName: 'PersonaModelingAgent',
            dependencies: ['market_research'],
            status: 'idle',
            inputContextKeys: ['audience', 'marketSummary', 'industry'],
            outputContextKeys: ['personas', 'primaryPersona', 'creativeConstraints']
        };

        // 3. Creative Generation (Critical Step)
        nodes['creative_generation'] = {
            id: 'creative_generation',
            agentName: 'CreativeGenerationAgent',
            dependencies: ['persona_modeling', 'market_research'],
            status: 'idle',
            inputContextKeys: ['product', 'primaryPersona', 'creativeConstraints', 'goal', 'brandGuidelines', 'keyOpportunities', 'campaignId'],
            outputContextKeys: ['variants']
        };

        // 4. Best Creative Selection (Rule Based)
        nodes['decision'] = {
            id: 'decision',
            agentName: 'DecisionAgent',
            dependencies: ['creative_generation'],
            status: 'idle',
            inputContextKeys: ['variants', 'campaignId'],
            outputContextKeys: ['selected_creative', 'bestCreativeId']
        };

        return nodes;
    }
}
