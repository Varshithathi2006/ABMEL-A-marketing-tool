import { BaseAgent } from './BaseAgent';
import type { AgentResult } from '../../types/abmel';

export interface MarketIntelligenceOutput {
    marketSummary: string;
    industry: string;
    keyOpportunities: string[];
    keyRisks: string[];
    competitorMessaging: string[]; // Added requirement
    recommendedPositioning: string;
    suggestedMessagingAngles: string[];
}

export class MarketIntelligenceAgent extends BaseAgent {
    constructor() {
        super('MarketIntelligenceAgent');
    }

    async execute(input: any): Promise<AgentResult> {
        this.status = 'running';
        this.log('Initializing Market Domain Analysis...');

        try {
            // Simulate deep analysis time
            await new Promise(resolve => setTimeout(resolve, 1500));

            const product = input.product || "Generic Product";
            const industry = this.detectIndustry(product);

            this.log(`Detected Domain Context: ${industry.toUpperCase()}`);

            const intelligence = this.generateIntelligence(industry, product);

            this.status = 'completed';
            return {
                agentName: this.name,
                status: this.status,
                data: intelligence,
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

    private detectIndustry(product: string): string {
        const p = product.toLowerCase();
        if (p.includes('ai') || p.includes('software') || p.includes('app') || p.includes('platform') || p.includes('cloud')) return 'saas';
        if (p.includes('shoe') || p.includes('wear') || p.includes('shirt') || p.includes('dress') || p.includes('fashion')) return 'fashion';
        if (p.includes('coin') || p.includes('bank') || p.includes('invest') || p.includes('card') || p.includes('wallet')) return 'fintech';
        if (p.includes('tea') || p.includes('drink') || p.includes('food') || p.includes('snack')) return 'fmcg';
        if (p.includes('health') || p.includes('med') || p.includes('care') || p.includes('supplement')) return 'health';
        return 'general_tech'; // Default fallback
    }

    private generateIntelligence(industry: string, product: string): MarketIntelligenceOutput {
        // Deterministic Strategy Maps
        const strategies: Record<string, any> = {
            'saas': {
                maturity: 'growing',
                narratives: ['Efficiency at scale', 'AI-powered automation', 'Seamless integration'],
                competitorMessaging: ['"The #1 Platform for X"', '"Automate everything"', '"Built for scale"'],
                opportunities: ['Focus on specific pain-point resolution', 'Human-centric AI benefits', 'Time-to-value speed'],
                risks: ['Buzzword fatigue (too much "AI")', 'Feature complexity', 'Lack of trust'],
                positioning: 'The Intelligent Enabler',
                angles: ['The "New Way" vs Old Way', 'Proof of Efficiency', 'Empowerment']
            },
            'fashion': {
                maturity: 'saturated',
                narratives: ['Sustainability', 'Self-expression', 'Dopamine dressing'],
                competitorMessaging: ['"Wear your vibe"', '"Timeless classics"', '"Comfort meets style"'],
                opportunities: ['Radical transparency', 'Digital-only fashion', 'Nostalgia remix'],
                risks: ['Greenwashing accusations', 'Trend obsolescence', 'Generic imagery'],
                positioning: 'The Identity Shaper',
                angles: ['Visual Impact', 'Ethical Luxury', 'Exclusive Access']
            },
            'fintech': {
                maturity: 'mature',
                narratives: ['Democratizing finance', 'Crypto future', 'Frictionless payments'],
                competitorMessaging: ['"Banking without borders"', '"Invest in your future"', '"Fast, secure, simple"'],
                opportunities: ['Financial wellness/education', 'Community-driven wealth', 'Transparent fees'],
                risks: ['Regulatory fears', 'Security doubts', 'Cold/impersonal feel'],
                positioning: 'The Trusted Partner',
                angles: ['Freedom & Control', 'Security First', 'Smart Growth']
            },
            'health': {
                maturity: 'growing',
                narratives: ['Holistic wellness', 'Science-backed', 'Personalized care'],
                competitorMessaging: ['"Clinically proven"', '"Nature meets science"', '"Unlock your potential"'],
                opportunities: ['Mental health integration', 'Preventative lifestyle', 'Community support'],
                risks: ['Pseudoscientific claims', 'Over-promising', 'Medical jargon'],
                positioning: 'The Wellness Companion',
                angles: ['Evidence-Based', 'Empathy & Care', 'Holistic Balance']
            },
            'general_tech': {
                maturity: 'competitive',
                narratives: ['Innovation', 'Performance', 'Design'],
                competitorMessaging: ['"The world\'s most powerful X"', '"Designed for Pro"', '"Experience the future"'],
                opportunities: ['Niche feature focus', 'Design aesthetics', 'Customer support excellence'],
                risks: ['Commoditization', 'Spec wars', 'Design copycats'],
                positioning: 'The Premium Choice',
                angles: ['Performance Leader', 'Design Focused', 'User Experience']
            }
        };

        const strat = strategies[industry] || strategies['general_tech'];

        return {
            marketSummary: `The ${industry} market for ${product} is currently ${strat.maturity}. Key players focus on ${strat.narratives[0]}.`,
            industry: industry,
            keyOpportunities: strat.opportunities,
            keyRisks: strat.risks,
            competitorMessaging: strat.competitorMessaging,
            recommendedPositioning: strat.positioning,
            suggestedMessagingAngles: strat.angles
        };
    }
}
