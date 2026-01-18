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
    strategy_type: 'FEATURE' | 'EMOTIONAL' | 'SOCIAL_PROOF' | 'PRICE' | 'LIFESTYLE';
    headline: string;
    body_copy: string;
    visual_prompt: string;
    tone: string;
    platform: string;
    is_best_creative?: boolean;
}
