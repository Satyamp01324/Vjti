import React, { useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

export const AdvancedParallaxBackground = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end end"]
    });

    const y1 = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
    const y2 = useTransform(scrollYProgress, [0, 1], ['0%', '-15%']);
    const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 0.3, 0.6]);

    return (
        <div ref={ref} className="fixed inset-0 w-full h-full pointer-events-none -z-10 bg-[#0F172A] overflow-hidden">
            <motion.div
                style={{ y: y1, opacity }}
                className="absolute top-[-20%] left-[-10%] w-[60%] aspect-square rounded-full bg-indigo-500/20 blur-[120px]"
            />
            <motion.div
                style={{ y: y2, opacity }}
                className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-violet-600/15 blur-[100px]"
            />

            {/* Noise Overlay */}
            <div className="absolute inset-0 bg-noise mix-blend-overlay opacity-20"></div>

            {/* Floating particles (CSS animated) */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-white opacity-10 animate-float"
                        style={{
                            width: Math.random() * 4 + 1 + 'px',
                            height: Math.random() * 4 + 1 + 'px',
                            top: Math.random() * 100 + '%',
                            left: Math.random() * 100 + '%',
                            animationDuration: (Math.random() * 10 + 5) + 's',
                            animationDelay: (Math.random() * 5) + 's',
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
