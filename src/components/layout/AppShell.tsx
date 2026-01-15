import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Bell, HelpCircle, Search, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { setView } = useNavigationStore();
    const { user, signOut } = useAuthStore();

    return (
        <div className="min-h-screen bg-transparent flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 ml-64 min-w-0 flex flex-col h-screen relative z-10">
                {/* Executive Top Bar */}
                <header className="h-20 px-8 flex items-center justify-between z-40 bg-transparent backdrop-blur-sm sticky top-0">

                    {/* Breadcrumbs / Context */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3"
                    >
                        <div className="flex items-center text-sm font-medium">
                            <span className="text-slate-400 hover:text-slate-200 cursor-pointer transition-colors">Campaigns</span>
                            <span className="mx-3 text-slate-600">/</span>
                            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-cyan-300 text-xs tracking-wide shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                Q1 Product Launch
                            </span>
                        </div>
                    </motion.div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-6">
                        {/* Search Bar */}
                        <div className="relative group">
                            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search system..."
                                className="pl-10 pr-4 py-2 text-sm bg-navy-900/50 border border-white/5 rounded-full focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all w-64 text-slate-200 placeholder:text-slate-600 shadow-inner"
                            />
                        </div>

                        <div className="h-8 w-px bg-white/5 mx-2"></div>

                        {/* Notifications */}
                        <button className="relative p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all hover:scale-105 active:scale-95">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-navy-950 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                        </button>

                        <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all hover:scale-105 active:scale-95">
                            <HelpCircle size={20} />
                        </button>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 pl-2 ml-2 cursor-pointer group"
                            >
                                <div className="text-right hidden md:block">
                                    <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{user?.email?.split('@')[0] || 'User'}</div>
                                    <div className="text-[10px] text-cyan-400/80 font-medium tracking-wider">MARKETING DIRECTOR</div>
                                </div>

                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 border border-white/10 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <span className="text-sm font-bold">{user?.email?.[0].toUpperCase() || 'U'}</span>
                                </div>
                                <ChevronDown size={14} className={clsx("text-slate-500 transition-transform duration-300", isProfileOpen && "rotate-180")} />
                            </motion.button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.1 }}
                                        className="absolute top-14 right-0 w-56 bg-navy-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden"
                                    >
                                        <div className="p-1 px-1.5 space-y-0.5">
                                            <div className="px-4 py-3 border-b border-white/5 mb-1">
                                                <p className="text-sm font-bold text-white">{user?.email}</p>
                                                <p className="text-xs text-slate-500">Authorized User</p>
                                            </div>

                                            <DropdownItem icon={<User size={14} />} label="Profile" onClick={() => { setView('settings'); setIsProfileOpen(false); }} />
                                            <DropdownItem icon={<Settings size={14} />} label="Settings" onClick={() => { setView('settings'); setIsProfileOpen(false); }} />

                                            <div className="border-t border-white/5 my-1"></div>

                                            <button
                                                onClick={() => { signOut(); setIsProfileOpen(false); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors flex items-center gap-3 font-medium"
                                            >
                                                <LogOut size={16} /> Sign Out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 scroll-smooth relative no-scrollbar perspective-1000">
                    {/* Background decoration */}
                    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen"
                        ></motion.div>
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] mix-blend-screen"
                        ></motion.div>
                    </div>

                    <div className="max-w-7xl mx-auto relative z-10 transform-style-3d">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

const DropdownItem = ({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-cyan-400 rounded-lg transition-all flex items-center gap-3 font-medium"
    >
        {icon}
        {label}
    </button>
);
