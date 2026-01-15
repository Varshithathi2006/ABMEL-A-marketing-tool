import { motion } from 'framer-motion';
import { Home, PlayCircle, BarChart2, Settings, ShieldCheck, Box } from 'lucide-react';
import { useNavigationStore } from '../../store/useNavigationStore';
import clsx from 'clsx';

export const Sidebar = () => {
    const { currentView, setView } = useNavigationStore();

    return (
        <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col z-50 border-r border-white/5 bg-navy-950/50 backdrop-blur-xl">
            {/* Brand Header */}
            <div className="p-6 border-b border-white/5 bg-white/5">
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
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-8 overflow-y-auto">
                <div>
                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 font-display">Core Platform</p>
                    <div className="space-y-1">
                        <NavItem
                            icon={<Home size={20} />}
                            label="Dashboard"
                            active={currentView === 'dashboard'}
                            onClick={() => setView('dashboard')}
                        />
                        <NavItem
                            icon={<PlayCircle size={20} />}
                            label="Active Campaigns"
                            active={currentView === 'campaigns'}
                            onClick={() => setView('campaigns')}
                        />
                        <NavItem
                            icon={<BarChart2 size={20} />}
                            label="Performance"
                            active={currentView === 'performance'}
                            onClick={() => setView('performance')}
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
                            onClick={() => setView('guardrails')}
                        />
                        <NavItem
                            icon={<Settings size={20} />}
                            label="System Settings"
                            active={currentView === 'settings'}
                            onClick={() => setView('settings')}
                        />
                    </div>
                </div>
            </nav>

            {/* System Status Footer */}
            <div className="p-5 border-t border-white/5 bg-black/20">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">System Status</span>
                    <span className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                        <span className="text-[10px] font-bold text-emerald-400 tracking-wide">ONLINE</span>
                    </span>
                </div>

                <div className="space-y-3">
                    <StatusMetric label="Neural Engine" value={12} color="bg-cyan-400" />
                    <StatusMetric label="Memory Usage" value={35} color="bg-blue-500" />
                </div>
            </div>
        </aside>
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

const StatusMetric = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div>
        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
            <span>{label}</span>
            <span className="text-slate-300 font-mono">{value}%</span>
        </div>
        <div className="w-full bg-slate-800/50 h-1 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                className={clsx(color, "h-full rounded-full shadow-[0_0_8px_rgba(34,211,238,0.3)]")}
            />
        </div>
    </div>
);
