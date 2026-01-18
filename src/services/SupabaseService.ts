import { supabase } from '../lib/supabase';

// Define types matching our Schema
export interface DatabaseCampaign {
    id: string;
    product: string;
    target_audience: string;
    campaign_goal: string;
    status: string;
}

export interface DatabaseGuideline {
    campaign_id: string;
    extracted_text: string;
    file_name: string;
}

export class SupabaseService {
    private static instance: SupabaseService;

    private constructor() { }

    public static getInstance(): SupabaseService {
        if (!SupabaseService.instance) {
            SupabaseService.instance = new SupabaseService();
        }
        return SupabaseService.instance;
    }

    // --- CAMPAIGNS ---
    public async createCampaign(userId: string, input: any): Promise<string> {
        // 1. Strict Goal Mapping (UI -> DB Enum)
        const GOAL_MAP: Record<string, string> = {
            'awareness': 'Awareness',
            'brand awareness': 'Awareness',
            'conversion': 'Conversion',
            'sales': 'Conversion',
            'conversions': 'Conversion',
            'drive conversions': 'Conversion',
            'retention': 'Retention',
            'customer retention': 'Retention',
            'loyalty': 'Retention',
            'other': 'Other'
        };

        const rawGoal = (input.goal || 'Awareness').toLowerCase().trim();
        const mappedGoal = GOAL_MAP[rawGoal];

        if (!mappedGoal) {
            throw new Error(`Invalid Campaign Goal: "${input.goal}". Supported: Awareness, Conversion, Retention.`);
        }

        // 2. Insert into campaigns table
        const { data: campaign, error } = await supabase
            .from('campaigns')
            .insert({
                user_id: userId,
                product: input.product,
                target_audience: input.audience || 'General',
                campaign_goal: mappedGoal,
                status: 'Planning'
            })
            .select('id')
            .single();

        if (error) throw new Error(`DB Error: ${error.message}`);
        return campaign.id;
    }

    public async getUserCampaigns(userId: string): Promise<DatabaseCampaign[]> {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`DB Error: ${error.message}`);
        return data as DatabaseCampaign[];
    }

    // --- BRAND GUIDELINES ---
    public async saveGuideline(campaignId: string, text: string, fileName: string) {
        const { error } = await supabase
            .from('brand_guidelines')
            .insert({
                campaign_id: campaignId,
                file_name: fileName,
                storage_path: `brand-assets/${campaignId}/${fileName}`,
                extracted_text: text,
                file_type: fileName.endsWith('.pdf') ? 'application/pdf' : 'text/plain'
            });

        if (error) throw new Error(`DB Error: ${error.message}`);
    }

    public async getGuideline(campaignId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('brand_guidelines')
            .select('extracted_text')
            .eq('campaign_id', campaignId)
            .single();

        if (error) return null;
        return data.extracted_text;
    }

    // --- AGENT OUTPUTS ---
    public async saveAgentOutput(campaignId: string, agentName: string, json: any) {
        const { error } = await supabase
            .from('agent_outputs')
            .insert({
                campaign_id: campaignId,
                agent_name: agentName,
                output_json: json
            });

        if (error) console.error('Failed to log agent output to DB', error);
    }

    public async getAgentOutputs(campaignId: string): Promise<Record<string, any>> {
        const { data, error } = await supabase
            .from('agent_outputs')
            .select('*')
            .eq('campaign_id', campaignId);

        if (error) {
            console.error("Failed to fetch agent outputs", error);
            return {};
        }

        const outputs: Record<string, any> = {};
        data?.forEach((row: any) => {
            outputs[row.agent_name] = row.output_json;
        });
        return outputs;
    }

    // --- CREATIVE VARIANTS (New Table) ---
    public async saveCreativeVariant(campaignId: string, variant: any) {
        // variant matches the prompt structure
        const { error } = await supabase
            .from('creative_variants')
            .insert({
                campaign_id: campaignId,
                strategy_name: variant.headline, // Alignment
                target_persona: variant.target_persona || 'Primary',
                prompt_text: JSON.stringify(variant), // Storing full variant data as text or granular fields? Schema has text.
                // Schema: prompt_text TEXT. 
                // I'll store the core text body or full JSON string.
                // Let's store the rationale + body.
                temperature: 0.7
            });

        if (error) console.error('Failed to save creative variant', error);
    }

    // --- DRAFTS ---
    public async saveDraft(userId: string, input: any) {
        const { error } = await supabase
            .from('user_drafts')
            .upsert({
                user_id: userId,
                draft_data: input,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) throw new Error(`Draft Save Error: ${error.message}`);
    }

    public async getDraft(userId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('user_drafts')
            .select('draft_data')
            .eq('user_id', userId)
            .single();

        if (error) return null;
        return data.draft_data;
    }
}
