import { motion } from 'framer-motion';
import { Home, PlayCircle, BarChart2, Settings, ShieldCheck, Box } from 'lucide-react';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useNavigate } from 'react-router-dom'; // Added import
import clsx from 'clsx';

import { AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
    const { currentView, setView } = useNavigationStore();
    const navigate = useNavigate(); // Hook

    const handleNavigation = (view: any) => {
        setView(view);
        navigate('/'); // Ensure we are on the main dashboard layout
        onClose?.();
    };

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm md:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={clsx(
                "w-64 h-screen fixed left-0 top-0 flex flex-col z-50 border-r border-white/5 bg-navy-950/95 backdrop-blur-xl transition-transform duration-300 md:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Brand Header */}
                <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <motion.div
                            whileHover={{ rotate: 180 }}
                            transition={{ duration: 0.5 }}
                            className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20"
                        >
                            <Box className="w-6 h-6 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="font-display font-bold text-xl tracking-tight text-white leading-none">ABMEL</h1>
                            <p className="text-[10px] text-cyan-400 font-medium uppercase tracking-wider mt-1.5 opacity-80">Enterprise AI</p>
                        </div>
                    </div>
                    {/* Mobile Close Button */}
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-8 overflow-y-auto w-full"> {/* Ensure w-full if needed, usually block */}
                    <div>
                        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 font-display">Core Platform</p>
                        <div className="space-y-1">
                            <NavItem
                                icon={<Home size={20} />}
                                label="Dashboard"
                                active={currentView === 'dashboard'}
                                onClick={() => handleNavigation('dashboard')}
                            />
                            <NavItem
                                icon={<PlayCircle size={20} />}
                                label="Active Campaigns"
                                active={currentView === 'campaigns'}
                                onClick={() => handleNavigation('campaigns')}
                            />
                            <NavItem
                                icon={<BarChart2 size={20} />}
                                label="Performance"
                                active={currentView === 'performance'}
                                onClick={() => handleNavigation('performance')}
                            />
                        </div>
                    </div>

                    <div>
                        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 font-display">Governance</p>
                        <div className="space-y-1">
                            <NavItem
                                icon={<ShieldCheck size={20} />}
                                label="Guardrails & Safety"
                                active={currentView === 'guardrails'}
                                onClick={() => handleNavigation('guardrails')}
                            />
                            <NavItem
                                icon={<Settings size={20} />}
                                label="System Settings"
                                active={currentView === 'settings'}
                                onClick={() => handleNavigation('settings')}
                            />
                        </div>
                    </div>
                </nav>

                {/* System Status Footer */}
                <div className="p-5 border-t border-white/5 bg-black/20">
                    <SystemStatusPanel />
                </div>
            </aside>
        </>
    );
};

// Extracted for cleaner component
import { useSystemHealth } from '../../hooks/useSystemHealth';

const SystemStatusPanel = () => {
    const health = useSystemHealth();
    const isOnline = health.status === 'ONLINE';

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">System Status</span>
                <span className={clsx("flex items-center gap-2 px-2.5 py-1 rounded-full border",
                    isOnline ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"
                )}>
                    <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse",
                        isOnline ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    )}></div>
                    <span className={clsx("text-[10px] font-bold tracking-wide",
                        isOnline ? "text-emerald-400" : "text-red-400"
                    )}>{health.status}</span>
                </span>
            </div>

            <StatusMetric label="Neural Engine" value={health.aiStatus === 'Operational' ? 100 : 60} color="bg-cyan-400" displayValue={health.aiStatus} />
            <StatusMetric label="DB Latency" value={Math.min(100, (health.dbLatency / 200) * 100)} color="bg-blue-500" displayValue={`${health.dbLatency}ms`} />
        </div>
    );
};

const NavItem = ({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02, x: 5 }}
        whileTap={{ scale: 0.98 }}
        className={clsx(
            "w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
            active
                ? "bg-gradient-to-r from-blue-600/20 to-cyan-400/10 text-cyan-50 border border-cyan-400/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:shadow-lg"
        )}
    >
        {/* Active Glow Indicator */}
        {active && (
            <motion.div
                layoutId="activeNavIndicator"
                className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
            />
        )}

        <div className={clsx("transition-colors", active ? "text-cyan-400" : "group-hover:text-cyan-200")}>
            {icon}
        </div>
        <span className="text-sm font-medium tracking-wide">{label}</span>
    </motion.button>
);

const StatusMetric = ({ label, value, color, displayValue }: { label: string, value: number, color: string, displayValue?: string }) => (
    <div>
        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
            <span>{label}</span>
            <span className="text-slate-300 font-mono">{displayValue || `${value}%`}</span>
        </div>
        <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                className={clsx(color, "h-full rounded-full shadow-[0_0_8px_rgba(34,211,238,0.3)]")}
            />
        </div>
    </div>
);
