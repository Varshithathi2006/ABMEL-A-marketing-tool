import { motion } from 'framer-motion';
import { Box, User } from 'lucide-react';
import clsx from 'clsx';
import React from 'react';

type MessageType = 'system' | 'user';

interface MessageBubbleProps {
    type: MessageType;
    content?: string;
    children?: React.ReactNode;
    isTyping?: boolean;
}

export const MessageBubble = ({ type, content, children, isTyping }: MessageBubbleProps) => {
    const isSystem = type === 'system';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, rotateX: -10 }}
            animate={{
                opacity: 1,
                y: [0, -4, 0],
                scale: 1,
                rotateX: 0
            }}
            transition={{
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                default: { type: "spring", stiffness: 350, damping: 25 }
            }}
            className={clsx(
                "flex gap-4 max-w-3xl mb-8 perspective-1000 transform-gpu",
                isSystem ? "mr-auto" : "ml-auto flex-row-reverse"
            )}
        >
            {/* Avatar */}
            <div className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg border",
                isSystem
                    ? "bg-gradient-to-br from-blue-600 to-cyan-500 border-white/10 shadow-cyan-500/20"
                    : "bg-slate-800 border-slate-700 text-slate-400"
            )}>
                {isSystem ? <Box className="w-5 h-5 text-white" /> : <User className="w-5 h-5" />}
            </div>

            {/* Bubble Content */}
            <div className={clsx(
                "relative group",
                isSystem ? "max-w-[calc(100%-3rem)]" : "max-w-[calc(100%-3rem)]"
            )}>
                <div className={clsx(
                    "p-5 rounded-2xl shadow-sm border backdrop-blur-md relative z-10",
                    isSystem
                        ? "bg-navy-900/60 border-white/10 text-slate-200 rounded-tl-sm"
                        : "bg-white/5 border-white/5 text-slate-100 rounded-tr-sm"
                )}>
                    {/* Interior Glow for System */}
                    {isSystem && <div className="absolute inset-0 bg-cyan-500/5 rounded-2xl pointer-events-none"></div>}

                    {isTyping ? (
                        <div className="flex gap-1.5 h-6 items-center px-2">
                            <motion.div
                                className="w-2 h-2 rounded-full bg-cyan-400"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                            />
                            <motion.div
                                className="w-2 h-2 rounded-full bg-cyan-400"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                            />
                            <motion.div
                                className="w-2 h-2 rounded-full bg-cyan-400"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                            />
                        </div>
                    ) : (
                        <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {content}
                            {children}
                        </div>
                    )}
                </div>

                {/* Decoration for System */}
                {isSystem && (
                    <div className="absolute -left-1 top-4 w-2 h-2 bg-cyan-400/50 rounded-full blur-[10px]"></div>
                )}
            </div>
        </motion.div>
    );
};
