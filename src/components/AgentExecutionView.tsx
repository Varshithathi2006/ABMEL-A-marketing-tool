import { useCampaignStore } from '../store/useCampaignStore';
import { Loader2, CheckCircle2, Circle, AlertTriangle, FileText, Bot } from 'lucide-react';
import type { TaskNode } from '../types/graph';
import { motion } from 'framer-motion';

export const AgentExecutionView = () => {
    const { graph, status, logs } = useCampaignStore();

    // If data is initializing, show loader
    if (!graph && status === 'running') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-500" />
                <p>Initializing Agents...</p>
            </div>
        );
    }

    // If failed, show error
    if (status === 'failed') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
                <AlertTriangle className="w-16 h-16 mb-4 text-red-500" />
                <h3 className="text-xl font-bold text-slate-200 mb-2">Refinement Needed</h3>
                <p className="max-w-md text-center text-slate-400 mb-6">
                    {logs[logs.length - 1] || "The agents encountered a blocker. Please adjust your inputs or try again."}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                >
                    Retry Execution
                </button>
            </div>
        );
    }

    // Safety fallback
    if (!graph) return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-500" />
            <p>Waiting for State...</p>
        </div>
    );

    // Sort nodes roughly by dependency depth (simplified for visual flow)
    // In a real DAG visualizer we'd use a layout library like Dagre
    const layers = [
        ['planning'],
        ['market_research'],
        ['persona_modeling'],
        ['creative_generation'],
        ['evaluation_ctr', 'evaluation_mem', 'evaluation_brand'],
        ['decision'],
        ['guardrails'],
        ['learning']
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
            {/* Left Col: Pipeline Visualizer */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                        <Bot className="w-5 h-5 text-blue-600 animate-pulse" />
                        Live Agent Execution Stream
                        <span className="flex h-2 w-2 relative ml-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {status}
                    </span>
                </div>

                <div className="space-y-8 relative flex flex-col items-center py-8">
                    {/* Connecting Line (Centered) */}
                    <div className="absolute left-1/2 top-4 bottom-4 w-px bg-slate-200 -z-10 -translate-x-1/2"></div>

                    {layers.map((layer, idx) => (
                        <div key={idx} className="relative w-full flex justify-center">
                            <div className="flex items-center justify-center gap-4 flex-wrap max-w-2xl px-4">
                                {layer.map(nodeId => {
                                    // SAFETY CHECK: Ensure graph and nodes exist
                                    const node = graph?.nodes?.[nodeId];
                                    if (!node) return null;
                                    return <NodeCard key={nodeId} node={node} />;
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Col: Live Logs & Output Preview */}
            <div className="flex flex-col gap-6 h-full">
                {/* Logs Console */}
                <div className="bg-slate-900 text-slate-300 rounded-xl p-4 font-mono text-xs h-1/2 overflow-y-auto shadow-sm">
                    <div className="text-slate-500 mb-2 border-b border-slate-800 pb-2">Create_System_Logs</div>
                    <div className="space-y-1">
                        {logs.map((log, i) => (
                            <div key={i} className="break-all opacity-80 hover:opacity-100 transition-opacity">
                                <span className="text-blue-500 mr-2">{'>'}</span>
                                {log.split(']').pop()?.trim()}
                            </div>
                        ))}
                        {status === 'running' && (
                            <div className="animate-pulse text-blue-500 pt-2">_ Processing...</div>
                        )}
                    </div>
                </div>

                {/* Final Output Preview (Simple) */}
                {/* Final Output Preview (Simple) */}
                {status === 'completed' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl border border-slate-200 shadow-lg flex flex-col h-1/2 overflow-hidden"
                    >
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <CheckCircle2 className="text-green-500 w-5 h-5" />
                                Generated Creatives
                            </h3>
                            <button className="text-xs font-bold text-blue-600 hover:underline">Export</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {/* Extract variants from creative agent result */}
                            {graph?.nodes['creative_generation']?.result?.variants?.map((variant: any, idx: number) => (
                                <div key={idx} className="p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-slate-700 text-sm">
                                            {variant.headline || `Strategy #${idx + 1}`}
                                        </h4>
                                        <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide">
                                            Variant {idx + 1}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                                        {variant.rationale || variant.body || "No description available."}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                                            {variant.platform || "Omnichannel"}
                                        </span>
                                    </div>
                                </div>
                            )) || (
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        No variants found in output data.
                                    </div>
                                )}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

const NodeStatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        case 'running': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
        case 'failed': return <AlertTriangle className="w-5 h-5 text-red-500" />;
        default: return <Circle className="w-5 h-5 text-slate-300" />;
    }
};

const NodeCard = ({ node }: { node: TaskNode }) => {
    const isActive = node.status === 'running';

    return (
        <motion.div
            initial={{ opacity: 0.5, scale: 0.95 }}
            animate={{
                opacity: node.status === 'idle' ? 0.5 : 1,
                scale: 1,
                borderColor: isActive ? 'rgb(59, 130, 246)' : 'rgb(226, 232, 240)'
            }}
            className={`
                bg-white p-4 rounded-lg border shadow-sm w-64 min-w-[250px]
                ${isActive ? 'ring-2 ring-blue-100' : ''}
                transition-all duration-300
            `}
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {node.agentName.replace('Agent', '')}
                </span>
                <NodeStatusIcon status={node.status} />
            </div>
            <div className="text-sm font-medium text-slate-900 mb-1 capitalize">
                {node.id.replace('_', ' ')}
            </div>

            {/* Context/Output Preview Snippet */}
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 bg-slate-50 p-2 rounded">
                <div className="flex items-center gap-1 mb-1 text-slate-400">
                    <FileText size={10} />
                    <span>Output</span>
                </div>
                {/* Heuristic to show relevant data string */}
                <div className="truncate">
                    {(JSON.stringify(Object.values(node.result || {})[0] || "") || "").substring(0, 30)}...
                </div>
            </div>
        </motion.div>
    );
}
