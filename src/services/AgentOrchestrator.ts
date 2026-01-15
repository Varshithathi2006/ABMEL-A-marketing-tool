import { BaseAgent } from './agents/BaseAgent';
import { PlanningAgent } from './agents/PlanningAgent';
import { MarketIntelligenceAgent } from './agents/MarketIntelligenceAgent';
import { PersonaModelingAgent } from './agents/PersonaModelingAgent';
import { CreativeGenerationAgent } from './agents/CreativeGenerationAgent';
import { DecisionAgent } from './agents/DecisionAgent';
import type { TaskGraph, TaskNode, GraphEvent } from '../types/graph';
import { GuardrailsAgent } from './agents/GuardrailsAgent';
import { SupabaseService } from './SupabaseService';
import { LearningAgent } from './agents/LearningAgent';
import { CTRAgent, MemorabilityAgent, BrandAlignmentAgent } from './agents/EvaluationAgents';

// Evaluation agents handled within Decision or separately

export class AgentOrchestrator {
    private agents: Map<string, BaseAgent> = new Map();

    private taskGraph: TaskGraph | null = null;
    private subscribers: ((event: GraphEvent) => void)[] = [];

    constructor() {
        this.registerAgent(new PlanningAgent());
        this.registerAgent(new MarketIntelligenceAgent());
        this.registerAgent(new PersonaModelingAgent());
        this.registerAgent(new CreativeGenerationAgent());
        this.registerAgent(new DecisionAgent());
        this.registerAgent(new GuardrailsAgent());
        this.registerAgent(new LearningAgent());
        // Register Evaluation Agents
        this.registerAgent(new CTRAgent());
        this.registerAgent(new MemorabilityAgent());
        this.registerAgent(new BrandAlignmentAgent());
    }

    private registerAgent(agent: BaseAgent) {
        this.agents.set(agent.name, agent);
    }

    public subscribe(callback: (event: GraphEvent) => void) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(s => s !== callback);
        };
    }

    private emit(event: GraphEvent) {
        this.subscribers.forEach(s => s(event));
    }

    public async planCampaign(input: any) {
        console.log('Planning campaign with input:', input);

        // 1. Reset Graph
        this.taskGraph = null;

        // 2. Planning Phase (Bootstrap)
        const planningAgent = this.agents.get('PlanningAgent');
        if (!planningAgent) throw new Error('PlanningAgent not found');

        const result = await planningAgent.execute(input);
        if (result.status === 'completed' && result.data.taskGraph) {
            this.taskGraph = result.data.taskGraph;
            this.emit({ type: 'node_complete', nodeId: 'planning', data: result.data, timestamp: new Date().toISOString() });
            // execution loop NOT started automatically
        } else {
            console.error('Planning failed', result);
            throw new Error(`Planning Phase Failed: ${result.data?.error || 'Unknown error'}`);
        }
    }

    public startExecution() {
        if (!this.taskGraph) throw new Error('No plan generated. Run planCampaign first.');
        console.log('Starting execution loop...');
        this.runExecutionLoop();
    }

    private async runExecutionLoop() {
        if (!this.taskGraph) return;

        const { nodes } = this.taskGraph;
        let active = false;
        let allComplete = true;

        // Find executable nodes
        const executableNodes: TaskNode[] = [];

        for (const nodeId in nodes) {
            const node = nodes[nodeId];
            if (node.status === 'completed') continue;

            allComplete = false;

            if (node.status === 'running') {
                active = true;
                continue; // Already running
            }

            // Check dependencies
            if (node.status === 'idle') {
                const depsMet = node.dependencies.every(depId => nodes[depId]?.status === 'completed');
                if (depsMet) {
                    executableNodes.push(node);
                }
            }
        }

        if (allComplete) {
            this.emit({ type: 'graph_complete', timestamp: new Date().toISOString() });
            return;
        }

        // Execute nodes
        if (executableNodes.length > 0) {
            active = true;
            executableNodes.forEach(node => this.executeNode(node));
        }

        // If nothing is running and nothing can run, we might be deadlocked or done
        if (!active && !allComplete) {
            console.warn('Graph execution stalled');
        }
    }

    private async executeNode(node: TaskNode) {
        if (!this.taskGraph) return;

        const agent = this.agents.get(node.agentName);
        if (!agent) {
            console.error(`Agent ${node.agentName} not found for node ${node.id}`);
            node.status = 'failed';
            return;
        }

        // Start
        node.status = 'running';
        this.emit({ type: 'node_start', nodeId: node.id, timestamp: new Date().toISOString() });

        try {
            // Prepare input from context
            const input = { ...this.taskGraph.context }; // Pass full context for simplicity for now

            const result = await agent.execute(input);

            if (result.status === 'completed') {
                node.status = 'completed';
                node.result = result.data;
                // Update context
                this.taskGraph.context = { ...this.taskGraph.context, ...result.data };

                this.emit({ type: 'node_complete', nodeId: node.id, data: result.data, timestamp: new Date().toISOString() });

                // PERSIST ARTIFACT
                this.saveArtifact(node.id, result.data);

                // --- CRITICAL CONTROL POINT ---
                // Stop immediately if Creative Generation is complete. 
                // Do NOT proceed to evaluation loops in this mode.
                if (node.id === 'creative_generation') {
                    console.log('Creative Generation Complete. Terminating Pipeline as per Scope Limit.');
                    // Force complete graph status
                    this.emit({ type: 'graph_complete', timestamp: new Date().toISOString() });
                    return; // Stop processing further nodes
                }

                // --- DYNAMIC CONTROL FLOW LOGIC ---

                // 1. Handle Guardrail Failure (Loop Back to Decision)
                if (node.id === 'guardrails' && result.data.passed === false) {
                    console.log('Guardrails failed. Looping back to Decision...');
                    const failedId = result.data.failed_variant_id;

                    // Add to rejected list
                    const currentRejected = this.taskGraph.context.rejected_variants || [];
                    this.taskGraph.context.rejected_variants = [...currentRejected, failedId];

                    // Reset nodes to trigger re-evaluation
                    this.resetNodes(['decision', 'guardrails']);
                }

                // 2. Handle Regeneration Trigger (Loop Back to Creative Gen)
                if (node.id === 'decision' && result.data.trigger_regeneration) {
                    const currentLoop = this.taskGraph.context.loop_count || 0;
                    const MAX_RETRIES = 3;

                    if (currentLoop >= MAX_RETRIES) {
                        console.error('Max regeneration retries exceeded. Stopping execution.');
                        // Fail the decision node finally or just stop
                        node.status = 'failed';
                        this.taskGraph.context.error = 'Max retries exceeded. Unable to generate compliant creatives.';
                        this.emit({ type: 'node_fail', nodeId: 'decision', data: { error: 'Max Retries Exceeded' }, timestamp: new Date().toISOString() });
                        return; // Stop here
                    }

                    console.log(`All variants rejected. Regenerating creatives (Attempt ${currentLoop + 1}/${MAX_RETRIES})...`);

                    // Increment loop count
                    this.taskGraph.context.loop_count = currentLoop + 1;

                    // Clear rejection history for fresh start
                    this.taskGraph.context.rejected_variants = [];

                    // Reset all upstream nodes starting from creative generation
                    this.resetNodes([
                        'creative_generation',
                        'evaluation_ctr',
                        'evaluation_mem',
                        'evaluation_brand',
                        'decision',
                        'guardrails'
                    ]);
                }

            } else {
                node.status = 'failed';
                this.emit({ type: 'node_fail', nodeId: node.id, data: result, timestamp: new Date().toISOString() });
            }
        } catch (error) {
            console.error(`Error executing node ${node.id}`, error);
            node.status = 'failed';
            this.emit({ type: 'node_fail', nodeId: node.id, data: error, timestamp: new Date().toISOString() });
        }

        // Trigger next loop
        this.runExecutionLoop();
    }

    private resetNodes(nodeIds: string[]) {
        if (!this.taskGraph) return;
        nodeIds.forEach(id => {
            const n = this.taskGraph!.nodes[id];
            if (n) {
                n.status = 'idle';
                n.result = undefined;
                console.log(`Resetting node ${id} to idle.`);
                this.emit({ type: 'node_reset', nodeId: id, timestamp: new Date().toISOString() });
            }
        });
    }

    private async saveArtifact(nodeId: string, data: any) {
        const campaignId = data.campaignId || this.taskGraph?.context?.campaignId;

        if (!campaignId) {
            console.warn('[Orchestrator] Warning: No campaignId found in context. Persistence might be incomplete.');
        } else {
            // 1. DB PERSISTENCE (Supabase) - Runs in Browser & Node
            try {
                await SupabaseService.getInstance().saveAgentOutput(campaignId, nodeId, data);

                // 2. Creative Variants Handling
                if (nodeId === 'creative_generation' && data.variants && Array.isArray(data.variants)) {
                    console.log(`[Orchestrator] Persisting ${data.variants.length} creative variants...`);
                    for (const variant of data.variants) {
                        await SupabaseService.getInstance().saveCreativeVariant(campaignId, variant);
                    }
                }
            } catch (err) {
                console.error('[Orchestrator] Failed to persist artifact to DB:', err);
            }
        }

        // 3. Local File System Persistence (Node.js only - for test_pipeline.ts)
        // Removed for browser compatibility
        /*
        if (typeof window === 'undefined') {
             // ...
        }
        */
    }
}
