import { supabase } from '../lib/supabase';

// Define types matching our Schema
export interface DatabaseCampaign {
    id: string;
    product: string;
    target_audience: string;
    price: string;
    campaign_goal: 'AWARENESS' | 'CONVERSIONS' | 'ENGAGEMENT';
    status: 'PLANNING' | 'PROCESSING' | 'CREATIVES_READY' | 'FAILED';
    best_creative_id?: string;
}

export interface CreativeVariant {
    id?: string;
    strategy_type: 'FEATURE' | 'EMOTIONAL' | 'SOCIAL_PROOF' | 'PRICE' | 'LIFESTYLE';
    headline: string;
    body_copy: string;
    visual_prompt: string;
    tone: string;
    platform: string;
    is_best_creative?: boolean;
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
        const GOAL_MAP: Record<string, 'AWARENESS' | 'CONVERSIONS' | 'ENGAGEMENT'> = {
            'awareness': 'AWARENESS',
            'conversions': 'CONVERSIONS',
            'conversion': 'CONVERSIONS',
            'engagement': 'ENGAGEMENT'
        };

        const rawGoal = (input.goal || 'AWARENESS').toLowerCase().trim();
        const mappedGoal = GOAL_MAP[rawGoal];

        if (!mappedGoal) {
            throw new Error(`Invalid Campaign Goal: "${input.goal}". Supported: AWARENESS, CONVERSIONS, ENGAGEMENT.`);
        }

        // 2. Insert into campaigns table
        const { data: campaign, error } = await supabase
            .from('campaigns')
            .insert({
                user_id: userId,
                product: input.product,
                target_audience: input.audience || 'General',
                price: input.price || '0',
                campaign_goal: mappedGoal,
                status: 'PLANNING'
            })
            .select('id')
            .single();

        if (error) throw new Error(`DB Error: ${error.message}`);
        return campaign.id;
    }

    public async updateCampaignStatus(campaignId: string, status: DatabaseCampaign['status']) {
        const { error } = await supabase
            .from('campaigns')
            .update({ status })
            .eq('id', campaignId);

        if (error) throw new Error(`Failed to update status: ${error.message}`);
    }

    public async setBestCreative(campaignId: string, creativeId: string) {
        // 1. Update Campaign
        const { error: campError } = await supabase
            .from('campaigns')
            .update({ best_creative_id: creativeId })
            .eq('id', campaignId);

        if (campError) throw new Error(`Failed to set best creative on campaign: ${campError.message}`);

        // 2. Mark Creative
        const { error: creativeError } = await supabase
            .from('creative_variants')
            .update({ is_best_creative: true })
            .eq('id', creativeId);

        if (creativeError) throw new Error(`Failed to mark creative as best: ${creativeError.message}`);
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

    // --- CREATIVE VARIANTS ---
    public async saveCreativeVariants(campaignId: string, variants: CreativeVariant[]) {
        const rows = variants.map(v => ({
            campaign_id: campaignId,
            strategy_type: v.strategy_type,
            headline: v.headline,
            body_copy: v.body_copy,
            visual_prompt: v.visual_prompt,
            tone: v.tone,
            platform: v.platform,
            is_best_creative: v.is_best_creative || false
        }));

        const { data, error } = await supabase
            .from('creative_variants')
            .insert(rows)
            .select('id, strategy_type'); // Return IDs to map back if needed

        if (error) throw new Error(`Failed to save creatives: ${error.message}`);
        return data; // Returns array of {id, strategy_type}
    }

    public async getCreatives(campaignId: string): Promise<CreativeVariant[]> {
        const { data, error } = await supabase
            .from('creative_variants')
            .select('*')
            .eq('campaign_id', campaignId);

        if (error) throw new Error(`Failed to fetch creatives: ${error.message}`);
        return data as CreativeVariant[];
    }

    public async getAllUserCreatives(_userId: string): Promise<CreativeVariant[]> {
        // Fetch campaigns first to filter by user (RLS handles this but explicit check is good)
        // OR rely on RLS if policies are set exactly.
        // Assuming RLS policy: "Users can view own variants" -> EXISTS (campaign.user_id = uid)
        // So we can just select all from creative_variants and RLS filters it.
        const { data, error } = await supabase
            .from('creative_variants')
            .select(`
                *,
                campaigns (
                    product
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch all creatives: ${error.message}`);
        // Flatten the campaign product into the object for UI convenience if needed, 
        // type assertion might be tricky here, but we will handle it in the UI or map it.
        return data as unknown as CreativeVariant[];
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
