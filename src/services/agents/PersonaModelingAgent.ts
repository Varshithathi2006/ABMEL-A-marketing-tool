import { BaseAgent } from './BaseAgent';
import type { AgentResult } from '../../types/abmel';

export interface Persona {
    id: string;
    name: string; // e.g., "The Tech Pragmatist"
    descriptor: string;
    motivations: string[];
    painPoints: string[];
    behavioralTraits: {
        attentionSpan: string;
        purchaseMindset: 'impulsive' | 'considered' | 'research-heavy';
        contentPreference: string[];
    };
    preferredPlatforms: string[];
    creativeConstraints: {
        tone: string;
        visualStyle: string;
        copyDo: string[];
        copyDont: string[];
    };
}

export interface PersonaProfile {
    primaryPersona: Persona;
    secondaryPersonas: Persona[];
    rationale: string;
}

export class PersonaModelingAgent extends BaseAgent {
    constructor() {
        super('PersonaModelingAgent');
    }

    async execute(input: any): Promise<AgentResult> {
        this.status = 'running';
        this.log('Synthesizing Audience Personas...');

        try {
            // Simulate processing
            await new Promise(resolve => setTimeout(resolve, 1000));

            const industry = input.industry || 'general';
            const audienceInput = input.audience || 'General Audience';

            this.log(`Context: ${industry} | Audience: ${audienceInput}`);

            const profile = this.generatePersonas(industry, audienceInput);

            this.status = 'completed';
            return {
                agentName: this.name,
                status: this.status,
                data: {
                    personas: [profile.primaryPersona, ...profile.secondaryPersonas], // Flattened array
                    primaryPersona: profile.primaryPersona,
                    creativeConstraints: profile.primaryPersona.creativeConstraints // Explicit top-level
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

    private generatePersonas(industry: string, audienceInput: string): PersonaProfile {
        // In a real system, this would use the Market Intelligence data deeply.
        // Here we use the industry signal to select accurate archetypes.

        const archetypes: Record<string, Persona> = {
            'saas_primary': {
                id: 'p_saas_1',
                name: 'The Efficiency Optimizer',
                descriptor: 'Operations Manager / CTO seeking ROI',
                motivations: ['Streamlining workflows', 'Reducing overhead', 'Scalability'],
                painPoints: ['Complex integrations', 'Hidden costs', 'Downtime'],
                behavioralTraits: {
                    attentionSpan: 'Short (skims for specs)',
                    purchaseMindset: 'considered',
                    contentPreference: ['Case Studies', 'Demos', 'Spec Sheets']
                },
                preferredPlatforms: ['LinkedIn', 'Twitter', 'Desktop Web'],
                creativeConstraints: {
                    tone: 'Professional, Direct, Authoritative',
                    visualStyle: 'Clean, minimalist UI shots, Data visualizations',
                    copyDo: ['Focus on ROI', 'Use specific metrics', 'Highlight integration'],
                    copyDont: ['Use fluffy adjectives', 'Over-promise', 'Use slang']
                }
            },
            'fashion_primary': {
                id: 'p_fash_1',
                name: 'The Visual Curator',
                descriptor: 'Gen Z / Millennial seeking identity expression',
                motivations: ['Self-expression', 'Social validation', 'Aesthetics'],
                painPoints: ['Generic styles', 'Poor fit', 'Fast fashion guilt'],
                behavioralTraits: {
                    attentionSpan: 'Low (visual first)',
                    purchaseMindset: 'impulsive',
                    contentPreference: ['Short Video', 'Lookbooks', 'Influencer Content']
                },
                preferredPlatforms: ['Instagram', 'TikTok', 'Pinterest'],
                creativeConstraints: {
                    tone: 'Aspirational, Cool, Confident',
                    visualStyle: 'High-contrast, Lifestyle-focused, Dynamic motion',
                    copyDo: ['Evoke emotion', 'Focus on "You"', 'Create urgency'],
                    copyDont: ['Be boring', 'Focus on technical fabric specs (unless eco)', 'Be text-heavy']
                }
            },
            'health_primary': {
                id: 'p_health_1',
                name: 'The Wellness Seeker',
                descriptor: 'Health-conscious individual prioritizing longevity',
                motivations: ['Vitality', 'Mental clarity', 'Prevention'],
                painPoints: ['Side effects', 'Ineffective products', 'Lack of science'],
                behavioralTraits: {
                    attentionSpan: 'High (reads labels)',
                    purchaseMindset: 'research-heavy',
                    contentPreference: ['Educational Video', 'Testimonials', 'Science breakdowns']
                },
                preferredPlatforms: ['Instagram', 'Google Search', 'YouTube'],
                creativeConstraints: {
                    tone: 'Empathetic, Trustworthy, Educational',
                    visualStyle: 'Natural light, Human connection, Clean/Clinical',
                    copyDo: ['Cite science/ingredients', 'Show benefits', 'Be transparent'],
                    copyDont: ['Fear-monger', 'Make medical claims', 'Use chaotic visuals']
                }
            },
            'general_primary': {
                id: 'p_gen_1',
                name: 'The Modern Consumer',
                descriptor: 'Value-driven shopper',
                motivations: ['Quality', 'Convenience', 'Social Proof'],
                painPoints: ['Wasted money', 'Poor service', 'Obsolescence'],
                behavioralTraits: {
                    attentionSpan: 'Medium',
                    purchaseMindset: 'considered',
                    contentPreference: ['Reviews', 'Comparison Videos']
                },
                preferredPlatforms: ['Facebook', 'Instagram', 'Search'],
                creativeConstraints: {
                    tone: 'Helpful, Clear, Friendly',
                    visualStyle: 'Product-hero, Lifestyle context',
                    copyDo: ['Focus on benefits', 'Use social proof', 'Clear CTA'],
                    copyDont: ['Be vague', 'Hide pricing']
                }
            }
        };

        // Select primary based on industry
        let primaryKey = 'general_primary';
        if (industry === 'saas' || industry === 'tech') primaryKey = 'saas_primary';
        if (industry === 'fashion') primaryKey = 'fashion_primary';
        if (industry === 'health') primaryKey = 'health_primary';

        return {
            primaryPersona: archetypes[primaryKey],
            secondaryPersonas: [], // Can extend logic to mix-and-match
            rationale: `Selected ${archetypes[primaryKey].name} based on ${industry} industry signals.`
        };
    }
}
