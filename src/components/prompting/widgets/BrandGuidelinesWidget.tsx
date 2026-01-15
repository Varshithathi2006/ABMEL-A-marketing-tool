import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { TiltCard } from '../../ui/TiltCard';

export const BrandGuidelinesWidget = ({ onComplete }: { onComplete: (data: any) => void }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isCompleted, setIsCompleted] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = () => {
        if (!file && !isCompleted) return; // Allow manual override if needed or text input
        setIsCompleted(true);
        onComplete({ text: "Brand Guidelines File: " + (file?.name || "None") });
    };

    if (isCompleted) {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3"
            >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Check size={16} />
                </div>
                <div className="text-sm text-slate-200 font-medium">
                    Brand Guidelines Ingested <span className="text-slate-500 ml-2">({file?.name})</span>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="w-full max-w-xl">
            <div className="mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                    <AlertCircle size={14} className="text-cyan-400" />
                    Input Required: Brand Context
                </h3>
            </div>

            <TiltCard className="rounded-2xl" glowColor="cyan">
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={clsx(
                        "bg-navy-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center transition-all cursor-pointer group relative overflow-hidden",
                        isDragging ? "bg-cyan-500/10 border-cyan-500/30" : ""
                    )}
                >
                    {!file ? (
                        <>
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-slate-700 transition-colors shadow-lg shadow-black/20">
                                <Upload className="w-8 h-8 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                            </div>
                            <p className="text-slate-300 font-medium mb-1">Drag & Drop brand guidelines (PDF, TXT)</p>
                            <p className="text-xs text-slate-500">Or click to browse (Simulated)</p>
                        </>
                    ) : (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-lg shadow-blue-500/10">
                                <FileText className="w-8 h-8 text-blue-400" />
                            </div>
                            <p className="text-white font-medium mb-1">{file.name}</p>
                            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB • Ready for analysis</p>
                        </motion.div>
                    )}
                </div>
            </TiltCard>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSubmit}
                    className={clsx(
                        "px-6 py-2 rounded-lg text-sm font-bold transition-all transform hover:scale-105 active:scale-95",
                        file
                            ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/20"
                            : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    )}
                    disabled={!file}
                >
                    Confirm & Proceed
                </button>
            </div>
        </div>
    );
};
