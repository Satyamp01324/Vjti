import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Copy, Check, Sparkles, Send } from 'lucide-react';
import { generateExtensionEmail } from '../api';

/**
 * ExtensionEmailModal Component (FEAT-C4)
 *
 * Generates polite, professional extension request emails.
 * Ethical Guardrail: Strictly frames around academic workload and quality.
 * Never includes clinical diagnoses or trauma disclosures.
 */
export default function ExtensionEmailModal({
  isOpen,
  onClose,
  initialData = {},
  userName = 'Student',
}) {
  const [courseName, setCourseName] = useState(initialData.course_name || 'Database Systems (CS301)');
  const [assignmentTitle, setAssignmentTitle] = useState(initialData.assignment_title || initialData.title || 'Assignment 1');
  const [professorName, setProfessorName] = useState(initialData.professor_name || 'Professor');
  const [originalDate, setOriginalDate] = useState(initialData.due_date || new Date().toISOString().split('T')[0]);
  const [proposedDate, setProposedDate] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [reasonContext, setReasonContext] = useState('');
  const [emailDraft, setEmailDraft] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    setIsGenerating(true);
    try {
      const res = await generateExtensionEmail({
        student_name: userName || 'Student',
        course_name: courseName,
        assignment_title: assignmentTitle,
        original_due_date: originalDate,
        proposed_new_date: proposedDate,
        professor_name: professorName,
        reason_context: reasonContext,
      });
      if (res && res.email) {
        setEmailDraft(res.email);
      }
    } catch (err) {
      console.error('Failed to generate extension email:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!emailDraft?.body) return;
    navigator.clipboard.writeText(`Subject: ${emailDraft.subject}\n\n${emailDraft.body}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenMail = () => {
    if (!emailDraft?.body) return;
    const subject = encodeURIComponent(emailDraft.subject);
    const body = encodeURIComponent(emailDraft.body);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/30">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Extension Email Drafter</h3>
                <p className="text-xs text-slate-400">
                  Polite & academically framed. Zero guilt, zero clinical disclosures.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!emailDraft ? (
            /* Input Form */
            <form onSubmit={handleGenerate} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    required
                    placeholder="e.g. CS301 Database Systems"
                    className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Assignment Title
                  </label>
                  <input
                    type="text"
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    required
                    placeholder="e.g. Lab 3 ER Diagram"
                    className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Professor / TA Name
                  </label>
                  <input
                    type="text"
                    value={professorName}
                    onChange={(e) => setProfessorName(e.target.value)}
                    required
                    placeholder="e.g. Prof. Rao"
                    className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Current Due Date
                  </label>
                  <input
                    type="date"
                    value={originalDate}
                    onChange={(e) => setOriginalDate(e.target.value)}
                    required
                    className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Proposed New Date
                  </label>
                  <input
                    type="date"
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    required
                    className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Optional Academic Context
                </label>
                <input
                  type="text"
                  value={reasonContext}
                  onChange={(e) => setReasonContext(e.target.value)}
                  placeholder="e.g. multiple exam commitments this week"
                  className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Framed around academic thoroughness. We never include medical diagnoses.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-md shadow-violet-600/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGenerating ? 'Generating...' : 'Generate Polite Draft'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Draft Preview */
            <div className="mt-5 space-y-4">
              <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-xs text-violet-300">
                <span className="font-semibold block text-white mb-0.5">Subject:</span>
                {emailDraft.subject}
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Editable Email Body
                </label>
                <textarea
                  value={emailDraft.body}
                  onChange={(e) => setEmailDraft({ ...emailDraft, body: e.target.value })}
                  rows={10}
                  className="w-full bg-slate-800/80 border border-white/10 rounded-2xl p-4 text-sm text-slate-200 font-sans focus:outline-none focus:border-violet-500 leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEmailDraft(null)}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Edit Inputs
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied!' : 'Copy to Clipboard'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenMail}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-md shadow-violet-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Open in Mail</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
