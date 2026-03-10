import React from 'react';
import { motion } from 'framer-motion';

const overlayData = [
    {
        title: "The Ultimate Brain Twin.",
        subtitle: "We mapped cognitive energy to a neural network, unlocking peak performance.",
        align: "left"
    },
    {
        title: "Hyper-Adaptive.",
        subtitle: "NeuroMind re-routes tasks based on your live cognitive bandwidth. No more fake productivity.",
        align: "right"
    },
    {
        title: "Flow State. Engineered.",
        subtitle: "Experience zero friction between thought and execution. A symphony of productivity.",
        align: "center"
    }
];

export const SystemTextOverlays = () => {
    return (
        <div className="absolute inset-0 pointer-events-none w-full max-w-7xl mx-auto px-6 z-10">
            <div className="flex flex-col justify-around h-full py-[100vh]">
                {overlayData.map((data, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
                        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -50, filter: 'blur(10px)' }}
                        viewport={{ once: false, margin: "-40% 0px -40% 0px" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className={`w-full max-w-2xl 
              ${data.align === 'left' ? 'mr-auto text-left' :
                                data.align === 'right' ? 'ml-auto text-right' : 'mx-auto text-center'}
            `}
                    >
                        <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-white mb-6">
                            {data.title}
                        </h2>
                        <p className="text-xl md:text-2xl text-indigo-200/80 font-light leading-relaxed">
                            {data.subtitle}
                        </p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
