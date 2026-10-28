import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Download,
  Trash2,
  Lock,
  EyeOff,
  CheckCircle2,
  HardDrive,
  Cloud,
  Ban,
  AlertTriangle,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPrivacyManifest, exportUserData, deleteUserData } from '../api';

/**
 * PrivacyPage Component (FEAT-G4, Section 20, FR-ST-01, FR-ST-02, FR-ST-03)
 *
 * Plain-language data transparency, instant JSON export, and permanent 1-click delete.
 */
export default function PrivacyPage() {
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchManifest() {
      try {
        const data = await getPrivacyManifest();
        setManifest(data);
      } catch (e) {
        console.warn('Failed to load privacy manifest', e);
      } finally {
        setLoading(false);
      }
    }
    fetchManifest();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setStatusMessage(null);
    try {
      const data = await exportUserData('demo_student');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `spoonsense_archive_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatusMessage({ type: 'success', text: 'Data archive downloaded successfully.' });
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'Could not export data archive right now.' });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteUserData('demo_student');
      setShowDeleteModal(false);
      localStorage.clear();
      sessionStorage.clear();
      setStatusMessage({ type: 'success', text: 'All your data has been permanently deleted.' });
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'Error during data deletion.' });
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-200 p-6 sm:p-10">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-white/5 hover:bg-white/5 text-xs text-slate-300 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            PRD Section 20 Compliant
          </span>
        </div>

        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Privacy, Ethics & Data Transparency</h1>
              <p className="text-sm text-slate-400">
                You own your capacity data. Plain words, zero clinical surveillance, and immediate control.
              </p>
            </div>
          </div>
        </header>

        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Core Ethical Commitments */}
        <section className="bg-slate-900/40 border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Lock className="text-violet-400 w-4 h-4" />
            Our Ethical Commitments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed text-slate-300">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="font-semibold text-white">Capacity, Not Diagnosis</span>
              <p className="text-slate-400">We track proxies for energy and daily load, never clinical disorders or diagnostic labels.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="font-semibold text-white">Zero Institutional Visibility</span>
              <p className="text-slate-400">Neither your professors, college administration, nor parents can ever see your spoons.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="font-semibold text-white">No Passive Screen Spying</span>
              <p className="text-slate-400">Zero keystroke logging, zero background screenshots, and zero camera/audio streaming.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="font-semibold text-white">Everything Reversible</span>
              <p className="text-slate-400">You can inspect every equation in the Why Panel, override any calculation, and delete all records.</p>
            </div>
          </div>
        </section>

        {/* Data Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* What We Collect */}
          <section className="bg-slate-900/40 border border-white/[0.06] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="text-emerald-400 w-4 h-4" />
              What We Collect (In Plain Words)
            </h2>
            <div className="space-y-3">
              {(manifest?.what_we_collect || [
                { category: 'Timetable & Campus Hours', items: ['Class times', 'Course names'], purpose: 'Calculates daily campus load.' },
                { category: 'Commute Details', items: ['Minutes traveled', 'Crowding mode'], purpose: 'Subtracts transit toll.' },
                { category: 'Tasks & Deadlines', items: ['Task titles', 'Estimated minutes'], purpose: 'Sizes daily focus blocks.' },
                { category: '20s Pulse Game Summaries', items: ['Median reaction time', 'Variability'], purpose: 'Modulates live spoons without raw taps.' },
                { category: 'Evening Check-In & Garden', items: ['1-tap battery score', 'Days tended'], purpose: 'Calibrates carryover fatigue.' },
              ]).map((c, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                  <div className="flex items-center justify-between font-medium text-white mb-1">
                    <span>{c.category}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Local + Encrypted Cloud</span>
                  </div>
                  <p className="text-slate-400 mb-1">{c.purpose}</p>
                  <p className="text-[11px] text-slate-500">Collected: {c.items.join(', ')}</p>
                </div>
              ))}
            </div>
          </section>

          {/* What We Never Collect */}
          <section className="bg-slate-900/40 border border-white/[0.06] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Ban className="text-rose-400 w-4 h-4" />
              What We NEVER Collect
            </h2>
            <ul className="space-y-3">
              {(manifest?.what_we_never_collect || [
                'Keystrokes, typing cadence, or clipboard text',
                'Screen captures, active window titles, or browser tabs',
                'GPS location history or real-time geolocation tracking',
                'Contacts, personal messages, or social media access',
                'Raw microphone audio or webcam video streams',
                'Medical, psychiatric, or diagnostic health records',
              ]).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/5 border border-rose-500/15 text-xs text-rose-200/90">
                  <EyeOff className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Data Actions: Export and Delete */}
        <section className="bg-slate-900/40 border border-white/[0.06] rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <HardDrive className="text-sky-400 w-4 h-4" />
              Your Data Rights & Portability
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Download your complete cognitive capacity record or delete your account with zero friction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export Card */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  1-Click Data Export
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Downloads a complete JSON bundle of your timetable, tasks, garden progress, and game summaries.
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Download size={14} />
                {exporting ? 'Preparing Archive...' : 'Export JSON Archive'}
              </button>
            </div>

            {/* Permanent Delete Card */}
            <div className="p-4 rounded-xl bg-rose-500/[0.03] border border-rose-500/20 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-rose-300 flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  1-Click Account Purge
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Instantly purges all your records from the server and wipes browser storage.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
              >
                <Trash2 size={14} />
                Delete All My Data
              </button>
            </div>
          </div>
        </section>

        {/* Deletion Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0f1422] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
              >
                <div className="flex items-center gap-3 text-rose-400">
                  <AlertTriangle size={24} />
                  <h3 className="text-base font-bold text-white">Permanently Delete All Data?</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  This action will permanently wipe your timetable, commute profile, garden XP, tasks, and game baseline
                  from server storage. This cannot be undone.
                </p>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Yes, Delete Permanently'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
