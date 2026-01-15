import { BaseAgent } from './BaseAgent';
import type { AgentResult } from '../../types/abmel';

export class DecisionAgent extends BaseAgent {
    constructor() {
        super('DecisionAgent');
    }

    async execute(input: any): Promise<AgentResult> {
        this.status = 'running';
        this.log('Ranking creatives and making final decision...');

        const variants = input.variants || [];
        const ctrScores = input.ctr_scores || {};
        const memScores = input.mem_scores || {};
        const brandScores = input.brand_scores || {};
        const rejectedIds = input.rejected_variants || [];

        // 1. Filter out rejected variants
        const candidates = variants.filter((v: any) => !rejectedIds.includes(v.id));

        if (candidates.length === 0) {
            this.log('All variants rejected. Triggering regeneration.');
            return {
                agentName: this.name,
                status: 'completed',
                data: {
                    trigger_regeneration: true,
                    rejected_count: rejectedIds.length
                },
                timestamp: new Date().toISOString(),
                logs: this.logs
            };
        }

        // 2. Rank Candidates
        // Score = CTR (0.5) + Mem (0.3) + Brand (0.2)
        const scoredCandidates = candidates.map((v: any) => {
            const s1 = ctrScores[v.id] || 50;
            const s2 = memScores[v.id] || 50;
            const s3 = brandScores[v.id] || 50;
            const score = (s1 * 0.5) + (s2 * 0.3) + (s3 * 0.2);
            return { ...v, score };
        });

        scoredCandidates.sort((a: any, b: any) => b.score - a.score);

        const winner = scoredCandidates[0];
        const runnerUp = scoredCandidates.length > 1 ? scoredCandidates[1] : null;
        const ranking = scoredCandidates.map((v: any) => v.id);

        // Generate Reasoning
        const reason = `Variant "${winner.headline}" was selected as the winner with a weighted score of ${winner.score.toFixed(1)}/100. ` +
            `It performed strongest in ${this.getTopMetric(winner.id, ctrScores, memScores, brandScores)}. ` +
            (runnerUp ? `It outperformed the runner-up (Variant ${runnerUp.id}) by ${(winner.score - runnerUp.score).toFixed(1)} points.` : '');

        await new Promise(resolve => setTimeout(resolve, 800));

        this.log(`Decision made. Selected: ${winner.id} (Score: ${winner.score.toFixed(1)})`);
        this.status = 'completed';

        return {
            agentName: this.name,
            status: this.status,
            data: {
                selected_creative: winner, // Pass full object to context
                recommendedVariant: winner.id,
                ranking: ranking,
                reasoning: {
                    summary: reason,
                    metrics_breakdown: [
                        { name: 'CTR Prediction', weight: '50%', score: (ctrScores[winner.id] || 0) },
                        { name: 'Memorability', weight: '30%', score: (memScores[winner.id] || 0) },
                        { name: 'Brand Check', weight: '20%', score: (brandScores[winner.id] || 0) }
                    ]
                }
            },
            timestamp: new Date().toISOString(),
            logs: this.logs
        };
    }

    private getTopMetric(id: string, ctr: any, mem: any, brand: any): string {
        const s1 = ctr[id] || 0;
        const s2 = mem[id] || 0;
        const s3 = brand[id] || 0;
        if (s1 >= s2 && s1 >= s3) return 'Click-Through Rate';
        if (s2 >= s1 && s2 >= s3) return 'Memorability';
        return 'Brand Alignment';
    }
}
