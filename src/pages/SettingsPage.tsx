import { User, Bell, Database } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';

export const SettingsPage = () => {
    const { llmProvider, temperature, updateSettings, notifications } = useSettingsStore();
    const { user } = useAuthStore();

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold text-white tracking-tight">System Settings</h1>

            <div className="space-y-6">

                {/* Profile Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <User size={20} className="text-blue-500" />
                        Account Profile
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-2">Email</label>
                            <input type="text" value={user?.email || 'N/A'} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" readOnly />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-2">Role</label>
                            <input type="text" value="System Admin" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-400 outline-none" readOnly />
                        </div>
                    </div>
                </div>

                {/* API & Integations */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Database size={20} className="text-purple-500" />
                        Model Configuration
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-2">LLM Provider</label>
                            <select
                                value={llmProvider}
                                onChange={(e) => updateSettings({ llmProvider: e.target.value as any })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500"
                            >
                                <option value="groq">Groq (Llama-3-70b) - Recommended</option>
                                <option value="openai">OpenAI (GPT-4) - Connected</option>
                                <option value="ollama">Ollama (Local) - Detection Pending</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-2">Creativity Temperature: {temperature}</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={temperature}
                                onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                                className="w-full accent-purple-500"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>Precise</span>
                                <span>Balanced</span>
                                <span>Creative</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Bell size={20} className="text-yellow-500" />
                        Notifications
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Email Reports</span>
                            <button
                                onClick={() => updateSettings({ notifications: { ...notifications, email: !notifications.email } })}
                                className={`w-10 h-6 rounded-full relative transition-colors ${notifications.email ? 'bg-blue-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${notifications.email ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Push Notifications</span>
                            <button
                                onClick={() => updateSettings({ notifications: { ...notifications, push: !notifications.push } })}
                                className={`w-10 h-6 rounded-full relative transition-colors ${notifications.push ? 'bg-blue-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${notifications.push ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                    Configuration Saved
                </button>
            </div>
        </div>
    );
};
