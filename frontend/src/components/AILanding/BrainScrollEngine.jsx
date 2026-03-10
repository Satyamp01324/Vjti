import React, { useRef, useEffect, useState } from 'react';
import { useScroll, useTransform, useSpring, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const FRAME_COUNT = 300;

export const BrainScrollEngine = () => {
    const canvasRef = useRef(null);
    const [images, setImages] = useState([]);
    const [imagesLoaded, setImagesLoaded] = useState(0);
    const navigate = useNavigate();

    const { scrollYProgress } = useScroll();

    // Smooth the scroll progress to avoid jitter
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 50,
        damping: 20,
        restDelta: 0.001
    });

    const frameIndex = useTransform(smoothProgress, [0, 1], [1, FRAME_COUNT]);

    // Opacities for the different scrollytelling layers
    // Hero is visible at the very top (0), fades out by 0.15
    const heroOpacity = useTransform(smoothProgress, [0, 0.12, 0.18], [1, 1, 0]);
    const heroY = useTransform(smoothProgress, [0, 0.18], [0, -50]);

    // Other floating texts
    const section1Opacity = useTransform(smoothProgress, [0.2, 0.3, 0.4], [0, 1, 0]);
    const section2Opacity = useTransform(smoothProgress, [0.45, 0.55, 0.65], [0, 1, 0]);
    const section3Opacity = useTransform(smoothProgress, [0.7, 0.8, 0.9], [0, 1, 0]);

    // Floating UI element opacities - appear after Hero fades out
    const floatUIOpacity = useTransform(smoothProgress, [0.2, 0.3, 0.9, 0.95], [0, 1, 1, 0]);
    const floatUIXLeft = useTransform(smoothProgress, [0.2, 0.3], [-50, 0]);
    const floatUIXRight = useTransform(smoothProgress, [0.2, 0.3], [50, 0]);

    useEffect(() => {
        const loadedImages = [];
        let loadedCount = 0;

        for (let i = 1; i <= FRAME_COUNT; i++) {
            const img = new Image();
            img.src = `/images/brain_vjti/ezgif-frame-${String(i).padStart(3, '0')}.jpg`;
            img.onload = () => {
                loadedCount++;
                setImagesLoaded(loadedCount);
            };
            img.onerror = () => {
                loadedCount++;
                setImagesLoaded(loadedCount);
            };
            loadedImages.push(img);
        }
        setImages(loadedImages);
    }, []);

    useEffect(() => {
        if (!canvasRef.current || images.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const render = () => {
            const renderIndex = frameIndex.get();
            const index = Math.max(0, Math.min(Math.round(renderIndex) - 1, FRAME_COUNT - 1));
            const img = images[index];
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // Responsive COVER fit scaling — fills entire screen
                const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
                const x = (canvas.width / 2) - (img.naturalWidth / 2) * scale;
                const y = (canvas.height / 2) - (img.naturalHeight / 2) * scale;

                // Screen blending for cool hologram effect
                ctx.globalCompositeOperation = "screen";
                ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
            }
        };

        const loop = () => {
            render();
            animationFrameId = requestAnimationFrame(loop);
        };
        loop();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [images, frameIndex]);

    return (
        <div className="h-[400vh] relative w-full bg-[#05070A]">
            <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">

                {/* Ambient glow behind everything */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-indigo-600/10 blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-[10%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-violet-600/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                {imagesLoaded < FRAME_COUNT && imagesLoaded === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 bg-[#05070A]">
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-12 h-12 border border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                            <div className="text-indigo-400/80 font-mono text-xs tracking-[0.2em] uppercase">
                                Initializing Neural Engine [{Math.round((imagesLoaded / FRAME_COUNT) * 100)}%]
                            </div>
                        </div>
                    </div>
                )}

                {/* Canvas Container */}
                <div className="absolute inset-0 z-10 mix-blend-screen opacity-90 transition-opacity duration-1000">
                    <canvas ref={canvasRef} className="w-full h-full object-contain" />
                </div>

                {/* Overlaid Floating UI Widgets (Fade in after Hero) */}
                <motion.div
                    style={{ opacity: floatUIOpacity }}
                    className="absolute inset-0 z-20 pointer-events-none flex items-center"
                >
                    <div className="max-w-7xl mx-auto w-full h-full relative">
                        {/* Energy Score Overlay */}
                        <motion.div
                            style={{ x: floatUIXLeft }}
                            className="absolute top-[30%] left-6 md:left-12 glass-card border border-white/10 bg-black/40 p-5 rounded-2xl backdrop-blur-xl shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                        >
                            <div className="text-[10px] text-indigo-300 uppercase tracking-widest mb-2 opacity-80 font-semibold">Live Energy Flow</div>
                            <div className="text-3xl font-light text-white flex items-baseline gap-1">84<span className="text-sm text-slate-400">%</span></div>
                            <div className="w-40 h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
                                <div className="w-[84%] h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 rounded-full relative shadow-[0_0_10px_rgba(139,92,246,0.8)]">
                                    <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 blur-[2px] animate-pulse"></div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Stress Indicator Overlay */}
                        <motion.div
                            style={{ x: floatUIXRight }}
                            className="absolute bottom-[30%] right-6 md:right-12 glass-card border border-white/10 bg-black/40 p-5 rounded-2xl backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                        >
                            <div className="text-[10px] text-emerald-300 uppercase tracking-widest mb-2 opacity-80 font-semibold">Cognitive Load</div>
                            <div className="text-3xl font-light text-emerald-400 flex items-baseline gap-1 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">Low</div>
                            <div className="w-32 h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden flex gap-1">
                                <div className="flex-1 h-full bg-emerald-500 rounded-full border border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                                <div className="flex-1 h-full bg-white/10 rounded-full"></div>
                                <div className="flex-1 h-full bg-white/10 rounded-full"></div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* ─── Hero Section Overlay (Visible only at the top of the page) ─── */}
                <motion.div
                    style={{ opacity: heroOpacity, y: heroY }}
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6"
                >
                    <div className="max-w-5xl mx-auto space-y-8 pointer-events-auto mt-20">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md mb-4 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                        >
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse relative shadow-[0_0_10px_rgba(129,140,248,1)]"></span>
                            <span className="text-[11px] font-bold tracking-widest text-indigo-300 uppercase drop-shadow-md">NeuroMind — System Online</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="text-5xl md:text-[6rem] font-bold tracking-tighter leading-[1.1] text-white my-8 drop-shadow-2xl"
                        >
                            Your Mind.<br /> Measured. Managed. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 filter drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]">Mastered.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.4 }}
                            className="text-lg md:text-xl text-slate-300/90 font-light leading-relaxed max-w-2xl mx-auto drop-shadow-lg"
                        >
                            The first intelligent operating system for your brain. We monitor your cognitive bandwidth and perfectly schedule your day to prevent burnout.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.6 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10"
                        >
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(99,102,241,0.5)" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/dashboard')}
                                className="px-8 py-4 bg-white text-[#05070A] rounded-full font-bold text-sm tracking-wide border border-white flex items-center gap-3 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                Enter Dashboard <ArrowRight size={18} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                                className="px-8 py-4 bg-black/40 backdrop-blur-lg text-white rounded-full font-medium text-sm border border-white/20 transition-all flex items-center gap-2"
                            >
                                See How It Works
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>

                {/* ─── Subsequent Scrollytelling Typography Layers ─── */}
                <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                    <motion.div style={{ opacity: section1Opacity, y: useTransform(section1Opacity, [0, 1], [50, 0]), scale: useTransform(section1Opacity, [0, 1], [0.9, 1]) }} className="absolute text-center drop-shadow-2xl">
                        <h2 className="text-5xl md:text-8xl font-bold tracking-tighter text-white drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]">Monitor Your Mind.</h2>
                    </motion.div>

                    <motion.div style={{ opacity: section2Opacity, y: useTransform(section2Opacity, [0, 1], [50, 0]), scale: useTransform(section2Opacity, [0, 1], [0.9, 1]) }} className="absolute text-center drop-shadow-2xl">
                        <h2 className="text-5xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]">Optimize Your Energy.</h2>
                    </motion.div>

                    <motion.div style={{ opacity: section3Opacity, y: useTransform(section3Opacity, [0, 1], [50, 0]), scale: useTransform(section3Opacity, [0, 1], [0.9, 1]) }} className="absolute text-center drop-shadow-2xl">
                        <h2 className="text-5xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 drop-shadow-[0_0_30px_rgba(167,139,250,0.4)]">Prevent Burnout.</h2>
                    </motion.div>
                </div>

            </div>
        </div>
    );
};

