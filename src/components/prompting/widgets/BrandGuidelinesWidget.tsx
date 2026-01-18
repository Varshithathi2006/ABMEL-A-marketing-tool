import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Check, AlertCircle, FileType } from 'lucide-react';
import clsx from 'clsx';
import { TiltCard } from '../../ui/TiltCard';
import { SupabaseService } from '../../../services/SupabaseService';

export const BrandGuidelinesWidget = ({ onComplete }: { onComplete: (data: any) => void }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);
        setIsUploading(true);

        // Simulate processing / Real upload logic
        try {
            await new Promise(r => setTimeout(r, 1500)); // Fake parse time

            // In real app, we would upload to storage here
            // const text = await parseFile(selectedFile); 
            // For now, custom logic or mock:
            const mockText = "Brand Constraints: Use professional tone. Primary Color: Blue.";

            // Persist (Mock or Real)
            // await SupabaseService.getInstance().saveGuideline('temp', mockText, selectedFile.name);

            setIsUploading(false);
        } catch (err) {
            setError("Failed to parse file structure.");
            setIsUploading(false);
        }
    };

    const confirmUpload = () => {
        if (!file) return;
        setIsCompleted(true);
        onComplete({
            text: "Parsed Brand Guidelines",
            fileName: file.name,
            file: file
        });
    };

    if (isCompleted) {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center gap-3"
            >
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Check size={16} />
                </div>
                <div className="text-sm text-slate-200 font-medium">
                    Brand Knowledge Ingested <span className="text-slate-500 ml-2">({file?.name})</span>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="w-full max-w-xl">
            <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                    <span className="w-8 h-[1px] bg-purple-500/50"></span>
                    Context Injection
                </h3>
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                        <FileText size={20} />
                    </div>
                    Brand Guidelines
                </h2>
            </div>

            <TiltCard className="rounded-2xl" glowColor="purple">
                <div className="premium-card rounded-2xl p-8 relative overflow-hidden group/card">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="space-y-6 relative z-10">
                        <div className="border-2 border-dashed border-slate-700/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors hover:border-purple-500/30 hover:bg-white/5 relative">

                            <input
                                type="file"
                                accept=".pdf,.txt,.md"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                disabled={isUploading}
                            />

                            <div className={clsx("w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500",
                                isUploading ? "bg-purple-500/20 animate-pulse" : "bg-slate-800"
                            )}>
                                {isUploading ? (
                                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                ) : file ? (
                                    <FileText className="w-8 h-8 text-purple-400" />
                                ) : (
                                    <Upload className="w-8 h-8 text-slate-500" />
                                )}
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold text-white">
                                    {file ? file.name : "Upload Guidelines Document"}
                                </h3>
                                <p className="text-sm text-slate-400">
                                    {isUploading ? "Parsing semantic structure..." : "Supports PDF, TXT, MD (Max 10MB)"}
                                </p>
                            </div>

                            {file && !isUploading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 flex items-center gap-2 text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20"
                                >
                                    <Check size={12} />
                                    Analysis Complete
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </TiltCard>

            <div className="mt-6 flex justify-between items-center">
                <button
                    onClick={() => onComplete({ skipped: true })}
                    className="text-slate-500 hover:text-white text-sm font-medium px-4 py-2"
                >
                    Skip Context
                </button>

                <button
                    onClick={confirmUpload}
                    disabled={!file || isUploading}
                    className={clsx(
                        "px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg",
                        (!file || isUploading)
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-purple-600 text-white shadow-purple-500/25 hover:bg-purple-500 hover:shadow-purple-500/40"
                    )}
                >
                    Confirm Guidelines
                </button>
            </div>
        </div>
    );
};
