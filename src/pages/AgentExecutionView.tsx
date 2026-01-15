import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Search, User, Lightbulb, CheckCircle2, Loader2 } from 'lucide-react';
import { AgentOrchestrator } from '../services/AgentOrchestrator';

export const AgentExecution = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const [activeNode, setActiveNode] = useState<string | null>(null);

    useEffect(() => {
        const runPipeline = async () => {
            const orchestrator = new AgentOrchestrator();

            orchestrator.subscribe((event) => {
                const time = new Date().toISOString().split('T')[1].split('.')[0];

                if (event.type === 'node_start') {
                    setLogs(prev => [...prev, `[${time}] [START] Starting Agent: ${event.nodeId.toUpperCase()}...`]);
                    setActiveNode(event.nodeId);

                    if (event.nodeId === 'planning') setProgress(10);
                    if (event.nodeId === 'market_research') setProgress(30);
                    if (event.nodeId === 'persona_modeling') setProgress(50);
                    if (event.nodeId === 'creative_generation') setProgress(80);
                }

                if (event.type === 'node_complete') {
                    setLogs(prev => [...prev, `[${time}] [SUCCESS] Agent ${event.nodeId} generated artifact.`]);

                    if (event.nodeId === 'creative_generation') {
                        setProgress(100);
                        setLogs(prev => [...prev, `[${time}] [SYSTEM] Pipeline Complete. Redirecting to Proof...`]);
                        setTimeout(() => {
                            // Pass data if needed via state, but we rely on artifacts mainly.
                            // For demo flow, we might want to verify artifacts exist.
                            navigate('/output');
                        }, 2000);
                    }
                }
            });

            // Start Mock Run
            setLogs(prev => [...prev, `[SYSTEM] Initializing ABMEL Backend...`]);
            await orchestrator.planCampaign({ product: "NeuralLink Pro", goal: "Conversion" });
            orchestrator.startExecution();
        };

        runPipeline();
    }, [navigate]);

    const steps = [
        { id: 'planning', label: 'Planning Agent', icon: Cpu, desc: 'Decomposing Strategy' },
        { id: 'market_research', label: 'Market Intelligence', icon: Search, desc: 'Analyzing Opportunities' },
        { id: 'persona_modeling', label: 'Persona Modeling', icon: User, desc: 'Synthesizing Behaviors' },
        { id: 'creative_generation', label: 'Creative Gen', icon: Lightbulb, desc: 'Generating Prompts' }
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Agent Swarm Execution</h1>
            <p className="text-slate-400 mb-12">System is autonomously generating strategy. Please verify logs below.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Visual Graph */}
                <div className="space-y-8 relative">
                    <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-800 -z-10"></div>
                    {steps.map((step, idx) => {
                        const isCompleted = progress > ((idx + 1) * 25) - 5; // Rough heuristic
                        const isActive = activeNode === step.id;

                        return (
                            <div key={step.id} className={`flex items-start gap-4 transition-all duration-500 ${isActive ? 'scale-105' : 'opacity-50'}`}>
                                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 bg-[#0A192F]
                                    ${isActive ? 'border-[#64FFDA] text-[#64FFDA] shadow-[0_0_15px_rgba(100,255,218,0.3)]' :
                                        isCompleted ? 'border-green-500 text-green-500' : 'border-slate-700 text-slate-700'}`}>
                                    {isActive ? <Loader2 className="w-6 h-6 animate-spin" /> :
                                        isCompleted ? <CheckCircle2 className="w-6 h-6" /> :
                                            <step.icon className="w-6 h-6" />}
                                </div>
                                <div className="pt-2">
                                    <h3 className={`font-bold ${isActive ? 'text-[#64FFDA]' : 'text-slate-200'}`}>{step.label}</h3>
                                    <p className="text-sm text-slate-500 lowercase font-mono">{step.desc}</p>
                                    {isCompleted && <span className="text-[10px] text-green-500 font-mono border border-green-900 bg-green-900/20 px-1 rounded mt-1 inline-block">ARTIFACT_SAVED</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Terminal Log */}
                <div className="bg-[#020c1b] rounded-lg border border-slate-800 p-4 font-mono text-xs overflow-hidden flex flex-col h-[500px]">
                    <div className="border-b border-slate-800 pb-2 mb-2 flex justify-between">
                        <span className="text-slate-400">SYSTEM_LOGS</span>
                        <span className="text-[#64FFDA] animate-pulse">● LIVE</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                        {logs.map((log, i) => (
                            <div key={i} className="text-slate-300 break-words">
                                <span className="text-slate-600 mr-2">{'>'}</span>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
