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

    // Legacy method maintained for compatibility
    public async planCampaign(input: any) {
        console.log('Orchestrator: Planning campaign...', input);
        // Store input for startExecution
        this.currentCampaignControl.input = input;

        // Emulate "Planning Complete" to satisfy UI flow
        // The actual planning happens in the chain, but UI expects a plan artifact *before* execution usually.
        // However, in the chain, it's sequential. We will just tell UI we are ready.
        this.emit({
            type: 'node_complete',
            nodeId: 'planning',
            data: { taskGraph: { id: 'lc-plan', steps: ['Market', 'Persona', 'Creative'] } },
            timestamp: new Date().toISOString()
        });
    }

    public async startExecution() {
        if (!this.currentCampaignControl.input) throw new Error('No input provided.');
        console.log('Starting LangChain Workflow...');

        // Prepare Initial State
        const initialState: AbmelState = {
            product: this.currentCampaignControl.input.product,
            goal: this.currentCampaignControl.input.goal,
            brandGuidelines: this.currentCampaignControl.input.brandGuidelines,
            loopCount: 0,

            // Inject Event Emitter into State so Agents can talk to UI
            onEvent: (e: any) => this.emit(e)
        };

        try {
            // Execute Chain
            const result = await abmelWorkflow.invoke(initialState);

            console.log("Workflow Complete", result);
            this.emit({ type: 'graph_complete', timestamp: new Date().toISOString() });

            // Persist Final Artifacts
            if (result.creativeVariants) {
                this.saveArtifact('creative_generation', { variants: result.creativeVariants, campaignId: this.currentCampaignControl.input.campaignId });
            }

        } catch (error) {
            console.error("Workflow Failed", error);
            this.emit({ type: 'node_fail', nodeId: 'workflow', data: error, timestamp: new Date().toISOString() });
        }
    }

    private async saveArtifact(nodeId: string, data: any) {
        const campaignId = this.currentCampaignControl.input?.campaignId;
        if (!campaignId) return;

        try {
            await SupabaseService.getInstance().saveAgentOutput(campaignId, nodeId, data);
            if (nodeId === 'creative_generation' && data.variants) {
                for (const variant of data.variants) {
                    await SupabaseService.getInstance().saveCreativeVariant(campaignId, variant);
                }
            }
        } catch (err) {
            console.error('Persistence Error', err);
        }
    }
}
