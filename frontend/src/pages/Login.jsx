import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, Brain } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Login = ({ setUserRole, onLoginSuccess }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e, role = 'user') => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                setError(signInError.message);
            } else if (data?.user || data?.session) {
                // Successful login (real or mock)
                if (setUserRole) setUserRole(role);
                // Notify App.jsx that login succeeded so it can set session
                if (onLoginSuccess) {
                    onLoginSuccess(data.session || { access_token: 'demo-session', user: data.user });
                }
                navigate('/dashboard');
            } else {
                setError('Login failed. Please try again.');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#05070A] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-indigo-500/8 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-20%] w-[40%] h-[40%] bg-violet-500/8 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Card */}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-10 backdrop-blur-xl shadow-2xl">
                    <div className="text-center mb-10">
                        {/* Logo */}
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                            <img
                                src="/images/neuromind-logo.png"
                                alt="NeuroMind"
                                className="w-12 h-12 object-contain"
                            />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
                        <p className="text-sm text-slate-400 font-light">Sign in to your NeuroMind workspace.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-11 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] transition-all duration-200 shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-11 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] transition-all duration-200 shadow-inner"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(99,102,241,0.3)" }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-8 text-sm disabled:opacity-50 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </motion.button>

                        <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center justify-between">
                            <div>
                                <span className="font-semibold block text-white">Reviewer Test Account:</span>
                                <span className="text-slate-400">tester.neuropilot@example.com</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setEmail('tester.neuropilot@example.com');
                                    setPassword('Password@1234');
                                }}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
                            >
                                Auto-Fill
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center text-xs text-slate-500">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                            Create one
                        </Link>
                    </div>
                </div>

                {/* Back to home */}
                <div className="text-center mt-6">
                    <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">
                        ← Back to NeuroMind
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
