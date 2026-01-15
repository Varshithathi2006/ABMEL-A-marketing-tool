export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface AgentResult {
    agentName: string;
    status: AgentStatus;
    data: any;
    timestamp: string;
    logs: string[];
}

export interface CampaignInput {
    product: string;
    audience: string;
    goal: string;
    budget: string;
    platforms: string[];
    constraints?: string;
    brandFiles?: string[];
    brandGuidelines?: string;
    file?: File;
}

export interface CreativeVariant {
    id: string;
    headline: string;
    body: string;
    cta: string;
    visualDescription: string;
    platform: string;
    rationale: string;
    imageUrl?: string;
    scores?: {
        ctr: number;
        memorability: number;
        brandAlignment: number;
    };
}
