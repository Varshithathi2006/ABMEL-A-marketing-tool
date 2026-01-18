import { BaseAgent } from './BaseAgent';
import type { AgentResult, CreativeVariant } from '../../types/abmel';
import { GroqService } from '../GroqService';

export class CreativeGenerationAgent extends BaseAgent {
    constructor() {
        super('CreativeGenerationAgent');
    }

    async execute(input: any): Promise<AgentResult> {
        this.status = 'running';
        this.log('Initializing Creative Synthesis Module...');

        // RETRY LOGIC (Step 5: "retry once -> else fail")
        let attempt = 0;
        const maxAttempts = 2;

        while (attempt < maxAttempts) {
            attempt++;
            try {
                this.log(`Attempt ${attempt}/${maxAttempts}: Generating Creatives...`);
                const variants = await this.generateCreatives(input);

                this.status = 'completed';
                return {
                    agentName: this.name,
                    status: 'completed',
                    data: { variants }, // Standardized output key
                    timestamp: new Date().toISOString(),
                    logs: this.logs
                };

            } catch (error: any) {
                this.log(`Attempt ${attempt} failed: ${error.message}`);
                if (attempt >= maxAttempts) {
                    this.status = 'failed';
                    return {
                        agentName: this.name,
                        status: 'failed',
                        data: { error: `Final Error after ${maxAttempts} attempts: ${error.message}` },
                        timestamp: new Date().toISOString(),
                        logs: this.logs
                    };
                }
                // Wait briefly before retry
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        // Fallback (Should be unreachable)
        return {
            agentName: this.name,
            status: 'failed',
            data: { error: "Unknown failure" },
            timestamp: new Date().toISOString(),
            logs: this.logs
        };
    }

    private async generateCreatives(input: any): Promise<CreativeVariant[]> {
        // 1. Context Synthesis
        const product = input.product || 'Unknown Product';
        const primaryPersona = input.primaryPersona?.name || 'General Audience';
        const constraints = input.brandGuidelines ? `Brand Guidelines: ${input.brandGuidelines}` : 'No strict brand guidelines.';
        const goal = input.goal || 'AWARENESS';

        // 2. Strict System Prompt
        const systemPrompt = `
You are the Lead Creative Director of a top-tier ad agency.
Your task is to generate EXACTLY 5 distinct creative ad concepts for a campaign.

CAMPAIGNS CONTEXT:
Product: ${product}
Target Persona: ${primaryPersona}
Campaign Goal: ${goal}
Constraints: ${constraints}

REQUIRED OUTPUT:
You must generate a valid JSON object containing an array of 5 creative objects.
Each creative must correspond to one of these specific strategies:
1. FEATURE (Focus on product utility)
2. EMOTIONAL (Focus on feeling/vibe)
3. SOCIAL_PROOF (Testimonial/Trust style)
4. PRICE (Value proposition/Offer)
5. LIFESTYLE (Product in context/Aspirational)

JSON SCHEMA (Strict):
{
  "creatives": [
    {
      "strategy_type": "FEATURE",
      "headline": "Punchy headline here",
      "body_copy": "Compelling ad body text (max 280 chars)",
      "visual_prompt": "Detailed text description of the visual (camera angle, lighting, subject action) - NO IMAGES",
      "tone": "e.g., Professional, Quirky, Urgent",
      "platform": "best suited platform e.g. LinkedIn, Instagram"
    },
    ... (4 more items)
  ]
}

RULES:
- Return ONLY valid JSON. No markdown, no introductory text.
- EXACTLY 5 items.
- Ensure strict adherence to the strategy_type enum values.
`;

        // 3. Call Groq
        const resultJson = await GroqService.generate([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generate the 5 creative variants for ${product} now.` }
        ]);

        // 4. Parse & Validate
        let parsed;
        try {
            // Clean markdown if present
            const clean = resultJson.replace(/```json/g, '').replace(/```/g, '').trim();
            parsed = JSON.parse(clean);
        } catch (e) {
            throw new Error("Invalid JSON response from LLM");
        }

        if (!parsed.creatives || !Array.isArray(parsed.creatives)) {
            throw new Error("Response missing 'creatives' array");
        }

        if (parsed.creatives.length !== 5) {
            throw new Error(`Expected 5 creatives, got ${parsed.creatives.length}`);
        }

        // 5. Map to Domain Objects & Validate Strategies
        const validStrategies = ['FEATURE', 'EMOTIONAL', 'SOCIAL_PROOF', 'PRICE', 'LIFESTYLE'];

        return parsed.creatives.map((c: any, index: number) => {
            const strategy = validStrategies.includes(c.strategy_type) ? c.strategy_type : validStrategies[index % 5];

            return {
                id: (index + 1).toString(), // Simple deterministic ID
                strategy_type: strategy,
                headline: c.headline || "Untitled Creative",
                body_copy: c.body_copy || "",
                visual_prompt: c.visual_prompt || "No visual description provided.",
                tone: c.tone || "Neutral",
                platform: c.platform || "General",
                is_best_creative: false
            };
        });
    }
}
