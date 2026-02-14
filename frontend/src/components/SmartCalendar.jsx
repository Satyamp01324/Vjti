import React, { useState } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { Clock, GripVertical, AlertCircle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { format, addHours, startOfToday } from 'date-fns';

const SmartCalendar = () => {
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Deep Work: Graph Theory', time: '09:00', duration: 90, type: 'high', cognitiveLoad: 85 },
    { id: '2', title: 'Team Sync', time: '11:00', duration: 45, type: 'low', cognitiveLoad: 30 },
    { id: '3', title: 'Code Review', time: '13:00', duration: 60, type: 'medium', cognitiveLoad: 60 },
  ]);

  const timeSlots = Array.from({ length: 10 }, (_, i) => i + 9); // 9 AM to 6 PM

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 h-full flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          Smart Schedule
        </h2>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> High Focus
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Medium
          <span className="w-2 h-2 rounded-full bg-blue-500"></span> Low
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {/* Time Grid */}
        <div className="absolute inset-0 pointer-events-none">
          {timeSlots.map((hour) => (
            <div key={hour} className="h-20 border-t border-white/5 flex items-start group">
              <span className="text-xs text-slate-500 w-12 -mt-2 group-hover:text-emerald-400 transition-colors">
                {format(new Date().setHours(hour, 0), 'h:mm a')}
              </span>
              <div className="flex-1 h-full relative">
                 {/* Hour Line */}
              </div>
            </div>
          ))}
        </div>

        {/* Tasks Layer */}
        <div className="pl-12 pt-2 relative z-10 space-y-4">
          <Reorder.Group axis="y" values={tasks} onReorder={setTasks} className="space-y-4">
            {tasks.map((task) => (
              <Reorder.Item key={task.id} value={task} dragListener={true}>
                <motion.div
                  layoutId={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02, zIndex: 20 }}
                  whileDrag={{ scale: 1.05, cursor: "grabbing" }}
                  className={clsx(
                    "relative p-4 rounded-xl border border-white/5 backdrop-blur-sm cursor-grab active:cursor-grabbing group overflow-hidden transition-all duration-300",
                    task.type === 'high' ? 'bg-emerald-500/10 border-emerald-500/20' :
                    task.type === 'medium' ? 'bg-amber-500/10 border-amber-500/20' :
                    'bg-blue-500/10 border-blue-500/20'
                  )}
                >
                  {/* Glow Effect */}
                  <div className={clsx(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                    task.type === 'high' ? 'bg-gradient-to-r from-emerald-500/10 to-transparent' :
                    task.type === 'medium' ? 'bg-gradient-to-r from-amber-500/10 to-transparent' :
                    'bg-gradient-to-r from-blue-500/10 to-transparent'
                  )} />

                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <GripVertical className="text-slate-600 group-hover:text-white transition-colors" size={16} />
                      <div>
                        <h3 className="font-medium text-white text-sm">{task.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                          <Clock size={12} />
                          {task.duration} min • {task.time}
                        </p>
                      </div>
                    </div>
                    
                    {/* Cognitive Load Indicator */}
                    <div className="flex flex-col items-end">
                      <span className={clsx(
                        "text-xs font-bold px-2 py-0.5 rounded-full border",
                        task.type === 'high' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                        task.type === 'medium' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
                        'text-blue-400 border-blue-500/20 bg-blue-500/10'
                      )}>
                        {task.cognitiveLoad}% Load
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {/* Add Task Placeholder */}
          <motion.div 
            whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.05)" }}
            className="h-12 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-slate-500 text-sm cursor-pointer hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
          >
            + Add smart task
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SmartCalendar;
