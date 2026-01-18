import { useState } from 'react';
import { CheckCircle2, ArrowRight, Star, X, Copy, Monitor } from 'lucide-react';
import { useCampaignStore } from '../store/useCampaignStore';
import { motion, AnimatePresence } from 'framer-motion';

export const CreativeResultsGrid = () => {
    const { creatives, graph } = useCampaignStore();
    const [selectedVariant, setSelectedVariant] = useState<any>(null);

    // Recover Best Creative ID from Decision Node or Graph Context
    const decisionNode = graph?.nodes['decision'];
    const bestCreativeId = decisionNode?.result?.bestCreativeId;

    // Fallback logic
    const variants = (creatives && creatives.length > 0)
        ? creatives
        : (graph?.nodes['creative_generation']?.result?.variants || []);

    if (variants.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <p>No creatives found yet.</p>
            </div>
        );
    }

    // Sort: Best Creative First
    const sortedVariants = [...variants].sort((a: any, b: any) => {
        if (a.id === bestCreativeId) return -1;
        if (b.id === bestCreativeId) return 1;
        return 0;
    });

    return (
        <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="text-green-500 fill-green-100" />
                        Creatives Generated
                    </h2>
                    <p className="text-slate-400 mt-1">Rule-based selection applied.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {sortedVariants.map((variant: any, idx: number) => {
                    const isTopPick = variant.id === bestCreativeId || variant.is_best_creative;

                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={idx}
                            className={`
                            bg-white rounded-xl border shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col relative overflow-hidden
                            ${isTopPick ? 'ring-2 ring-emerald-400 border-emerald-400 scale-[1.02] order-first' : 'border-slate-200 hover:-translate-y-1 hover:border-blue-300'}
                        `}
                        >
                            <div className={`absolute top-0 left-0 w-full h-1 ${isTopPick ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}></div>

                            {isTopPick && (
                                <div className="absolute top-2 right-2 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                                    <Star size={10} className="fill-emerald-700" /> BEST CREATIVE
                                </div>
                            )}

                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        {variant.platform}
                                    </span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                        {variant.strategy_type}
                                    </span>
                                </div>

                                <h3 className="font-bold text-slate-800 text-lg leading-tight mb-3 group-hover:text-blue-700 transition-colors line-clamp-3">
                                    {variant.headline}
                                </h3>

                                <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1 line-clamp-4">
                                    {variant.body_copy || variant.body}
                                </p>

                                <div className="space-y-3 mt-auto">
                                    <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 italic border border-slate-100">
                                        <span className="font-bold block mb-1 text-slate-400 text-[10px]">VISUAL PROMPT:</span>
                                        <div className="line-clamp-2">
                                            {variant.visual_prompt || variant.visualDescription}
                                        </div>
                                    </div>

                                    <div className="text-[10px] text-slate-400 font-medium">
                                        Tone: {variant.tone}
                                    </div>

                                    <button
                                        onClick={() => setSelectedVariant(variant)}
                                        className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                                    >
                                        View Details <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* PREVIEW MODAL */}
            <AnimatePresence>
                {selectedVariant && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setSelectedVariant(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col md:flex-row"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedVariant(null)}
                                className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors z-10"
                            >
                                <X size={20} className="text-slate-600" />
                            </button>

                            {/* Left: Content Preview */}
                            <div className="flex-1 p-8 border-r border-slate-100">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">
                                        {selectedVariant.platform}
                                    </span>
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wide">
                                        {selectedVariant.strategy_type}
                                    </span>
                                </div>

                                <h2 className="text-3xl font-bold text-slate-900 mb-6 leading-tight">
                                    {selectedVariant.headline}
                                </h2>

                                <div className="prose prose-slate mb-8 text-slate-600 leading-relaxed whitespace-pre-line">
                                    {selectedVariant.body_copy || selectedVariant.body}
                                </div>

                                <div className="flex gap-4">
                                    <button className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-lg">
                                        <Copy size={18} /> Copy Copy
                                    </button>
                                    <button className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                                        <Monitor size={18} /> Preview
                                    </button>
                                </div>
                            </div>

                            {/* Right: Meta & Visuals */}
                            <div className="w-full md:w-80 bg-slate-50 p-8 flex flex-col gap-6">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Visual Direction</h3>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm text-slate-600 italic">
                                        "{selectedVariant.visual_prompt || selectedVariant.visualDescription}"
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tone Attributes</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedVariant.tone.split(',').map((t: string, i: number) => (
                                            <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 font-medium">
                                                {t.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                        <h4 className="text-blue-900 font-bold text-sm mb-1">Why this works</h4>
                                        <p className="text-blue-700/80 text-xs leading-relaxed">
                                            This variant leverages a <strong>{selectedVariant.strategy_type}</strong> strategy, optimizing for high engagement on {selectedVariant.platform} through {selectedVariant.tone} messaging.
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
