import React, { useState } from 'react';
import { X, User, Settings, Key, Sliders, Save, Shield, Sparkles, Headphones, ChevronDown, ExternalLink, RefreshCw, Database, Globe, CheckCircle2, AlertCircle, LogOut, ShieldCheck, BatteryCharging, BellRing, Smartphone, Flame, Layers, Crown } from 'lucide-react';
import { UserSettings, GeminiModel } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { SupabaseService, getSupabase, PUBLISHED_WEB_URL } from '../services/supabaseService';
import { AdminService, OWNER_EMAIL } from '../services/adminService';
import { BatteryOptimizationGuideModal } from './BatteryOptimizationGuideModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenLocationModal?: () => void;
  onOpenAdhanSettings?: () => void;
  onOpenOwnerAdmin?: () => void;
  isSyncing?: boolean;
  lastSynced?: number | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSave, 
  onShowToast,
  onOpenLocationModal,
  onOpenAdhanSettings,
  onOpenOwnerAdmin,
  isSyncing,
  lastSynced
}) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>({ ...settings });
  const [isLoggingInSupabase, setIsLoggingInSupabase] = useState(false);
  const [showBatteryGuide, setShowBatteryGuide] = useState(false);
  const [showDeveloperKey, setShowDeveloperKey] = useState(false);

  // Sync state when settings prop or modal visibility changes
  React.useEffect(() => {
    if (isOpen) {
      setLocalSettings({ ...settings });
    }
  }, [settings, isOpen]);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            key="settings-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop flex items-center justify-center p-4 z-50" 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
          >
            <motion.div 
              key="settings-modal-container"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="bg-[var(--color-background)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-[var(--color-border)] rounded-3xl" 
              onClick={e => e.stopPropagation()}
            >
          {/* Header */}
          <div className="relative overflow-hidden bg-[var(--color-primary-light)] p-6 border-b border-[var(--color-border)] shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[var(--color-primary)]">
                  <Settings size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">الإعدادات</h2>
                  <p className="text-xs text-gray-500 mt-0.5">تخصيص تجربتك مع أنيس القلوب</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center bg-white/50 hover:bg-white text-gray-500 hover:text-gray-800 rounded-full transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
            
            {/* Account Section */}
            <section className="bg-white rounded-3xl p-6 border border-[var(--color-border)] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-2 h-full bg-[var(--color-primary)] opacity-20 group-hover:opacity-100 transition-opacity"></div>
              <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-xl shadow-sm">
                    <User size={18} />
                  </div>
                  الحساب والمزامنة
                </div>
                {lastSynced && (
                  <span className="text-[9px] text-gray-400 font-medium">
                    آخر مزامنة: {new Date(lastSynced).toLocaleTimeString('ar-SA')}
                  </span>
                )}
              </h3>
              
              {localSettings.isLoggedIn ? (
                <div className="flex flex-col gap-4">
                  {/* User Profile Card */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50/70 via-gray-50 to-white rounded-2xl border border-[var(--color-border)] shadow-xs">
                    {localSettings.photoURL ? (
                      <img src={localSettings.photoURL || undefined} alt="User" className="w-12 h-12 rounded-full border-2 border-[var(--color-primary)] object-cover shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] shadow-sm">
                        <User size={24} />
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold text-gray-900 truncate">{localSettings.username}</p>
                      <p className="text-xs text-gray-500 truncate font-mono mt-0.5">{localSettings.email}</p>
                    </div>
                  </div>

                  {/* Owner VIP Control Panel Button (Displayed exclusively for azamfahd25@gmail.com) */}
                  {(AdminService.isOwnerEmail(localSettings.email) || localSettings.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()) && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-600/20 border-2 border-amber-400/60 shadow-md space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">👑</span>
                          <div>
                            <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                              <span>مالك التطبيق المعتمد</span>
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                                Verified Owner
                              </span>
                            </h4>
                            <p className="text-[10px] text-amber-900/80 font-semibold mt-0.5">
                              لديك كامل الصلاحيات لإرسال الإشعارات والتحكم في الإصدارات وقاعدة البيانات.
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenOwnerAdmin) {
                            onOpenOwnerAdmin();
                          }
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <Crown size={15} />
                        <span>فتح لوحة تحكم وإدارة المالك 👑</span>
                      </button>
                    </div>
                  )}

                  {/* Clean Unified Cloud Sync Status */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs font-black text-xs">
                        ☁️
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-emerald-950 truncate">المزامنة السحابية الذكية نشطة</p>
                        <p className="text-[10px] text-emerald-700 font-bold truncate">
                          حفظ سحابي تلقائي واحتياطي فوري لمحادثاتك وتفضيلاتك
                        </p>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button 
                      onClick={() => onSave(localSettings)}
                      disabled={isSyncing}
                      className="flex-1 py-3 px-4 rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)] text-xs font-bold hover:bg-[var(--color-primary)] hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                      {isSyncing ? 'جاري المزامنة...' : 'مزامنة سحابية الآن'}
                    </button>
                    <button 
                      onClick={async () => {
                        if (window.confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
                          try {
                            await SupabaseService.signOut();
                            onShowToast('تم تسجيل الخروج بنجاح', 'success');
                          } catch (err: any) {
                            console.error(err);
                            onShowToast('فشل تسجيل الخروج', 'error');
                          }
                        }
                      }}
                      className="py-3 px-5 rounded-2xl border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <LogOut size={14} />
                      خروج
                    </button>
                  </div>
                  <p className="text-[10px] text-center text-gray-400">
                    بياناتك وإعداداتك تتم مزامنتها تلقائياً مع قاعدة بيانات Supabase السحابية.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    قم بالمتابعة عبر حساب Google لحفظ ومزامنة محادثاتك وتفضيلاتك وتلاواتك سحابياً عبر جميع أجهزتك.
                  </p>

                  {/* UNIFIED GOOGLE LOGIN VIA SUPABASE */}
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-white border-2 border-emerald-500/40 shadow-xs space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                          <span>المزامنة السحابية عبر Supabase</span>
                        </span>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <span>⚡ فوري ومباشر</span>
                      </span>
                    </div>

                    <button 
                      onClick={async () => {
                        if (isLoggingInSupabase) return;
                        setIsLoggingInSupabase(true);
                        try {
                          await SupabaseService.signInWithGoogle();
                          onShowToast('جاري الاتصال والمصادقة مع Google عبر Supabase...', 'info');
                        } catch (err: any) {
                          console.error(err);
                          onShowToast(err.message || 'فشل الاتصال بـ Google', 'error');
                        } finally {
                          setIsLoggingInSupabase(false);
                        }
                      }}
                      disabled={isLoggingInSupabase}
                      className="w-full py-3.5 px-4 rounded-2xl bg-white border border-emerald-300 text-gray-800 text-sm font-black hover:bg-emerald-50/50 hover:border-emerald-400 hover:shadow-md transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isLoggingInSupabase ? (
                        <RefreshCw size={18} className="animate-spin text-emerald-600" />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      )}
                      <span>
                        {isLoggingInSupabase ? 'جاري الاتصال والمزامنة...' : 'المتابعة الفورية بحساب Google'}
                      </span>
                    </button>

                    <p className="text-[10px] text-emerald-800/90 leading-relaxed font-medium text-center">
                      ⚡ مصادقة فورية ومباشرة ترتبط مع قاعدة بيانات Supabase السحابية لحفظ ومزامنة محادثاتك وتفضيلاتك ومحفوظاتك.
                    </p>
                  </div>

                  {/* Direct Link to published site for Web Sync */}
                  <a
                    href={PUBLISHED_WEB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Globe size={14} className="text-emerald-600" />
                    <span>الموقع الرسمي: qurankrim20.netlify.app</span>
                    <ExternalLink size={12} className="opacity-70" />
                  </a>
                </div>
              )}
            </section>


            {/* Profile Section */}
            <section className="bg-white rounded-3xl p-6 border border-[var(--color-border)] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-2 h-full bg-[var(--color-primary)] opacity-20 group-hover:opacity-100 transition-opacity"></div>
              <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-3">
                <div className="p-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-xl shadow-sm">
                  <User size={18} />
                </div>
                الملف الشخصي
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">الاسم</label>
                  <input 
                    type="text" 
                    value={localSettings.username}
                    onChange={(e) => setLocalSettings({ ...localSettings, username: e.target.value })}
                    className="w-full bg-gray-50/50 border border-[var(--color-border)] rounded-2xl py-3.5 px-4 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] focus:outline-none transition-all shadow-inner"
                    placeholder="أدخل اسمك..."
                  />
                </div>
              </div>
            </section>

            {/* AI Configuration Section */}
            <section className="bg-white rounded-3xl p-6 border border-[var(--color-border)] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-2 h-full bg-[var(--color-primary)] opacity-20 group-hover:opacity-100 transition-opacity"></div>
              <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-3">
                <div className="p-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-xl shadow-sm">
                  <Sparkles size={18} />
                </div>
                الذكاء الاصطناعي والتلاوة
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">النموذج المستخدم (قوة الذكاء الاصطناعي)</label>
                  <div className="relative group/select">
                    <select 
                      value={localSettings.model || 'gemini-3.6-flash'}
                      onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value as GeminiModel })}
                      className="w-full bg-gray-50/50 border border-[var(--color-border)] rounded-2xl py-3.5 pl-10 pr-12 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] focus:outline-none transition-all shadow-inner appearance-none cursor-pointer text-gray-800"
                    >
                      <option value="gemini-3.8-flash">🚀 Gemini 3.8 Flash Next-Gen (الجيل الجديد - فائق السرعة والذكاء الفائق)</option>
                      <option value="gemini-3.7-flash">⚡ Gemini 3.7 Flash Advanced (الجيل المتقدم - توازن استثنائي في التدبر والسرعة)</option>
                      <option value="gemini-3.6-flash">✨ Gemini 3.6 Flash Ultra (الأحدث والأسرع - الافتراضي المستقر)</option>
                      <option value="gemini-3.1-pro-preview">🔬 Gemini 3.1 Pro Advanced (العقل المفكر - للتحليل والتدبر البلاغي العميق)</option>
                      <option value="gemini-3.5-flash">⚡ Gemini 3.5 Flash (فائق الاستقرار والسرعة اللحظية)</option>
                      <option value="gemini-3.1-flash-lite">🕊️ Gemini 3.1 Flash Lite (الخفيف والسريع - للردود الموجزة المبسطة)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 group-hover/select:text-[var(--color-primary)] transition-colors">
                      <Sliders size={18} />
                    </div>
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">نمط الإجابة والتحليل الروحاني</label>
                  <div className="relative group/select">
                    <select 
                      value={localSettings.analysisStyle || 'smart_adaptive'}
                      onChange={(e) => setLocalSettings({ ...localSettings, analysisStyle: e.target.value })}
                      className="w-full bg-gray-50/50 border border-[var(--color-border)] rounded-2xl py-3.5 pl-10 pr-12 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] focus:outline-none transition-all shadow-inner appearance-none cursor-pointer text-gray-800 font-medium"
                    >
                      <option value="smart_adaptive">🤖 نمط التكيف الذكي الأوتوماتيكي (تحليل السؤال تلقائياً واختيار النمط الأكثر ملاءمة - الافتراضي الذكي)</option>
                      <option value="smart_summary">💡 النمط التلخيصي العبقري (رؤوس أقلام، خلاصة مكثفة ومباشرة تصيب لب الموضوع)</option>
                      <option value="tadabbur">💎 نمط التدبر (استخراج الحكم والمواعظ والدروس الإيمانية العميقة)</option>
                      <option value="practical_life">🌿 نمط الربط بالواقع (تقديم أمثلة وسيناريوهات وتجارب واقعية لتطبيق القرآن بالحياة)</option>
                      <option value="spiritual">🤍 النمط الإيماني والوجداني (بلسم ومواساة للقلب، علاج الأحزان بالسكينة والرجاء)</option>
                      <option value="scientific">🧠 النمط العقلاني والعلمي المنهجي (البراهين المنطقية، الاستنباطات الفكرية والإعجاز اللغوي)</option>
                      <option value="detailed">📖 النمط التفسيري المفصل والعميق (أسباب النزول، السياق ومعاني الكلمات تفصيلاً)</option>
                      <option value="balanced">🌟 النمط المتوازن (روحي وتفسيري مبسط)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 group-hover/select:text-[var(--color-primary)] transition-colors">
                      <Sparkles size={18} />
                    </div>
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">تتحكم هذه الميزة في نبرة المساعد وعمق شرحه للآيات القرآنية بما يتناسب مع حالتك الروحية والفكرية.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">القارئ المفضل</label>
                  <div className="relative group/select">
                    <select 
                      value={localSettings.reciter || 'ar.faresabbad'}
                      onChange={(e) => setLocalSettings({ ...localSettings, reciter: e.target.value })}
                      className="w-full bg-gray-50/50 border border-[var(--color-border)] rounded-2xl py-3.5 pl-10 pr-12 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] focus:outline-none transition-all shadow-inner appearance-none cursor-pointer"
                    >
                      <optgroup label="⭐ الأكثر شعبية واستماعاً" className="font-bold text-gray-800">
                        <option value="ar.faresabbad">فارس عباد</option>
                        <option value="ar.alafasy">مشاري راشد العفاسي</option>
                        <option value="ar.yasseraldosari">ياسر الدوسري</option>
                        <option value="ar.maheralmuaiqly">ماهر المعيقلي</option>
                        <option value="ar.saadghamidi">سعد الغامدي</option>
                      </optgroup>
                      
                      <optgroup label="📖 مدارس التلاوة الكلاسيكية والمجودين" className="font-bold text-gray-800">
                        <option value="ar.minshawi">محمد صديق المنشاوي (مرتل)</option>
                        <option value="ar.minshawimujawwad">محمد صديق المنشاوي (مجود)</option>
                        <option value="ar.abdulsamad">عبد الباسط عبد الصمد (مرتل)</option>
                        <option value="ar.abdulbasitmujawwad">عبد الباسط عبد الصمد (مجود)</option>
                        <option value="ar.husary">محمود خليل الحصري (مرتل)</option>
                        <option value="ar.husarymujawwad">محمود خليل الحصري (مجود)</option>
                        <option value="ar.husarymuallim">محمود خليل الحصري (المعلم)</option>
                        <option value="ar.mustafaismail">مصطفى إسماعيل</option>
                      </optgroup>
                      
                      <optgroup label="🕋 أئمة الحرمين الشريفين" className="font-bold text-gray-800">
                        <option value="ar.as-sudais">عبد الرحمن السديس</option>
                        <option value="ar.shuraym">سعود الشريم</option>
                        <option value="ar.hudhaify">علي عبد الرحمن الحذيفي</option>
                        <option value="ar.ayyoub">محمد أيوب</option>
                      </optgroup>
                      
                      <optgroup label="🎙️ نخبة من قراء العالم الإسلامي" className="font-bold text-gray-800">
                        <option value="ar.ahmedajamy">أحمد بن علي العجمي</option>
                        <option value="ar.shaatree">أبو بكر الشاطري</option>
                        <option value="ar.hanirifai">هاني الرفاعي</option>
                      </optgroup>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 group-hover/select:text-[var(--color-primary)] transition-colors">
                      <Headphones size={18} />
                    </div>
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                <div className="pt-2 bg-gray-50/50 p-4 rounded-2xl border border-[var(--color-border)]">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-bold text-gray-700">مستوى الإبداع في التفسير</label>
                    <span className="px-3 py-1 bg-white border border-[var(--color-border)] rounded-xl text-xs font-mono font-bold text-[var(--color-primary)] shadow-sm">
                      {localSettings.creativityLevel}
                    </span>
                  </div>
                  <div className="relative pt-1">
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1"
                      value={localSettings.creativityLevel}
                      onChange={(e) => setLocalSettings({ ...localSettings, creativityLevel: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)] hover:accent-[var(--color-primary-dark)] transition-all"
                      style={{
                        background: `linear-gradient(to right, #B8860B 0%, #B8860B ${localSettings.creativityLevel * 100}%, #e5e7eb ${localSettings.creativityLevel * 100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 mt-3 font-bold px-1">
                    <span>دقيق ومباشر</span>
                    <span>إبداعي وعميق</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Cloud AI & Security Section */}
            <section className="bg-white rounded-3xl p-6 border border-[var(--color-border)] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-2 h-full bg-[var(--color-primary)] opacity-20 group-hover:opacity-100 transition-opacity"></div>
              <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-xl shadow-sm">
                    <Sparkles size={18} />
                  </div>
                  الذكاء الاصطناعي والحصة السحابية
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200/80 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {localSettings.isLoggedIn ? "حصة حساب Google نشطة" : "الحصة المدمجة نشطة"}
                </span>
              </h3>

              <div className="space-y-4">
                {localSettings.isLoggedIn ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
                        <CheckCircle2 size={22} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-emerald-900 truncate">
                          حسابك متصل بالحصة السحابية المتقدمة تلقائياً
                        </p>
                        <p className="text-[11px] text-emerald-700 mt-0.5 truncate">
                          {localSettings.email || "حساب Google موثق"} • أولوية معالجة فورية
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-emerald-800/90 leading-relaxed bg-white/80 p-3 rounded-xl border border-emerald-100">
                      ⚡ تعمل جميع استفسارات التفسير والتدبر والبحث القرآني تلقائياً عبر حصة حسابك السحابية دون الحاجة لإدخال أي مفاتيح يدوية أو خطوات معقدة كأحدث التطبيقات العالمية.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-[var(--color-border)] space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[var(--color-primary)] border border-gray-100 shrink-0">
                        <ShieldCheck size={22} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">
                          نظام سحابي تلقائي بالكامل (مفعّل مجاناً)
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          يعمل التطبيق مباشرة بدون أي إعدادات يدوية أو مفاتيح
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed bg-white p-3 rounded-xl border border-gray-100">
                      بمجرد المتابعة وتسجيل الدخول بحساب Google، يتم ربط وتخصيص الحصة السحابية لحسابك تلقائياً لحفظ محادثاتك وتلاواتك واستخدامها من أي جهاز.
                    </p>
                  </div>
                )}

                {/* Optional Developer Advanced Toggle */}
                <div className="pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowDeveloperKey(!showDeveloperKey)}
                    className="text-[11px] text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Key size={12} />
                    <span>{showDeveloperKey ? "إخفاء إعدادات المطورين" : "إعدادات متقدمة (خاصة بالمطورين فقط)"}</span>
                  </button>

                  {showDeveloperKey && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-right animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold text-gray-600">
                          مفتاح مخصص إضافي (اختياري للمطورين فقط)
                        </label>
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <span>جلب المفتاح من الموقع</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                      <input 
                        type="password" 
                        value={localSettings.apiKey || ''}
                        onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-none"
                        placeholder="اختياري: اتركه فارغاً للاستخدام التلقائي الموصى به..."
                        dir="ltr"
                      />
                      <p className="text-[10px] text-gray-400">
                        افتراضياً يُترك هذا الحقل فارغاً حيث يعتمد التطبيق على الحصة السحابية التلقائية لحسابك.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-[var(--color-border)] bg-gray-50/50 flex flex-col gap-4 shrink-0">
            <div className="flex gap-3">
              <button 
                onClick={handleSave}
                className="flex-1 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Save size={18} />
                حفظ التغييرات
              </button>
              <button 
                onClick={onClose} 
                className="px-6 py-3.5 bg-white border border-[var(--color-border)] rounded-2xl font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all"
              >
                إلغاء
              </button>
            </div>
            <div className="text-center space-y-0.5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                أنيس القلوب - الإصدار 1.1.0
              </p>
              <p className="text-[10px] text-[#043d2e]/60 font-black">
                إعداد: المهندس/ عزام فهد
              </p>
            </div>
          </div>
        </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <BatteryOptimizationGuideModal
        key="settings-battery-guide-modal"
        isOpen={showBatteryGuide}
        onClose={() => setShowBatteryGuide(false)}
        onShowToast={onShowToast}
      />
    </>
  );
};
