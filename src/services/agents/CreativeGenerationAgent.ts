import { BaseAgent } from './BaseAgent';
import type { AgentResult, CreativeVariant } from '../../types/abmel';
import { GroqService } from '../GroqService';
// import { MockDataService } from '../MockDataService';

/*
export interface CreativePrompt {
    id: string;
    strategy_name: string;
    target_persona: string;
    persona_usage_context: string;
    product_role: string;
    feature_focus: string;
    emotional_angle: string;
    visual_framing: string;
    copy_tone: string;
    llm_parameters: {
        temperature: number;
        style_notes: string;
    };
    rationale: string;
}
*/

export class CreativeGenerationAgent extends BaseAgent {
    constructor() {
        super('CreativeGenerationAgent');
    }

    async execute(input: any): Promise<AgentResult> {
        this.status = 'running';
        this.log('Initializing Creative Synthesis Module...');

        try {
            // 1. Gather Context
            const product = input.product || 'Unknown Product';
            /*
            const _marketContext = {
                summary: input.marketSummary || 'General Market',
                opportunities: input.opportunities || [],
                competitors: input.competitors || []
            };
            */
            const personaData = input.personas || {};
            const primaryPersona = personaData.primaryPersona?.name || 'General Audience';
            const constraints = input.brandGuidelines ? `Brand Constraints: ${input.brandGuidelines}` : 'No specific brand constraints.';

            this.log(`Synthesizing context for ${product} targeting ${primaryPersona}...`);

            // 2. Construct Prompt for LLM (System Correction Architect Spec)
            const systemPrompt = `
You are the System Correction Architect for ABMEL.
GOAL: Generate EXACTLY 5 Creative Strategy Prompts.
CONTEXT:
Product: ${product}
Persona: ${JSON.stringify(primaryPersona)}
Constraints: ${constraints}

MANDATORY OUTPUT FORMAT (JSON ONLY):
{
  "prompts": [
    {
      "id": "1",
      "strategy_name": "Label (e.g. 'The Daily Grind Solution')",
      "target_persona": "${primaryPersona}",
      "persona_usage_context": "Specific scene description where persona uses product",
      "product_role": "How product fits into the scene",
      "feature_focus": "Key feature highlighted",
      "emotional_angle": "Emotional hook",
      "visual_framing": "TEXT DESCRIPTION of camera angle/lighting (NO IMAGES)",
      "copy_tone": "Tone descriptor",
      "llm_parameters": { "temperature": 0.7 }
    }
  ]
}
RULES:
1. Generate EXACTLY 5 items.
2. NO images. NO final ad copy. ONLY prompts.
3. Strategies must be DISTINCT (Feature, Emotion, Lifestyle, Social Proof, Innovation).
4. Persona Context must override Product Features.
`;

            // 3. Call Groq API
            this.log('Querying Llama-3 via Groq (Strict Persona Dominance)...');
            const resultJson = await GroqService.generate([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate 5 structured creative prompts for ${product}.` }
            ]);

            // 4. Parse and Validate
            let parsedData;
            try {
                // Heuristic regex to match JSON block if markdown is present
                const match = resultJson.match(/\{[\s\S]*\}/);
                const cleanJson = match ? match[0] : resultJson;
                parsedData = JSON.parse(cleanJson);
            } catch (e) {
                console.error("JSON Parse Error", resultJson);
                throw new Error('LLM failed to return valid JSON.');
            }

            if (!parsedData.prompts || !Array.isArray(parsedData.prompts) || parsedData.prompts.length !== 5) {
                // If LLM fails count, we slice or error. Ideally error to enforce "Determinisim"
                if (parsedData.prompts && parsedData.prompts.length > 5) {
                    parsedData.prompts = parsedData.prompts.slice(0, 5);
                } else {
                    throw new Error(`LLM generated ${parsedData?.prompts?.length || 0} prompts. Required exactly 5.`);
                }
            }

            this.log('Successfully generated 5 persona-dominant creative prompts.');

            // 5. Adapter Layer (To maintain UI compatibility)
            const variants: CreativeVariant[] = parsedData.prompts.map((p: any, idx: number) => {
                return {
                    id: (idx + 1).toString(),
                    headline: p.strategy_name.toUpperCase(),
                    body: `Scene: ${p.persona_usage_context}`, // Mapping usage context to body for preview
                    cta: 'View Prompt Details',
                    visualDescription: p.visual_framing, // mapped correctly
                    platform: 'Omnichannel',
                    rationale: p.product_role + ' | ' + p.emotional_angle,
                    // STRICT: No Image URL
                };
            });

            this.status = 'completed';

            return {
                agentName: this.name,
                status: this.status,
                data: { variants: variants },
                timestamp: new Date().toISOString(),
                logs: this.logs
            };

        } catch (error: any) {
            this.status = 'failed';
            this.log(`Error: ${error.message}`);
            return {
                agentName: this.name,
                status: 'failed',
                data: { error: error.message },
                timestamp: new Date().toISOString(),
                logs: this.logs
            };
        }
    }

    /*
    private inferIndustry(product: string): any {
        const p = product.toLowerCase();
        if (p.includes('shoe') || p.includes('wear') || p.includes('fashion')) return 'fashion';
        if (p.includes('tech') || p.includes('app') || p.includes('ai')) return 'tech';
        if (p.includes('health') || p.includes('food')) return 'health';
        if (p.includes('finance') || p.includes('bank')) return 'finance';
        return 'generic';
    }
    */
}
