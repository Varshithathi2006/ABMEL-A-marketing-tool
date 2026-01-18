import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Users, Target, Check, IndianRupee } from 'lucide-react';
import clsx from 'clsx';
import { TiltCard } from '../../ui/TiltCard';

export const ProductDetailsWidget = ({ onComplete }: { onComplete: (data: any) => void }) => {
    const [data, setData] = useState({
        product: '',
        audience: '',
        price: '',
        goal: 'awareness',
        platforms: [] as string[],
        file: null as File | null
    });
    const [isCompleted, setIsCompleted] = useState(false);

    const handleSubmit = () => {
        if (!data.product || !data.audience) return;
        setIsCompleted(true);
        onComplete(data);
    };

    const togglePlatform = (p: string) => {
        setData(prev => ({
            ...prev,
            platforms: prev.platforms.includes(p)
                ? prev.platforms.filter(x => x !== p)
                : [...prev.platforms, p]
        }));
    };

    if (isCompleted) {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3"
            >
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Check size={16} />
                </div>
                <div className="text-sm text-slate-200 font-medium">
                    Campaign Configuration Locked <span className="text-slate-500 ml-2">({data.product})</span>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="w-full max-w-xl">
            <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                    <span className="w-8 h-[1px] bg-cyan-500/50"></span>
                    Input Required
                </h3>
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <Target size={20} />
                    </div>
                    Campaign Parameters
                </h2>
            </div>

            <TiltCard className="rounded-2xl" glowColor="cyan">
                {/* Main Card Container */}
                <div className="premium-card rounded-2xl p-8 relative overflow-hidden group/card">

                    {/* Background Ambience */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="space-y-6 relative z-10">
                        {/* Product Name */}
                        <div className="group">
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider ml-1 group-focus-within:text-cyan-400 transition-colors">
                                Product Designation
                            </label>
                            <div className="relative transform transition-transform duration-300 group-focus-within:scale-[1.01]">
                                <ShoppingBag className="absolute left-4 top-4 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    type="text"
                                    className="w-full pl-12 pr-4 py-4 glass-input font-medium"
                                    placeholder="e.g. Quantum Neural Chip"
                                    value={data.product}
                                    onChange={e => setData({ ...data, product: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Audience */}
                            <div className="group">
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider ml-1 group-focus-within:text-cyan-400 transition-colors">Target Audience</label>
                                <div className="relative transform transition-transform duration-300 group-focus-within:scale-[1.01]">
                                    <Users className="absolute left-4 top-4 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-4 py-4 glass-input font-medium"
                                        placeholder="e.g. Data Scientists"
                                        value={data.audience}
                                        onChange={e => setData({ ...data, audience: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Price */}
                            <div className="group">
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider ml-1 group-focus-within:text-cyan-400 transition-colors">Price Point (INR)</label>
                                <div className="relative transform transition-transform duration-300 group-focus-within:scale-[1.01]">
                                    <IndianRupee className="absolute left-4 top-4 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                    <input
                                        type="number"
                                        className="w-full pl-12 pr-4 py-4 glass-input font-medium"
                                        placeholder="₹ 0.00"
                                        value={data.price}
                                        onChange={e => setData({ ...data, price: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-[1px] bg-white/5 my-4"></div>

                        {/* Goal Selector */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider ml-1">Optimization Goal</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['awareness', 'conversion', 'retention'].map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setData({ ...data, goal: g })}
                                        className={clsx(
                                            "py-3 px-2 rounded-xl text-xs font-bold capitalize transition-all duration-300 transform border",
                                            data.goal === g
                                                ? "bg-gradient-to-br from-blue-600/80 to-cyan-600/80 border-cyan-400/50 text-white shadow-lg shadow-cyan-500/20 scale-[1.02]"
                                                : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 hover:border-white/10"
                                        )}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Platforms */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider ml-1">Deployment Channels</label>
                            <div className="flex flex-wrap gap-2.5">
                                {['LinkedIn', 'Twitter/X', 'Email', 'Web', 'Instagram', 'TikTok', 'YouTube', 'Facebook'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => togglePlatform(p)}
                                        className={clsx(
                                            "py-2 px-4 rounded-lg text-xs font-medium transition-all duration-300 border flex items-center gap-2",
                                            data.platforms.includes(p)
                                                ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                                                : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:border-white/10"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-2 h-2 rounded-full transition-colors",
                                            data.platforms.includes(p) ? "bg-cyan-400 shadow-[0_0_5px_cyan]" : "bg-slate-600"
                                        )}></div>
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-full h-[1px] bg-white/5 my-4"></div>

                        {/* Brand Guidelines Upload */}

                    </div>
                </div>
            </TiltCard>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={!data.product || !data.audience}
                    className={clsx(
                        "group relative px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden",
                        (!data.product || !data.audience)
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                            : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5"
                    )}
                >
                    {(!data.product || !data.audience) ? (
                        <span>Save Configuration</span>
                    ) : (
                        <span className="flex items-center gap-2">
                            Initialize Protocol
                            <Check className="w-4 h-4" />
                        </span>
                    )}

                    {/* Shine Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
                </button>
            </div>
        </div>
    );
};
