import React, { useState } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { Clock, GripVertical, Plus, X, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';

const SmartCalendar = () => {
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Deep Work: Graph Theory', time: '09:00', duration: 90, type: 'high', cognitiveLoad: 85 },
    { id: '2', title: 'Team Sync', time: '11:00', duration: 45, type: 'low', cognitiveLoad: 30 },
    { id: '3', title: 'Code Review', time: '13:00', duration: 60, type: 'medium', cognitiveLoad: 60 },
    { id: '4', title: 'Documentation', time: '15:00', duration: 45, type: 'low', cognitiveLoad: 25 },
  ]);

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  const timeSlots = Array.from({ length: 10 }, (_, i) => i + 9);

  const typeColors = {
    high: { dot: 'bg-emerald-500', bg: 'bg-emerald-500/[0.06]', border: 'border-emerald-500/20', text: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    medium: { dot: 'bg-amber-500', bg: 'bg-amber-500/[0.06]', border: 'border-amber-500/20', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    low: { dot: 'bg-blue-500', bg: 'bg-blue-500/[0.06]', border: 'border-blue-500/20', text: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  };

  const handleAddTask = async () => {
    if (!newTaskInput.trim()) return;

    setIsScheduling(true);

    try {
      // Call the backend scheduler API
      const response = await fetch(`${API_BASE}/api/scheduler/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: newTaskInput }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Task scheduled:', result);

      if (result.status === 'success') {
        // Extract task details from response
        const taskData = result.task || result.scheduled_task || {};
        const calendarEvent = result.calendar_event || {};

        // Parse start time
        let taskTime = '10:00';
        let taskDuration = 60;

        if (calendarEvent.start) {
          const startDate = new Date(calendarEvent.start.dateTime || calendarEvent.start);
          taskTime = format(startDate, 'HH:mm');
        } else if (result.optimal_slot?.start_time) {
          const startDate = new Date(result.optimal_slot.start_time);
          taskTime = format(startDate, 'HH:mm');
        }

        // Get duration
        if (taskData.duration) {
          taskDuration = taskData.duration;
        } else if (calendarEvent.start && calendarEvent.end) {
          const start = new Date(calendarEvent.start.dateTime || calendarEvent.start);
          const end = new Date(calendarEvent.end.dateTime || calendarEvent.end);
          taskDuration = Math.round((end - start) / (1000 * 60));
        }

        // Determine difficulty and type
        const difficulty = taskData.difficulty || taskData.estimated_difficulty || 5;
        const taskType = difficulty >= 7 ? 'high' : difficulty >= 4 ? 'medium' : 'low';

        // Add the new task to the list
        const newTask = {
          id: Date.now().toString(),
          title: taskData.task_name || taskData.name || newTaskInput,
          time: taskTime,
          duration: taskDuration,
          type: taskType,
          cognitiveLoad: Math.round(difficulty * 10),
          eventId: calendarEvent.id || null,
        };

        setTasks([...tasks, newTask]);
        setNewTaskInput('');
        setShowAddTask(false);

        // Show success message
        console.log('✅ Task added successfully:', newTask);
      } else {
        throw new Error(result.error || 'Failed to schedule task');
      }
    } catch (error) {
      console.error('Error scheduling task:', error);

      // Fallback: add task manually with smart defaults
      const newTask = {
        id: Date.now().toString(),
        title: newTaskInput,
        time: format(new Date(), 'HH:mm'),
        duration: 60,
        type: 'medium',
        cognitiveLoad: 50,
      };

      setTasks([...tasks, newTask]);
      setNewTaskInput('');
      setShowAddTask(false);

      console.log('⚠️ Task added with fallback (backend unavailable)');
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-5 h-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Smart Schedule</h2>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> High</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Med</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Low</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative flex-1 overflow-y-auto pr-1">
        {/* Time Grid */}
        <div className="absolute inset-0 pointer-events-none">
          {timeSlots.map((hour) => (
            <div key={hour} className="h-16 border-t border-white/[0.03] flex items-start">
              <span className="text-[10px] text-slate-600 w-10 -mt-1.5 font-mono">
                {format(new Date().setHours(hour, 0), 'h a')}
              </span>
            </div>
          ))}
        </div>

        {/* Tasks Layer */}
        <div className="pl-10 pt-1 relative z-10 space-y-2">
          <Reorder.Group axis="y" values={tasks} onReorder={setTasks} className="space-y-2">
            {tasks.map((task) => {
              const colors = typeColors[task.type] || typeColors.low;
              return (
                <Reorder.Item key={task.id} value={task} dragListener={true}>
                  <motion.div
                    layoutId={task.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: 2 }}
                    whileDrag={{ scale: 1.02, cursor: "grabbing" }}
                    className={clsx(
                      "relative p-3 rounded-lg border cursor-grab active:cursor-grabbing group transition-all duration-200",
                      colors.bg, colors.border, "hover:border-white/[0.1]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <GripVertical className="text-slate-700 group-hover:text-slate-400 transition-colors" size={14} />
                        <div>
                          <h3 className="font-medium text-white text-[13px]">{task.title}</h3>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <Clock size={10} />
                            {task.duration} min · {task.time}
                          </p>
                        </div>
                      </div>
                      <span className={clsx("text-[10px] font-medium px-2 py-0.5 rounded border", colors.badge)}>
                        {task.cognitiveLoad}%
                      </span>
                    </div>
                  </motion.div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>

          {/* Add Task */}
          <AnimatePresence>
            {showAddTask ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-800/60 border border-white/[0.08] rounded-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTask();
                      if (e.key === 'Escape') setShowAddTask(false);
                    }}
                    placeholder="e.g., Review pull requests for 30 minutes"
                    className="flex-1 bg-transparent text-white text-xs placeholder-slate-500 outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleAddTask}
                    disabled={!newTaskInput.trim() || isScheduling}
                    className="px-2 py-1 bg-emerald-500 text-white text-xs rounded hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {isScheduling ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-3 h-3 border border-white/30 border-t-white rounded-full"
                        />
                        <span>Scheduling...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} />
                        <span>Schedule</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowAddTask(false)}
                    className="p-1 text-slate-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  AI will analyze your task and schedule it at the optimal time based on your energy levels
                </p>
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                onClick={() => setShowAddTask(true)}
                className="h-9 border border-dashed border-white/[0.06] rounded-lg flex items-center justify-center text-slate-600 text-xs cursor-pointer hover:border-emerald-500/20 hover:text-emerald-500/60 transition-all gap-1"
              >
                <Plus size={12} />
                Add task
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SmartCalendar;
