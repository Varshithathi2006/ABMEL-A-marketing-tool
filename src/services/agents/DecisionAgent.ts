import { BaseAgent } from './BaseAgent';
import type { AgentResult, CreativeVariant } from '../../types/abmel';
import { SupabaseService } from '../SupabaseService';

export class DecisionAgent extends BaseAgent {
    constructor() {
        super('DecisionAgent');
    }

    async execute(input: any): Promise<AgentResult> {
        this.status = 'running';
        this.log('Evaluating creatives based on campaign goal rules...');

        try {
            const variants: CreativeVariant[] = input.variants || [];
            const goal = (input.goal || 'AWARENESS').toUpperCase();
            const campaignId = input.campaignId;

            if (variants.length === 0) {
                throw new Error("No variants provided for decision making.");
            }

            // 1. Rule-Based Selection Heuristic
            // Mapping Goal -> Preferred Strategies (in order of preference)
            const preferenceMap: Record<string, string[]> = {
                'AWARENESS': ['EMOTIONAL', 'LIFESTYLE', 'SOCIAL_PROOF'],
                'CONVERSIONS': ['PRICE', 'FEATURE', 'SOCIAL_PROOF'],
                'ENGAGEMENT': ['SOCIAL_PROOF', 'LIFESTYLE', 'EMOTIONAL']
            };

            const preferredStrategies = preferenceMap[goal] || ['FEATURE'];

            // Find best match
            let bestCreative = variants[0];
            let reasoning = "Default selection.";

            // Try to find exact match in order of preference
            for (const strat of preferredStrategies) {
                const match = variants.find(v => v.strategy_type === strat);
                if (match) {
                    bestCreative = match;
                    reasoning = `Selected based on strategy alignment. Goal '${goal}' prioritizes '${strat}' strategy.`;
                    break;
                }
            }

            this.log(`Selected Creative ID: ${bestCreative.id} (${bestCreative.strategy_type})`);
            this.log(reasoning);

            // 2. Persist Decision (Mark in DB)
            if (campaignId && !campaignId.startsWith('temp-')) {
                try {
                    await SupabaseService.getInstance().setBestCreative(campaignId, bestCreative.id);
                    this.log('Persisted best creative selection to database.');
                } catch (dbErr: any) {
                    this.log(`Warning: Failed to persist best creative: ${dbErr.message}`);
                }
            }

            this.status = 'completed';

            return {
                agentName: this.name,
                status: 'completed',
                data: {
                    selected_creative: bestCreative,
                    bestCreativeId: bestCreative.id,
                    reasoning: reasoning
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
}
