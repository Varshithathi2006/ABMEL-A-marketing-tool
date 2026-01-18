import { create } from 'zustand';
import { AgentOrchestrator } from '../services/AgentOrchestrator';
import { SupabaseService } from '../services/SupabaseService';
import { useAuthStore } from './useAuthStore';
import { useNotificationStore } from './useNotificationStore';
import type { CampaignInput } from '../types/abmel';
import type { TaskGraph, GraphEvent } from '../types/graph';

interface CampaignState {
    orchestrator: AgentOrchestrator;

    // Campaign Input
    input: CampaignInput;
    setInput: (input: Partial<CampaignInput>) => void;

    // Execution State
    status: 'idle' | 'created' | 'planned' | 'running' | 'completed';
    graph: TaskGraph | null;
    logs: string[];

    // History
    campaigns: any[];

    // Actions
    fetchCampaigns: (userId: string) => Promise<void>;
    restoreDraft: (userId: string) => Promise<void>;
    planCampaign: () => Promise<void>;
    executeCampaign: () => void;
    saveCampaign: () => Promise<void>;
    reset: () => void;
    addLog: (msg: string) => void;
    updateGraph: (graph: TaskGraph) => void;
    updateNodeStatus: (nodeId: string, status: any, result?: any) => void;
    fetchCampaignDetails: (campaignId: string) => Promise<Record<string, any>>;
}

export const useCampaignStore = create<CampaignState>((set, get) => {
    const orchestrator = new AgentOrchestrator();

    // Subscribe to orchestrator events
    orchestrator.subscribe((event: GraphEvent) => {
        const { graph } = get();

        if (event.type === 'node_start') {
            get().addLog(`[${event.timestamp}] Started task: ${event.nodeId}`);
            if (graph && event.nodeId) {
                const nodes = { ...graph.nodes };
                if (nodes[event.nodeId]) {
                    nodes[event.nodeId] = { ...nodes[event.nodeId], status: 'running' };
                    set({ graph: { ...graph, nodes } });
                }
            }
        } else if (event.type === 'node_complete') {
            get().addLog(`[${event.timestamp}] Completed task: ${event.nodeId}`);

            // Special case: Initial graph generation (Planning Phase)
            if (event.data && event.data.taskGraph) {
                set({ graph: event.data.taskGraph });
                return;
            }

            const { graph } = get(); // Re-get graph just in case
            if (graph && event.nodeId) {
                const nodes = { ...graph.nodes };
                if (nodes[event.nodeId]) {
                    nodes[event.nodeId] = {
                        ...nodes[event.nodeId],
                        status: 'completed',
                        result: event.data
                    };

                    // Sync context if available in data keys (excluding taskGraph which we handled)
                    set({ graph: { ...graph, nodes, context: { ...graph.context, ...event.data } } });
                }
            }
        } else if (event.type === 'graph_complete') {
            get().addLog(`[${event.timestamp}] Campaign optimization complete.`);

            // ARCHIVE CAMPAIGN TO HISTORY
            const finishedGraph = get().graph;
            if (finishedGraph) {
                const decisionNode = finishedGraph.nodes['decision'];
                const winner = decisionNode?.result?.selected_creative;
                const score = winner?.score ? `Score: ${Math.round(winner.score)}` : 'Completed';

                const newCampaign = {
                    id: Math.random().toString(36).substring(7).toUpperCase(),
                    name: finishedGraph.context.product + ' Campaign',
                    status: 'Completed',
                    date: new Date().toLocaleDateString(),
                    performance: score,
                    audience: finishedGraph.context.audience || 'General'
                };

                set({
                    status: 'completed',
                    campaigns: [newCampaign, ...get().campaigns]
                });
            } else {
                set({ status: 'completed' });
            }

            useNotificationStore.getState().addNotification({
                type: 'success',
                title: 'Campaign Optimized',
                message: 'All agents have completed their tasks. Review the final decision.'
            });

        } else if (event.type === 'node_reset') {
            get().addLog(`[${event.timestamp}] Resetting task: ${event.nodeId}`);
            if (graph && event.nodeId) {
                const nodes = { ...graph.nodes };
                if (nodes[event.nodeId]) {
                    nodes[event.nodeId] = {
                        ...nodes[event.nodeId],
                        status: 'idle',
                        result: undefined
                    };
                    set({ graph: { ...graph, nodes } });
                }
            }
        }
    });

    return {
        orchestrator,
        input: {
            product: '',
            audience: '',
            goal: '',
            budget: '',
            platforms: [],
            brandGuidelines: ''
        },
        status: 'idle',
        graph: null,
        logs: [],
        campaigns: [],

        setInput: (updates) => {
            set((state) => {
                const newInput = { ...state.input, ...updates };
                // Debounced save to draft (pseudo-impl)
                const userId = useAuthStore.getState().user?.id;
                if (userId) {
                    // In a real app we'd debounce this call
                    SupabaseService.getInstance().saveDraft(userId, newInput).catch(console.warn);
                }
                return { input: newInput };
            });
        },

        restoreDraft: async (userId: string) => {
            try {
                const draft = await SupabaseService.getInstance().getDraft(userId);
                if (draft) {
                    set({ input: { ...get().input, ...draft } });
                    get().addLog('Restored previous campaign configuration from cloud.');
                }
            } catch (e) {
                console.log('No draft found or error restoring', e);
            }
        },

        fetchCampaigns: async (userId: string) => {
            try {
                const data = await SupabaseService.getInstance().getUserCampaigns(userId);
                // Map DB shape to UI shape if needed. 
                // UI expects: { id, name, status, date, performance, audience }
                // DB has: { id, product, status, created_at, ... }

                const mapped = data.map(c => ({
                    id: c.id,
                    name: c.product + ' Campaign',
                    status: c.status,
                    date: new Date().toLocaleDateString(), // simplified for now, or parse c.created_at
                    performance: 'In Progress', // Placeholder until we link output
                    audience: c.target_audience
                }));

                set({ campaigns: mapped });
            } catch (e) {
                console.error("Failed to fetch campaigns", e);
            }
        },

        fetchCampaignDetails: async (campaignId: string) => {
            // Retrieve agent artifacts for a specific campaign
            try {
                return await SupabaseService.getInstance().getAgentOutputs(campaignId);
            } catch (e) {
                console.error("Failed to fetch details", e);
                return {};
            }
        },

        addLog: (msg) => set((state) => ({ logs: [...state.logs, msg] })),

        updateGraph: (graph) => set({ graph }),

        updateNodeStatus: (nodeId, status, result) => set((state) => {
            if (!state.graph) return state;
            const nodes = { ...state.graph.nodes };
            if (nodes[nodeId]) {
                nodes[nodeId] = { ...nodes[nodeId], status, result };
            }
            return { graph: { ...state.graph, nodes } };
        }),

        planCampaign: async () => {
            console.log('[Store] planCampaign triggered');
            const { input, orchestrator } = get();
            console.log('[Store] Input:', input);

            // 1. Create Campaign in DB (Real-time persistence)
            let campaignId = 'temp-' + Date.now();
            try {
                // Fetch userId from Auth Store
                const userId = useAuthStore.getState().user?.id;
                console.log('[Store] UserId:', userId);

                if (userId) {
                    campaignId = await SupabaseService.getInstance().createCampaign(userId, input);
                    get().addLog(`[System] Campaign initialized in DB: ${campaignId}`);
                } else {
                    get().addLog('[System] Warning: No authenticated user. Campaign saved locally only.');
                    console.warn('[Store] No authenticated user found.');
                }
            } catch (err) {
                console.warn("Failed to create campaign in DB", err);
            }

            console.log('[Store] Setting status to running...');
            set({ status: 'running', logs: [], graph: null });

            try {
                // 2. Initialize Orchestrator with campaignId context
                console.log('[Store] Calling orchestrator.planCampaign...');
                await orchestrator.planCampaign({
                    ...input,
                    campaignId: campaignId // VITAL: Pass ID for artifact tagging
                });

                console.log('[Store] Orchestrator planning complete. Setting status to planned.');
                set({ status: 'planned' });
                get().addLog('Campaign execution plan generated. Initiating execution sequence...');

                // Auto-execute for seamless tailored experience
                console.log('[Store] Auto-executing campaign...');
                useNotificationStore.getState().addNotification({
                    type: 'success',
                    title: 'Execution Plan Ready',
                    message: 'Campaign strategy has been generated. Agents are now executing tasks.'
                });
                get().executeCampaign();
            } catch (error) {
                console.error('[Store] Error during planning:', error);
                get().addLog(`Error during planning: ${error}`);
                set({ status: 'idle' });
                useNotificationStore.getState().addNotification({
                    type: 'error',
                    title: 'Planning Failed',
                    message: 'Could not generate campaign plan. Please try again.'
                });
            }
        },

        executeCampaign: () => {
            const { orchestrator } = get();
            set({ status: 'running' });
            try {
                orchestrator.startExecution();
            } catch (error) {
                console.error(error);
                get().addLog(`Error starting execution: ${error}`);
            }
        },

        saveCampaign: async () => {
            // Deprecated in favor of auto-save during planCampaign
            const { input } = get();
            console.log('Saving campaign context...', input);
            set({ status: 'created' });
            get().addLog('Campaign context saved successfully. Status: CREATED');
        },

        reset: () => set({ status: 'idle', graph: null, logs: [] })
    };
});
