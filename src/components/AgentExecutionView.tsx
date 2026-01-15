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
                                    const node = graph.nodes[nodeId];
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
                {status === 'completed' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white h-1/2 shadow-lg flex flex-col justify-center items-center text-center"
                    >
                        <CheckCircle2 className="w-16 h-16 mb-4 text-blue-200" />
                        <h3 className="text-xl font-bold mb-2">Optimization Complete</h3>
                        <p className="text-blue-100 text-sm mb-6">Generated 5 Creative Variants and validated against brand safety.</p>
                        <button className="bg-white text-blue-600 font-bold py-2 px-6 rounded-lg shadow-sm hover:shadow-md transition-all">
                            View Final Report
                        </button>
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
    const isCompleted = node.status === 'completed';

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
