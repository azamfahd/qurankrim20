import React, { useState, useEffect } from 'react';
import { X, Send, Sparkles, MessageSquare, Mail, User, Info, CheckCircle2, FileText, ArrowLeft, Heart, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserSettings } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  userInfo?: UserSettings;
}

type FeedbackType = 'idea' | 'improvement' | 'bug' | 'thank_you';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onShowToast, userInfo }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<FeedbackType>('idea');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Prefill fields if user is logged in or settings exist
  useEffect(() => {
    if (isOpen) {
      if (userInfo?.username) {
        setName(userInfo.username);
      }
      if (userInfo?.email) {
        setEmail(userInfo.email);
      }
    }
  }, [isOpen, userInfo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      onShowToast('الرجاء كتابة تفاصيل الاقتراح أولاً', 'error');
      return;
    }

    setIsLoading(true);

    // Prepare mailto link details
    const developerEmail = 'azamfahd25@gmail.com';
    const typeLabels: Record<FeedbackType, string> = {
      idea: 'فكرة أو ميزة جديدة',
      improvement: 'تحسين مقترح للبرنامج',
      bug: 'الإبلاغ عن مشكلة أو خطأ',
      thank_you: 'رسالة شكر وتقدير'
    };

    const subject = encodeURIComponent(`[أنيس القلوب] اقتراح جديد: ${typeLabels[type]}`);
    const emailBody = encodeURIComponent(
      `السلام عليكم ورحمة الله وبركاته،\n\n` +
      `أنا مستخدم لبرنامج "أنيس القلوب"، وأود مشاركة اقتراحي وتطويري للبرنامج معكم:\n\n` +
      `• الاسم: ${name || 'مستخدم مجهول'}\n` +
      `• البريد الإلكتروني للرد: ${email || 'لم يتم تحديده'}\n` +
      `• نوع الاقتراح: ${typeLabels[type]}\n\n` +
      `• تفاصيل الاقتراح:\n${message}\n\n` +
      `--- أرسل عبر قسم (لمحة على البرنامج / الاقتراحات) في أنيس القلوب ---`
    );

    const mailtoUrl = `mailto:${developerEmail}?subject=${subject}&body=${emailBody}`;

    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      onShowToast('تم تجهيز رسالة الاقتراح بنجاح!', 'success');
      
      // Attempt to open the mail client
      window.open(mailtoUrl, '_blank');
    }, 1200);
  };

  const handleReset = () => {
    setName(userInfo?.username || '');
    setEmail(userInfo?.email || '');
    setType('idea');
    setMessage('');
    setIsSubmitted(false);
  };

  const handleOpenMailDirectly = () => {
    const developerEmail = 'azamfahd25@gmail.com';
    const typeLabels: Record<FeedbackType, string> = {
      idea: 'فكرة أو ميزة جديدة',
      improvement: 'تحسين مقترح للبرنامج',
      bug: 'الإبلاغ عن مشكلة أو خطأ',
      thank_you: 'رسالة شكر وتقدير'
    };
    const subject = encodeURIComponent(`[أنيس القلوب] اقتراح جديد: ${typeLabels[type]}`);
    const emailBody = encodeURIComponent(
      `السلام عليكم ورحمة الله وبركاته،\n\n` +
      `• الاسم: ${name || 'مستخدم مجهول'}\n` +
      `• تفاصيل الاقتراح:\n${message}`
    );
    window.location.href = `mailto:${developerEmail}?subject=${subject}&body=${emailBody}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="feedback-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-backdrop flex items-center justify-center p-4 z-50 fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            id="feedback-modal-container"
            initial={{ scale: 0.95, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="bg-[#fdfbf7] w-full max-w-lg rounded-[2.5rem] p-6 md:p-8 shadow-2xl flex flex-col border border-white/20 max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div id="feedback-modal-header" className="flex justify-between items-center pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white flex items-center justify-center shadow-md">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[var(--color-primary-dark)] leading-tight">شاركنا فكرتك واقتراحك</h2>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">تواصل مباشرة مع مطور البرنامج</p>
                </div>
              </div>
              <button 
                id="feedback-close-btn"
                onClick={onClose} 
                className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors border border-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Area */}
            <div id="feedback-modal-content" className="flex-1 overflow-y-auto py-5 px-1 text-right custom-scrollbar">
              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <motion.form
                    key="feedback-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    {/* Welcome Text */}
                    <p className="text-xs text-gray-600 leading-relaxed font-semibold bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                      برأيكم نطور ونحسن <strong>أنيس القلوب</strong>. يسعد المطور جداً باستقبال اقتراحاتكم، أفكاركم، أو بلاغاتكم لحل أي عائق، والرد عليكم على بريدكم الإلكتروني في أسرع وقت.
                    </p>

                    {/* Feedback Type Selector */}
                    <div>
                      <label className="block text-xs font-black text-gray-700 mb-2">نوع المشاركة</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setType('idea')}
                          className={`p-3 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                            type === 'idea'
                              ? 'bg-[var(--color-primary-light)]/20 border-[var(--color-primary)] text-[var(--color-primary-dark)]'
                              : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Sparkles size={14} className={type === 'idea' ? 'text-[var(--color-primary)]' : 'text-gray-400'} />
                          فكرة جديدة
                        </button>
                        <button
                          type="button"
                          onClick={() => setType('improvement')}
                          className={`p-3 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                            type === 'improvement'
                              ? 'bg-[var(--color-primary-light)]/20 border-[var(--color-primary)] text-[var(--color-primary-dark)]'
                              : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <FileText size={14} className={type === 'improvement' ? 'text-[var(--color-primary)]' : 'text-gray-400'} />
                          تحسين مقترح
                        </button>
                        <button
                          type="button"
                          onClick={() => setType('bug')}
                          className={`p-3 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                            type === 'bug'
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Info size={14} className={type === 'bug' ? 'text-rose-500' : 'text-gray-400'} />
                          مشكلة تقنية
                        </button>
                        <button
                          type="button"
                          onClick={() => setType('thank_you')}
                          className={`p-3 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                            type === 'thank_you'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Heart size={14} className={type === 'thank_you' ? 'text-emerald-500' : 'text-gray-400'} />
                          كلمة شكر
                        </button>
                      </div>
                    </div>

                    {/* Auto-detected Account Alert */}
                    {(userInfo?.username || userInfo?.email) && (
                      <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-[11px] text-emerald-800 font-bold shrink-0">
                        <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                        <span>تم التعرف التلقائي على حسابك المسجّل لتسهيل الرد عليك. يمكنك تعديل البيانات أدناه إن لزم الأمر.</span>
                      </div>
                    )}

                    {/* Name Input */}
                    <div>
                      <label className="block text-xs font-black text-gray-700 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <User size={13} className="text-gray-400" />
                          الاسم الكريم <span className="text-[10px] text-gray-400 font-semibold">(اختياري)</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="مثال: محمد أحمد"
                        className="w-full border border-gray-200 rounded-2xl p-3.5 focus:border-[var(--color-primary)] focus:outline-none transition-all font-semibold text-sm bg-white"
                      />
                    </div>

                    {/* Email Input */}
                    <div>
                      <label className="block text-xs font-black text-gray-700 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Mail size={13} className="text-gray-400" />
                          البريد الإلكتروني للرد <span className="text-[10px] text-gray-400 font-semibold">(اختياري)</span>
                        </span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full border border-gray-200 rounded-2xl p-3.5 focus:border-[var(--color-primary)] focus:outline-none transition-all font-semibold text-sm bg-white"
                        dir="ltr"
                      />
                    </div>

                    {/* Suggestion Textarea */}
                    <div>
                      <label className="block text-xs font-black text-gray-700 mb-1.5">
                        تفاصيل فكرتك واقتراحك <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="اشرح هنا فكرتك، كيف تفيد البرنامج، وما الذي ترغب في تحسينه بالتفصيل..."
                        rows={4}
                        className="w-full border border-gray-200 rounded-2xl p-4 focus:border-[var(--color-primary)] focus:outline-none transition-all font-semibold text-sm bg-white resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary)]/10 hover:shadow-xl hover:shadow-[var(--color-primary)]/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Send size={16} />
                          إرسال الاقتراح للمطور
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="py-8 text-center space-y-6"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-500 shadow-inner">
                      <CheckCircle2 size={44} className="animate-bounce" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-gray-900">شكراً جزيلاً لمشاركتك!</h3>
                      <p className="text-xs text-gray-500 font-semibold max-w-sm mx-auto leading-relaxed">
                        لقد تم صياغة وتجهيز رسالتك باحترافية كاملة، وفتح صندوق البريد الإلكتروني الخاص بك ليتم إرسالها إلى المطور مباشرة على البريد:
                      </p>
                      <p className="text-sm font-black text-[var(--color-primary-dark)]" dir="ltr">
                        azamfahd25@gmail.com
                      </p>
                    </div>

                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 text-xs text-amber-800 leading-relaxed max-w-sm mx-auto">
                      <strong>ملاحظة:</strong> إذا لم يفتح تطبيق البريد لديك تلقائياً، يمكنك إرسال بريد يدوي للمطور أو الضغط على الزر أدناه لتكرار المحاولة.
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                      <button
                        onClick={handleOpenMailDirectly}
                        className="px-5 py-3 rounded-xl bg-gray-900 text-white font-black text-xs hover:bg-black transition-colors"
                      >
                        فتح تطبيق البريد مجدداً
                      </button>
                      <button
                        onClick={handleReset}
                        className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-black text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeft size={14} />
                        كتابة اقتراح آخر
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
