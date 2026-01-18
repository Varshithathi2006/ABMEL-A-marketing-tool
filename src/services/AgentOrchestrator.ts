import { SupabaseService } from './SupabaseService';
import { abmelWorkflow } from './langchain/workflow';
import type { AbmelState } from './langchain/workflow';
import type { GraphEvent } from '../types/graph';

export class AgentOrchestrator {
    private subscribers: ((event: GraphEvent) => void)[] = [];
    private currentCampaignControl: { input?: any } = {};

    constructor() {
        console.log("Initializing LangChain Orchestrator");
    }

    public subscribe(callback: (event: GraphEvent) => void) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(s => s !== callback);
        };
    }

    private emit(event: GraphEvent) {
        this.subscribers.forEach(s => s(event));
    }

    public async planCampaign(input: any) {
        console.log('Orchestrator: Planning campaign...', input);
        this.currentCampaignControl.input = input;

        // Emit the Deterministic DAG Structure for UI Visualization (4 Steps)
        // This must match the workflow in workflow.ts and PlanningAgent.ts
        this.emit({
            type: 'node_complete',
            nodeId: 'planning',
            data: {
                taskGraph: {
                    nodes: {
                        planning: { id: 'planning', agentName: 'PlanningAgent', status: 'completed', dependencies: [], inputContextKeys: [], outputContextKeys: [] },
                        market_research: { id: 'market_research', agentName: 'MarketIntelligenceAgent', status: 'idle', dependencies: ['planning'], inputContextKeys: [], outputContextKeys: [] },
                        persona_modeling: { id: 'persona_modeling', agentName: 'PersonaModelingAgent', status: 'idle', dependencies: ['market_research'], inputContextKeys: [], outputContextKeys: [] },
                        creative_generation: { id: 'creative_generation', agentName: 'CreativeGenerationAgent', status: 'idle', dependencies: ['persona_modeling'], inputContextKeys: [], outputContextKeys: [] },
                        decision: { id: 'decision', agentName: 'DecisionAgent', status: 'idle', dependencies: ['creative_generation'], inputContextKeys: [], outputContextKeys: [] }
                    },
                    context: input
                }
            },
            timestamp: new Date().toISOString()
        });
    }

    public async startExecution() {
        if (!this.currentCampaignControl.input) throw new Error('No input provided.');
        console.log('Starting LangChain Workflow...');

        const initialState: AbmelState = {
            product: this.currentCampaignControl.input.product,
            goal: this.currentCampaignControl.input.goal,
            brandGuidelines: this.currentCampaignControl.input.brandGuidelines,
            campaignId: this.currentCampaignControl.input.campaignId, // Persistence ID
            loopCount: 0,
            onEvent: (e: any) => this.emit(e)
        };

        try {
            // Execute Chain
            const result = await abmelWorkflow.invoke(initialState);
            console.log("Workflow Complete", result);

            // Persistence is handled within agents via Supabase calls (e.g. DecisionAgent)
            // But we double check Creative Generation output here for safety.

            if (result.creativeVariants) {
                // Ensure they are saved if Agent didn't? 
                // Currently only DecisionAgent explicitly saves 'best'. 
                // Creative variants are returned but SupabaseService.saveCreativeVariants is needed.
                // Let's call it here to be safe, or assume the Agent/Store does it.
                // Step 7 says "Save all creatives".

                await this.saveArtifact('creative_generation', { variants: result.creativeVariants });

                this.emit({
                    type: 'WORKFLOW_COMPLETED',
                    stage: 'CREATIVE_GENERATION',
                    data: {
                        count: result.creativeVariants?.length || 0,
                        variants: result.creativeVariants,
                        decision: result.decision
                    },
                    timestamp: new Date().toISOString()
                });
            }

            this.emit({ type: 'graph_complete', timestamp: new Date().toISOString() });

        } catch (error) {
            console.error("Workflow Failed", error);
            this.emit({ type: 'node_fail', nodeId: 'workflow', data: error, timestamp: new Date().toISOString() });
        }
    }

    private async saveArtifact(nodeId: string, data: any) {
        const campaignId = this.currentCampaignControl.input?.campaignId;
        if (!campaignId) return;

        try {
            // Generic Save
            await SupabaseService.getInstance().saveAgentOutput(campaignId, nodeId, data);

            // Specialized Save for Creatives
            if (nodeId === 'creative_generation' && data.variants) {
                await SupabaseService.getInstance().saveCreativeVariants(campaignId, data.variants);
            }
        } catch (err) {
            console.error('Persistence Error', err);
        }
    }
}
