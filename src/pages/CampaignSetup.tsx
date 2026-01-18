import { useState, useEffect } from 'react';
import { Upload, CheckCircle, Database, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCampaignStore } from '../store/useCampaignStore';

export const CampaignSetup = () => {
    const navigate = useNavigate();
    const { setInput, planCampaign, input } = useCampaignStore();
    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);

    // Sync local state with store
    const [formData, setFormData] = useState({
        product: input.product || '',
        goal: input.goal || 'AWARENESS',
        audience: input.audience || '',
        price: input.budget || '', // Using budget field for Price (INR)
        brandGuidelines: input.brandGuidelines || ''
    });

    // Restore from store on mount
    useEffect(() => {
        if (input.product) {
            setFormData({
                product: input.product,
                goal: input.goal || 'AWARENESS',
                audience: input.audience || '',
                price: input.budget || '',
                brandGuidelines: input.brandGuidelines || ''
            });
        }
    }, [input]);

    const updateField = (field: string, value: any) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        // Persist to store immediately
        setInput({
            [field === 'price' ? 'budget' : field]: value
        });
        setError(null);
    };

    const validateStep = (currentStep: number): boolean => {
        if (currentStep === 1) {
            if (!formData.product.trim()) {
                setError("Product name is required.");
                return false;
            }
            if (!['AWARENESS', 'CONVERSIONS', 'ENGAGEMENT'].includes(formData.goal)) {
                setError("Invalid Campaign Goal.");
                return false;
            }
            // Price Validation
            if (!formData.price.trim()) {
                setError("Price is required.");
                return false;
            }
            if (!/^\₹?\d+(\.\d{1,2})?$/.test(formData.price.replace(/,/g, ''))) {
                setError("Price must be a valid number (INR).");
                return false;
            }
        }
        if (currentStep === 3) {
            if (!formData.audience.trim()) {
                setError("Audience description is required.");
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(s => s + 1);
        }
    };

    const handleLaunch = async () => {
        if (!validateStep(step)) return;

        try {
            await planCampaign(); // This triggers the chain
            navigate('/execution'); // Navigate to execution view
        } catch (e: any) {
            setError("Failed to launch campaign: " + e.message);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Progress Stepper */}
            <div className="flex items-center justify-between mb-12">
                {[1, 2, 3, 4].map(num => (
                    <div key={num} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm border 
                            ${step >= num ? 'bg-[#64FFDA] text-[#0A192F] border-[#64FFDA]' : 'bg-[#112240] text-slate-500 border-slate-700'}`}>
                            {step > num ? <CheckCircle className="w-5 h-5" /> : num}
                        </div>
                        <span className={`text-sm ${step >= num ? 'text-slate-200' : 'text-slate-600'}`}>
                            {num === 1 ? 'Basics' : num === 2 ? 'Brand' : num === 3 ? 'Audience' : 'Review'}
                        </span>
                        {num < 4 && <div className="w-12 h-[1px] bg-slate-800 ml-3"></div>}
                    </div>
                ))}
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded flex items-center gap-3 text-red-400">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Step 1: Basics */}
            {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-[#112240] p-8 rounded-lg border border-slate-800">
                        <h2 className="text-2xl font-semibold text-slate-100 mb-6">Campaign Strategy Initialization</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-[#64FFDA] mb-2 uppercase tracking-wider">Product Name</label>
                                <input
                                    type="text"
                                    value={formData.product}
                                    onChange={e => updateField('product', e.target.value)}
                                    className="w-full bg-[#0A192F] border border-slate-700 rounded p-3 text-slate-100 focus:border-[#64FFDA] outline-none"
                                    placeholder="e.g. NeuralLink Pro Headset"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-mono text-[#64FFDA] mb-2 uppercase tracking-wider">Campaign Goal</label>
                                    <select
                                        value={formData.goal}
                                        onChange={e => updateField('goal', e.target.value)}
                                        className="w-full bg-[#0A192F] border border-slate-700 rounded p-3 text-slate-100 focus:border-[#64FFDA] outline-none"
                                    >
                                        <option value="AWARENESS">AWARENESS</option>
                                        <option value="CONVERSIONS">CONVERSIONS</option>
                                        <option value="ENGAGEMENT">ENGAGEMENT</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-[#64FFDA] mb-2 uppercase tracking-wider">Price (INR)</label>
                                    <input
                                        type="text"
                                        value={formData.price}
                                        onChange={e => updateField('price', e.target.value)}
                                        className="w-full bg-[#0A192F] border border-slate-700 rounded p-3 text-slate-100 focus:border-[#64FFDA] outline-none"
                                        placeholder="₹ 0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleNext} className="w-full py-4 bg-[#64FFDA] text-[#0A192F] font-bold rounded hover:opacity-90 transition-opacity">
                        Initialize Parameters &rarr;
                    </button>
                </div>
            )}

            {/* Step 2: Brand Assets (Ingestion) */}
            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-[#112240] p-8 rounded-lg border border-slate-800">
                        <h2 className="text-2xl font-semibold text-slate-100 mb-2">Ingest Brand Consitution</h2>
                        <p className="text-slate-400 mb-8">Paste Strict Brand Guidelines (Text/PDF content simulation).</p>

                        <div className="border border-slate-700 rounded-lg p-4 bg-[#0A192F]">
                            <label className="block text-xs font-mono text-[#64FFDA] mb-2 uppercase tracking-wider">Brand Guidelines Text</label>
                            <textarea
                                value={formData.brandGuidelines}
                                onChange={(e) => updateField('brandGuidelines', e.target.value)}
                                className="w-full h-32 bg-[#0A192F] border-none text-slate-100 focus:ring-0 outline-none resize-none"
                                placeholder="Paste brand positioning, tone of voice, and prohibited terms here..."
                            />
                        </div>

                        <div className="mt-4 flex items-center gap-3 p-4 bg-[#0A192F] rounded border border-slate-700">
                            <Database className="w-4 h-4 text-[#64FFDA]" />
                            <span className="text-xs font-mono text-slate-400">INGESTION PIPELINE: ACTIVE [TEXT INPUT MODE]</span>
                        </div>
                    </div>
                    <button onClick={handleNext} className="w-full py-4 border border-[#64FFDA] text-[#64FFDA] font-bold rounded hover:bg-[#64FFDA]/10 transition-colors">
                        Process & Continue &rarr;
                    </button>
                </div>
            )}

            {/* Step 3: Audience */}
            {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-[#112240] p-8 rounded-lg border border-slate-800">
                        <h2 className="text-2xl font-semibold text-slate-100 mb-6">Target Audience definition</h2>
                        <div>
                            <label className="block text-xs font-mono text-[#64FFDA] mb-2 uppercase tracking-wider">Audience Description</label>
                            <textarea
                                value={formData.audience}
                                onChange={e => updateField('audience', e.target.value)}
                                className="w-full h-32 bg-[#0A192F] border border-slate-700 rounded p-3 text-slate-100 focus:border-[#64FFDA] outline-none"
                                placeholder="Describe the ideal customer profile. The Persona Agent will generate detailed behavioral models from this input."
                            />
                        </div>
                    </div>
                    <button onClick={handleNext} className="w-full py-4 bg-[#64FFDA] text-[#0A192F] font-bold rounded hover:opacity-90 transition-opacity">
                        Finalize Configuration &rarr;
                    </button>
                </div>
            )}

            {/* Step 4: Verification */}
            {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-[#112240] p-8 rounded-lg border border-slate-800">
                        <h2 className="text-2xl font-semibold text-slate-100 mb-6">System Pre-Flight Check</h2>

                        <div className="space-y-4 font-mono text-sm">
                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                <span className="text-slate-500">PRODUCT_ENTITY</span>
                                <span className="text-[#64FFDA]">{formData.product || "N/A"}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                <span className="text-slate-500">GOAL_VECTOR</span>
                                <span className="text-[#64FFDA]">{formData.goal}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                <span className="text-slate-500">PRICE_POINT</span>
                                <span className="text-[#64FFDA]">{formData.price}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                <span className="text-slate-500">BRAND_CONSTRAINTS</span>
                                <span className={formData.brandGuidelines ? "text-[#64FFDA]" : "text-orange-400"}>
                                    {formData.brandGuidelines ? "User Defined" : "Using Safe Defaults"}
                                </span>
                            </div>
                            <div className="flex justify-between pb-2">
                                <span className="text-slate-500">AGENTS_READY</span>
                                <span className="text-[#64FFDA]">4/4 [ACTIVE]</span>
                            </div>
                        </div>

                        <div className="mt-8 bg-[#0A192F] p-4 rounded border border-slate-700 text-xs text-slate-400">
                            &gt; INITIALIZING AGENT SWARM...<br />
                            &gt; PLANNING_AGENT: STANDBY<br />
                            &gt; MARKET_AGENT: STANDBY<br />
                            &gt; PERSONA_AGENT: STANDBY<br />
                            &gt; CREATIVE_AGENT: STANDBY<br />
                            &gt; DECISION_AGENT: STANDBY
                        </div>
                    </div>

                    <button onClick={handleLaunch} className="w-full py-4 bg-[#64FFDA] text-[#0A192F] font-bold rounded shadow-[0_0_20px_rgba(100,255,218,0.3)] hover:shadow-[0_0_30px_rgba(100,255,218,0.5)] transition-shadow">
                        EXECUTE STRATEGY SWARM
                    </button>
                    <p className="text-center text-xs text-slate-600">Strictly deterministic execution. Artifacts will be generated.</p>
                </div>
            )}
        </div>
    );
};
