import React, { useState } from 'react';
import { X, User, Settings, Key, Sliders, Save, Shield, Sparkles, Headphones, ChevronDown, ExternalLink, LogIn, LogOut, Database, RefreshCw, Cloud, MapPin, Navigation } from 'lucide-react';
import { UserSettings, GeminiModel } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { SupabaseService, getSupabase } from '../services/supabaseService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenLocationModal?: () => void;
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
  isSyncing,
  lastSynced
}) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>({ ...settings });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-backdrop flex items-center justify-center p-4 z-50" 
          onClick={onClose}
        >
          <motion.div 
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
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-[var(--color-border)]">
                    {localSettings.photoURL ? (
                      <img src={localSettings.photoURL || undefined} alt="User" className="w-12 h-12 rounded-full border-2 border-[var(--color-primary)]" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
                        <User size={24} />
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold text-gray-800 truncate">{localSettings.username}</p>
                      <p className="text-xs text-gray-500 truncate">{localSettings.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onSave(localSettings)}
                      disabled={isSyncing}
                      className="flex-1 py-2.5 px-4 rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)] text-xs font-bold hover:bg-[var(--color-primary)] hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                      {isSyncing ? 'جاري المزامنة...' : 'مزامنة الآن'}
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
                      className="py-2.5 px-4 rounded-2xl border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut size={14} />
                      خروج
                    </button>
                  </div>
                  <p className="text-[10px] text-center text-gray-400">بياناتك وإعداداتك تتم مزامنتها تلقائياً مع حسابك.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-gray-600 leading-relaxed">قم بتسجيل الدخول لمزامنة إعداداتك، محفوظاتك، وتاريخ محادثاتك عبر جميع أجهزتك.</p>
                  <button 
                    onClick={async () => {
                      if (isLoggingIn) return;
                      setIsLoggingIn(true);
                      try {
                        await SupabaseService.signInWithGoogle();
                        // The page will redirect, so we don't necessarily need to set isLoggingIn(false) here
                        // but it's good practice in case it returns without redirecting
                      } catch (err: any) {
                        console.error(err);
                        onShowToast(err.message || 'فشل تسجيل الدخول باستخدام Google', 'error');
                        setIsLoggingIn(false);
                      }
                    }}
                    disabled={isLoggingIn}
                    className="w-full py-3.5 px-4 rounded-2xl bg-white border border-[var(--color-border)] text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoggingIn ? (
                      <RefreshCw size={18} className="animate-spin text-[var(--color-primary)]" />
                    ) : (
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    )}
                    {isLoggingIn ? 'جاري التحويل...' : 'تسجيل الدخول باستخدام Google'}
                  </button>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-100"></div>
                    <span className="flex-shrink mx-4 text-[10px] text-gray-400 font-bold uppercase">أو أدخل حسابك يدوياً</span>
                    <div className="flex-grow border-t border-gray-100"></div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">البريد الإلكتروني (اختياري)</label>
                    <input 
                      type="email" 
                      value={localSettings.email || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, email: e.target.value })}
                      className="w-full bg-gray-50/50 border border-[var(--color-border)] rounded-2xl py-3 px-4 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] focus:outline-none transition-all shadow-inner"
                      placeholder="example@email.com"
                    />
                    <p className="text-[9px] text-gray-400 leading-relaxed">
                      إدخال بريدك يدوياً يساعدنا في التعرف على حسابك وتخصيص تجربتك بشكل أفضل.
                    </p>
                  </div>
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

            {/* Location & Prayer Times Section */}
            <section className="bg-white rounded-3xl p-6 border border-[var(--color-border)] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-2 h-full bg-[var(--color-primary)] opacity-20 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-3">
                  <div className="p-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-xl shadow-sm">
                    <MapPin size={18} />
                  </div>
                  الموقع الجغرافي ومواقيت الصلاة
                </h3>

                {onOpenLocationModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenLocationModal();
                      onClose();
                    }}
                    className="text-xs font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] px-3 py-1.5 rounded-xl bg-[var(--color-primary-light)]/50 hover:bg-[var(--color-primary-light)] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Navigation size={13} />
                    <span>تغيير / تحديد مدينتي</span>
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gray-50/70 border border-[var(--color-border)] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block">الموقع الحالي المضبوط</span>
                    <h4 className="text-sm font-bold text-gray-800 mt-0.5">
                      {localSettings.location?.name || 'مكة المكرمة، السعودية (افتراضي)'}
                    </h4>
                    {localSettings.location && (
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                        {localSettings.location.latitude.toFixed(4)}° N, {localSettings.location.longitude.toFixed(4)}° E
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                    مضبوط ونشط
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">طريقة حساب مواقيت الصلاة</label>
                  <div className="relative group/select">
                    <select
                      value={localSettings.adhanSettings?.calculationMethod || 'UmmAlQura'}
                      onChange={(e) => {
                        const newMethod = e.target.value;
                        setLocalSettings({
                          ...localSettings,
                          adhanSettings: {
                            ...(localSettings.adhanSettings || {
                              enabled: true,
                              muezzin: 'mishary',
                              fajrEnabled: true,
                              dhuhrEnabled: true,
                              asrEnabled: true,
                              maghribEnabled: true,
                              ishaEnabled: true,
                              volume: 0.8
                            }),
                            calculationMethod: newMethod
                          }
                        });
                      }}
                      className="w-full bg-gray-50/50 border border-[var(--color-border)] rounded-2xl py-3.5 pl-10 pr-12 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] focus:outline-none transition-all shadow-inner appearance-none cursor-pointer text-gray-800"
                    >
                      <option value="UmmAlQura">🕋 أم القرى (مكة المكرمة - السعودية، الخليج، اليمن)</option>
                      <option value="Egyptian">🇪🇬 الهيئة المصرية العامة للمساحة (مصر، إفريقيا، الشام)</option>
                      <option value="MuslimWorldLeague">🌐 رابطة العالم الإسلامي (أوروبا، الشرق الأقصى، أجزاء من أمريكا)</option>
                      <option value="Dubai">🇦🇪 دائرة الشؤون الإسلامية بدبي (الإمارات)</option>
                      <option value="Karachi">🇵🇰 جامعة العلوم الإسلامية بكراتشي (باكستان، الهند، بنغلاديش)</option>
                      <option value="NorthAmerica">🇺🇸 الجمعية الإسلامية لأمريكا الشمالية (ISNA)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 group-hover/select:text-[var(--color-primary)] transition-colors">
                      <Sliders size={18} />
                    </div>
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                    تُحدد زوايا الفجر والعشاء ودقة مواعيد الصلاة بحسب الهيئة الفقهية المعتمدة في إقليمك.
                  </p>
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
                      value={localSettings.model || (localSettings.isLoggedIn ? 'gemini-3.6-flash' : 'gemini-3.5-flash')}
                      onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value as GeminiModel })}
                      className="w-full bg-gray-50/50 border border-[var(--color-border)] rounded-2xl py-3.5 pl-10 pr-12 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] focus:outline-none transition-all shadow-inner appearance-none cursor-pointer text-gray-800"
                    >
                      <option value="gemini-3.6-flash">✨ Gemini 3.6 Flash Ultra (الأحدث والأقوى - الجيل 3.6 الفائق دقة وسرعة)</option>
                      <option value="gemini-3.1-pro-preview">🔬 Gemini 3.1 Pro Advanced (العقل المفكر - للتنقيب والتدبر الاستراتيجي والبلاغي العميق)</option>
                      <option value="gemini-1.5-pro">🧠 Gemini 1.5 Pro (Long-Context - نطاق سياقي عميق 2M للبحث الشامل في كامل القرآن والتفاسير)</option>
                      <option value="gemini-2.5-pro">🏛️ Gemini 2.5 Pro (النموذج الأكاديمي والعمق التفسيري والفقهي المتقدم)</option>
                      <option value="gemini-3.5-flash">⚡ Gemini 3.5 Flash (فائق السرعة والاستقرار - الافتراضي لجميع المستخدمين والزوار)</option>
                      <option value="gemini-2.5-flash">🚀 Gemini 2.5 Flash (سرعة خفيفة واستجابة فورية متوازنة)</option>
                      <option value="gemini-3-flash-preview">🎯 Gemini 3 Flash (الجيل الثالث - متوازن وسريع)</option>
                      <option value="gemini-3.1-flash-lite">🕊️ Gemini 3.1 Flash Lite (الخفيف والأسرع - للردود اللحظية المبسطة)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 group-hover/select:text-[var(--color-primary)] transition-colors">
                      <Sliders size={18} />
                    </div>
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  {!localSettings.isLoggedIn ? (
                    <p className="text-[10px] text-amber-700 font-bold mt-2 leading-relaxed bg-amber-50/50 p-3 rounded-2xl border border-amber-100 flex items-center gap-2">
                      <Sparkles size={14} className="shrink-0 text-amber-600 animate-pulse" />
                      <span>أنت تستخدم التطبيق كزائر. تم تفعيل النموذج الافتراضي <b>Gemini 3.5 Flash</b> (فائق السرعة والاستقرار)، ويمكنك تجربة ومعاينة أي نموذج آخر من القائمة بحرية!</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-emerald-800 font-bold mt-2 leading-relaxed bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 flex items-center gap-2">
                      <Sparkles size={14} className="shrink-0 text-emerald-600" />
                      <span>بصفتك مستخدماً مسجلاً، تم تفعيل النموذج الأحدث والأقوى <b>Gemini 3.6 Flash</b> افتراضياً مع كامل الحرية للتغيير بين النماذج!</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">نمط الإجابة والتحليل الروحاني</label>
                  <div className="relative group/select">
                    <select 
                      value={localSettings.analysisStyle || 'balanced'}
                      onChange={(e) => setLocalSettings({ ...localSettings, analysisStyle: e.target.value })}
                      className="w-full bg-gray-50/50 border border-[var(--color-border)] rounded-2xl py-3.5 pl-10 pr-12 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] focus:outline-none transition-all shadow-inner appearance-none cursor-pointer text-gray-800"
                    >
                      <option value="balanced">🌟 النمط المتوازن (روحي وتفسيري مبسط - الافتراضي)</option>
                      <option value="detailed">📖 النمط التفسيري المفصل والعميق (أسباب النزول، السياق ومعاني الكلمات تفصيلاً)</option>
                      <option value="smart_summary">💡 النمط التلخيصي العبقري والذكي (رؤوس أقلام، خلاصة مكثفة ومباشرة تصيب لب الموضوع)</option>
                      <option value="spiritual">🤍 النمط الإيماني والوجداني (بلسم ومواساة للقلب، علاج الأحزان بالقلق والسكينة)</option>
                      <option value="scientific">🧠 النمط العقلاني والعلمي المنهجي (البراهين المنطقية، الاستنباطات الفكرية والإعجاز اللغوي)</option>
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
                        <option value="ar.faresabbad">فارس عباد</option>
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

            {/* Security Section */}
            <section className="bg-white rounded-3xl p-6 border border-[var(--color-border)] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-2 h-full bg-[var(--color-primary)] opacity-20 group-hover:opacity-100 transition-opacity"></div>
              <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-3">
                <div className="p-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-xl shadow-sm">
                  <Shield size={18} />
                </div>
                الأمان والخصوصية
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-gray-600">مفتاح API الخاص (اختياري)</label>
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] underline flex items-center gap-1"
                    >
                      الحصول على مفتاح
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  <div className="relative group/input">
                    <input 
                      type="password" 
                      value={localSettings.apiKey || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
                      className="w-full bg-gray-50/50 border border-[var(--color-border)] rounded-2xl py-3.5 pl-4 pr-12 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] focus:outline-none transition-all shadow-inner"
                      placeholder="أدخل مفتاح Gemini الخاص بك (اختياري)..."
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 group-hover/input:text-[var(--color-primary)] transition-colors">
                      <Key size={18} />
                    </div>
                  </div>

                  {/* API Key Active Status Indicator Badge */}
                  {localSettings.apiKey && localSettings.apiKey.trim().length > 0 ? (
                    <div className="mt-3 flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <div>
                        <p className="font-bold">🔑 مفتاحك الخاص مفعّل حالياً (نشط)</p>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          يستخدم النظام مفتاحك الشخصي مباشرة لتنفيذ الاستفسارات بأقصى سرعة وبدون مشاركة حدود النظام.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-800 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0"></span>
                      <div>
                        <p className="font-bold">⚡ يتم استخدام مفتاح النظام الافتراضي</p>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          التطبيق يعمل مجاناً بالمفتاح الافتراضي. يمكنك إضافة مفتاحك الخاص بأي وقت للحصول على حصتك المخصصة الكاملة.
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-gray-500 mt-2 leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-[var(--color-border)]">
                    يتم حفظ المفتاح بأمان ومُشفراً في متصفحك وحسابك فقط، ولا يتم الاطلاع عليه أو مشاركته مع أي طرف.
                  </p>
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
  );
};

