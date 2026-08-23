import React, { useState } from 'react';
import { 
  X, Sparkles, Brain, BookOpen, Heart, Compass, CheckCircle2, 
  ShieldCheck, Zap, Lightbulb, Star, Calendar, 
  Calculator, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback: () => void;
}

type TabType = 'overview' | 'stages' | 'tools' | 'quran';

const InteractiveCard = ({
  icon: Icon,
  iconClass,
  badge,
  badgeClass,
  title,
  shortDesc,
  fullDesc,
  borderClass = "border-amber-200/60",
  bgClass = "bg-amber-50/70",
  stepNumber,
}: any) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className={`p-3.5 sm:p-4 rounded-2xl ${bgClass} border ${borderClass} shadow-2xs space-y-2 transition-all duration-300 ${expanded ? 'shadow-md scale-[1.01]' : 'hover:border-amber-300/80'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {stepNumber && (
            <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${iconClass}`}>
              {stepNumber}
            </div>
          )}
          {!stepNumber && Icon && (
            <div className={`p-1.5 rounded-lg shadow-xs ${iconClass}`}>
              <Icon size={16} />
            </div>
          )}
          <h4 className="font-bold text-xs sm:text-sm text-gray-900">{title}</h4>
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badgeClass}`}>
            {badge}
          </span>
        )}
      </div>
      
      <div className={`${stepNumber ? 'mr-10' : ''}`}>
        <p className="text-[11px] sm:text-xs text-gray-700 leading-relaxed font-medium">
          {shortDesc}
        </p>
        
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 pb-1 border-t border-gray-300/40 mt-3">
                <p className="text-[11px] sm:text-xs text-gray-800 leading-relaxed font-medium bg-white/40 p-3 rounded-xl border border-white/60">
                  {fullDesc}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => setExpanded(!expanded)}
          className={`w-full mt-3 bg-white/60 hover:bg-white border border-gray-200/60 rounded-xl py-2 text-[10px] sm:text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${expanded ? 'text-amber-700' : 'text-[var(--color-primary-dark)]'}`}
        >
          {expanded ? (
            <>إخفاء التفاصيل <ChevronUp size={14} /></>
          ) : (
            <>اقرأ المزيد <ChevronDown size={14} /></>
          )}
        </button>
      </div>
    </div>
  );
};

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, onOpenFeedback }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview' as TabType, label: 'فكرة البرنامج وهدفه', icon: Heart, badge: 'عن أنيس القلوب' },
    { id: 'stages' as TabType, label: 'كيف يعمل النظام', icon: Brain, badge: 'كيف يجيبك؟' },
    { id: 'tools' as TabType, label: 'الأدوات والمميزات', icon: Sparkles, badge: 'حقيبة إيمانية' },
    { id: 'quran' as TabType, label: 'الأمان والدقة الشرعية', icon: BookOpen, badge: 'تفاسير معتمدة' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="about-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-backdrop flex items-center justify-center p-3 sm:p-4 z-50 fixed inset-0 bg-black/65 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            id="about-modal-container"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 240 }}
            className="bg-[#fdfbf7] w-full max-w-2xl rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col border border-white/40 max-h-[90vh] overflow-hidden text-right"
            dir="rtl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div id="about-modal-header" className="flex justify-between items-center pb-4 border-b border-amber-900/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[var(--color-gold)] via-amber-600 to-[var(--color-gold-dark)] text-slate-950 flex items-center justify-center shadow-md shrink-0">
                  <Sparkles size={22} className="text-white animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[var(--color-primary-dark)] leading-tight">دليل وشرح برنامج أنيس القلوب</h2>
                  <p className="text-[11px] sm:text-xs text-amber-800 font-bold mt-0.5">شرح بسيط وسهل لكيفية عمل البرنامج وأهم المميزات والأدوات المتاحة</p>
                </div>
              </div>
              <button 
                id="about-close-btn"
                onClick={onClose} 
                className="p-2 bg-gray-100 hover:bg-amber-100/60 rounded-xl text-gray-500 hover:text-gray-800 transition-colors border border-gray-200/80 cursor-pointer"
                title="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            {/* Smart Interactive Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-amber-950/5 rounded-2xl my-4 overflow-x-auto custom-scrollbar shrink-0 border border-amber-900/10">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[125px] py-2.5 px-3 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white shadow-md scale-[1.02]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                    }`}
                  >
                    <Icon size={14} className={isActive ? 'text-[var(--color-gold-light)]' : 'text-gray-500'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Content Body */}
            <div id="about-modal-content" className="flex-1 overflow-y-auto px-1 py-1 space-y-5 custom-scrollbar text-right">
              
              {/* TAB 1: OVERVIEW & CORE IDEA */}
              {activeTab === 'overview' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
                  {/* Hero Card */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[var(--color-gold)]/15 via-amber-50 to-[var(--color-primary)]/10 border border-[var(--color-gold)]/30 relative overflow-hidden shadow-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-gold)]/20 text-[var(--color-gold-dark)] text-[10px] font-black flex items-center gap-1">
                        <Zap size={11} className="text-[var(--color-gold-dark)]" />
                        رفيقك القرآني اليومي للتدبر والراحة النفسية
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-[var(--color-primary-dark)] mb-2 flex items-center gap-2">
                      <Heart size={18} className="text-[var(--color-gold)] fill-[var(--color-gold)]" />
                      ما هو برنامج "أنيس القلوب"؟
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-800 leading-relaxed font-medium">
                      تطبيق <strong>أنيس القلوب</strong> هو تطبيق إسلامي ذكي وشامل، صُمم ليكون رفيقك المقرّب في شتى شؤون حياتك. لا يقتصر التطبيق على الدعم النفسي والوجداني وتفريج الهموم ومشاعر القلق والحزن فحسب، بل يمتد ليكون مرجعاً تفاعلياً يجيبك على <strong>المسائل الفقهية، الاستفسارات الشرعية، والمعلومات الدينية</strong> بأسلوب ميسر وموثوق مستمد من الكتاب والسنة وأقوال العلماء المعتمدين، مما يساعدك على العبادة على بصيرة والوصول فوراً إلى الهداية القرآنية والشرعية المناسبة.
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-r-4 border-[var(--color-gold)] pr-3 mt-6 mb-3">
                    <h4 className="text-sm font-black text-[var(--color-primary-dark)]">
                      ما الذي يجعل "أنيس القلوب" مميزاً وسهلاً بالنسبة لك؟
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <InteractiveCard 
                      title="يفهم مشاعرك وأسئلتك الشرعية بكل دقة"
                      icon={Heart}
                      iconClass="bg-[var(--color-gold)] text-slate-950"
                      bgClass="bg-amber-50/70"
                      borderClass="border-amber-200/60"
                      shortDesc="تستطيع كتابة ما يجول بخاطرك بأسلوبك الخاص؛ سواء كان بوحاً بمشاعرك (حزن، قلق، حيرة) أو استفساراً عن مسألة فقهية ومعلومات دينية في الشرع."
                      fullDesc="يعتمد التطبيق على خوارزميات ذكاء اصطناعي متقدمة مخصصة لفهم اللغة العربية الدارجة والفصحى وسياقاتها المتنوعة. لست بحاجة لتعقيد كلماتك؛ اكتب ببساطة عما تشعر به أو عما تبحث عنه من أحكام فقهية، عبادات، شؤون العقيدة والمعاملات، أو التفسير والتدبر. سيقوم النظام بتحليل السؤال بذكاء وربطه بالدواء الروحي والنصوص الشرعية المناسبة بدقة بالغة."
                    />
                    
                    <InteractiveCard 
                      title="تفسير موثوق وشرعي 100%"
                      icon={ShieldCheck}
                      iconClass="bg-emerald-600 text-white"
                      bgClass="bg-emerald-50/70"
                      borderClass="border-emerald-200/60"
                      shortDesc="جميع الإجابات والآيات مدعومة بتفاسير العلماء المعتمدين (مثل ابن كثير والسعدي) لضمان الصحة والدقة الشرعية الكاملة."
                      fullDesc="لضمان أقصى درجات الأمان الديني، تم ربط النظام بقواعد بيانات تحتوي على التفاسير الإسلامية المعتمدة لدى أهل السنة والجماعة كابن كثير، الطبري، والسعدي. التطبيق لا يقوم بتأليف تفسير من تلقاء نفسه أو الاعتماد على مصادر مجهولة، بل يعرض لك تفسير الآية بأسلوب مبسط وموثوق، ليطمئن قلبك وعقلك معاً إلى صحة المعنى ومراد الله تعالى دون أدنى شك."
                    />

                    <InteractiveCard 
                      title="تطبيق عملي يومي للآيات"
                      icon={CheckCircle2}
                      iconClass="bg-sky-600 text-white"
                      bgClass="bg-sky-50/70"
                      borderClass="border-sky-200/60"
                      shortDesc="لا يكتفي بنقل الآية والتفسير فقط، بل يقدم لك خطوات سهلة ومباشرة تنفذها في حياتك لتغير شعورك للأفضل."
                      fullDesc="العلم بالشيء يكتمل بالعمل به، لذلك تم تصميم التطبيق ليأخذ بيدك خطوة بخطوة من مرحلة التأمل القرآني إلى مرحلة التنفيذ العملي. بعد أن تستلهم الحل من الآية، سيقترح عليك التطبيق خطوات واضحة ومباشرة مثل أداء ركعتين، قراءة ذكر محدد، أو اتخاذ إجراء بسيط في يومك لتشعر بالتحسن والتغيير الفوري، مما يجعل القرآن منهج حياة حقيقي لا مجرد نصوص تقرأ."
                    />
                  </div>
                </motion.div>
              )}

              {/* TAB 2: STAGES OF QUESTION PROCESSING */}
              {activeTab === 'stages' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
                  <div className="flex items-center justify-between border-r-4 border-[var(--color-gold)] pr-3">
                    <h3 className="text-sm sm:text-base font-black text-[var(--color-primary-dark)]">
                      كيف يعمل النظام: رحلة سؤالك (في ٥ خطوات سهلة)
                    </h3>
                    <span className="text-[10px] font-extrabold text-[var(--color-gold-dark)] bg-[var(--color-gold-light)] px-2.5 py-0.5 rounded-full">
                      بسيط وسلس
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed font-medium">
                    عندما تكتب في البرنامج أي سؤال أو شعور يخطر ببالك، يقوم النظام بالعمل خلف الكواليس في رحلة سريعة من ٥ خطوات ليعطيك أفضل وأدق إجابة:
                  </p>

                  <div className="space-y-3">
                    <InteractiveCard 
                      stepNumber="1"
                      iconClass="bg-blue-600"
                      bgClass="bg-white"
                      title="تحليل الكلمات وفهم الاستفسار أو الشعور بالذكاء الاصطناعي"
                      badge="الاستقبال"
                      badgeClass="bg-blue-50 text-blue-700"
                      shortDesc="يقرأ التطبيق كلماتك بعناية، ويفهم إن كنت تبحث عن فتوى أو مسألة فقهية، أو تعبر عن شعور نفسي (خوف، حزن، حيرة) أو تطلب شرحاً لآية."
                      fullDesc="تعتمد هذه المرحلة على تقنيات معالجة اللغة الطبيعية (NLP) المتقدمة لفهم سياق النص العربي بدقة. يحدد النظام مباشرة طبيعة مدخلاتك: هل هي استشارة وجدانية نفسية تبحث عن الطمأنينة؟ أم سؤال فقهي شرعي يبحث عن أحكام الصلاة، الزكاة، الطهارة والمعاملات؟ أم رغبة في استنباط معلومات دينية وتفسير؟ ليتم توجيه رسالتك فوراً للمسار المعرفي والشرعي الأنسب لها."
                    />

                    <InteractiveCard 
                      stepNumber="2"
                      iconClass="bg-teal-600"
                      bgClass="bg-white"
                      title="البحث واسترجاع الأدلة والآيات المناسبة"
                      badge="البحث"
                      badgeClass="bg-teal-50 text-teal-700"
                      shortDesc="يبحث النظام في الآيات والسور والأدلة الشرعية لاستخراج النصوص القرآنية والأحكام والقصص المرتبطة بسؤالك أو شعورك."
                      fullDesc="يعتمد النظام على محرك بحث دلالي ذكي يربط بين استفسارك (سواء كان مسألة فقهية أو شعوراً وجدانياً) وبين المعاني والمقاصد والأحكام التفصيلية للآيات القرآنية عبر المصحف كاملاً. لا يقتصر البحث على الكلمات الحرفية، بل يمتد للمغزى الفقهي والإيماني، مما يضمن تزويدك بالآيات والأدلة التي تجيب على تساؤلك الفقهي أو تلامس جراح قلبك وتزعجه في غياب الأجوبة الشافية."
                    />

                    <InteractiveCard 
                      stepNumber="3"
                      iconClass="bg-emerald-600"
                      bgClass="bg-white"
                      title="التأكد والتطابق مع كتب التفسير المعتمدة"
                      badge="التأكد الشرعي"
                      badgeClass="bg-emerald-50 text-emerald-700"
                      shortDesc="يتأكد النظام من صحة تفسير الآية من كتب العلماء الموثوقة لضمان عدم وجود أي تفسير خاطئ."
                      fullDesc="بعد اختيار الآيات، تمر عبر طبقة تحقق مطابقة لأمات كتب التفسير المعتمدة. الهدف من هذه الخطوة هو ضمان عدم إخراج الآية عن سياقها الشرعي الصحيح أو تأويلها بطريقة خاطئة. يتم مطابقة معاني الآية التي اختارها الذكاء الاصطناعي مع شروحات العلماء ليتم تقديم الإجابة بأعلى درجات الدقة والأمان الديني."
                    />

                    <InteractiveCard 
                      stepNumber="4"
                      iconClass="bg-purple-600"
                      bgClass="bg-white"
                      title="كتابة رسالة إيمانية دافئة ومريحة لقلبك"
                      badge="الرسالة"
                      badgeClass="bg-purple-50 text-purple-700"
                      shortDesc="يصوغ لك التطبيق رسالة حنونة بلغة عربية سهلة وجميلة تطمئن قلبك وتربط بين معاني الآية القرآنية وبين حالتك."
                      fullDesc="في هذه المرحلة، يتحول التطبيق إلى صديق ناصح ورفيق درب. تتم صياغة الرد بأسلوب متعاطف وحنون يربط بين واقعك وبين دلالات الآيات القرآنية المختارة. يتم استخدام لغة عربية رصينة ودافئة تلامس القلوب، لتشعر وكأن هناك من يربت على كتفك ويواسيك بكلام رب العالمين، مما يعزز من شعورك بالطمأنينة والاحتواء."
                    />

                    <InteractiveCard 
                      stepNumber="5"
                      iconClass="bg-amber-600"
                      bgClass="bg-white"
                      title="اقتراح خطوات عمل سهلة للتطبيق الفوري"
                      badge="التطبيق"
                      badgeClass="bg-amber-50 text-amber-700"
                      shortDesc="يختم النظام إجابته بـ ٣ خطوات بسيطة وعملية يمكنك القيام بها مباشرة في يومك لتشعر بالراحة."
                      fullDesc="لترسيخ الفائدة، يقوم التطبيق بإنشاء 'خطة عمل' مصغرة مخصصة لحالتك. هذه الخطة تتكون من ثلاث خطوات عملية قابلة للتنفيذ فوراً. قد تشمل توجيهاً لأداء سنة معينة، أو ترديد دعاء مأثور محدد، أو حتى نصيحة بتغيير طريقة تفكيرك تجاه المشكلة. هذا المنهج يضمن لك الانتقال السريع من حالة الضيق إلى حالة السكينة والعمل الإيجابي."
                    />
                  </div>
                </motion.div>
              )}

              {/* TAB 3: ALL TOOLS & FEATURES */}
              {activeTab === 'tools' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
                  <div className="flex items-center justify-between border-r-4 border-emerald-600 pr-3">
                    <h3 className="text-sm sm:text-base font-black text-[var(--color-primary-dark)]">
                      أدوات ومميزات تطبيق أنيس القلوب المتكاملة
                    </h3>
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      كل ما تحتاجه في مكان واحد
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed font-medium">
                    يحتوي التطبيق على مجموعة شاملة ومصممة بعناية من الأدوات والخدمات الإسلامية التي تخدمك يومياً:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InteractiveCard 
                      icon={BookOpen}
                      iconClass="bg-[var(--color-gold)] text-slate-950"
                      bgClass="bg-white"
                      title="المصحف الشريف الذكي (3D)"
                      shortDesc="قراءة القرآن بالرسم العثماني الأصيل مع إمكانية الاستماع لأشهر القراء، والتفسير الفوري، ومساعد تفاعلي للحفظ."
                      fullDesc="يقدم المصحف الذكي تجربة قراءة تفاعلية غير مسبوقة. يتميز برسم عثماني واضح وجميل يريح العين، مع توفير خيارات متعددة لتلاوة أشهر قراء العالم الإسلامي. ليس هذا فحسب، بل يتيح لك التطبيق النقر على أي آية لمعرفة تفسيرها الفوري، بالإضافة إلى أدوات متقدمة لتنظيم وردك اليومي، ومتابعة تقدمك في الحفظ، وتوفير بيئة خالية من المشتتات لتركيز أعمق وتدبر أفضل."
                    />

                    <InteractiveCard 
                      icon={Compass}
                      iconClass="bg-emerald-600 text-white"
                      bgClass="bg-white"
                      borderClass="border-emerald-200/70"
                      title="مواقيت الصلاة واتجاه القبلة"
                      shortDesc="تحديد دقيق لأوقات الصلوات الخمس بحسب موقعك الجغرافي الحقيقي، مع بوصلة تفاعلية سهلة لمعرفة اتجاه القبلة."
                      fullDesc="باستخدام أحدث تقنيات تحديد المواقع، يضمن لك التطبيق دقة متناهية في حساب أوقات الصلاة بناءً على موقعك الجغرافي الفعلي وبحسب المذاهب الفقهية المتعددة وطرق الحساب المعتمدة عالمياً. علاوة على ذلك، توفر بوصلة القبلة التفاعلية واجهة سلسة ودقيقة جداً باستخدام مستشعرات جهازك لتوجيهك نحو الكعبة المشرفة بسلاسة، حتى في الأماكن التي تزورها لأول مرة."
                    />

                    <InteractiveCard 
                      icon={Star}
                      iconClass="bg-sky-600 text-white"
                      bgClass="bg-white"
                      borderClass="border-sky-200/70"
                      title="حصن المسلم وأذكار اليوم"
                      shortDesc="أذكار الصباح والمساء، أذكار النوم والاستيقاظ، وأدعية متنوعة من الكتاب والسنة مع عداد لتسهيل التكرار."
                      fullDesc="يجمع لك هذا القسم كل ما يحتاجه المسلم لتحصين نفسه في يومه وليلته من كتاب 'حصن المسلم' الشهير. يتميز بواجهة قراءة مريحة مع عدادات تفاعلية مدمجة لتتبع عدد مرات قراءة كل ذكر. كما يوفر خاصية التذكير الذكي بالأذكار في أوقاتها المحددة، مما يساعدك على الحفاظ على هذا الورد اليومي العظيم وجعله جزءاً لا يتجزأ من روتينك بيسر وسهولة."
                    />

                    <InteractiveCard 
                      icon={Sparkles}
                      iconClass="bg-purple-600 text-white"
                      bgClass="bg-white"
                      borderClass="border-purple-200/70"
                      title="أسماء الله الحسنى وهداياتها"
                      shortDesc="عرض جميع أسماء الله الحسنى الـ 99 مع شرح معانيها الجميلة وكيفية التعبد بدعائها والتأمل فيها في حياتك."
                      fullDesc="رحلة إيمانية عميقة للتعرف على الله جل جلاله من خلال أسمائه الحسنى وصفاته العلا. لا يقتصر التطبيق على سرد الأسماء فحسب، بل يقدم لك شرحاً وافياً لكل اسم، ويوضح لك كيف تتعبد الله بهذا الاسم في حياتك اليومية (هدايات الاسم). هذا القسم مصمم ليزيد من يقينك ومحبتك لله، ويجعلك تستحضر عظمة الخالق في كل موقف تمر به."
                    />

                    <InteractiveCard 
                      icon={Calendar}
                      iconClass="bg-amber-600 text-white"
                      bgClass="bg-white"
                      title="التقويم الهجري والزراعي"
                      shortDesc="متابعة التاريخ الهجري والأيام المباركة، والمواسم المناخية والزراعية والأنواء بدقة عالية."
                      fullDesc="أداة فريدة تجمع بين أصالة التاريخ الإسلامي وبين دقة الحسابات الفلكية والمناخية. يتيح لك التقويم الهجري معرفة الأيام البيض والأعياد والمناسبات الدينية بدقة. بينما يقدم التقويم الزراعي والمناخي (الأنواء) معلومات قيمة عن فصول السنة، أوقات زراعة المحاصيل، وتغيرات الطقس بناءً على التقويم الفلاحي القديم، مما يجعله مرجعاً قيماً لا غنى عنه في تنظيم حياتك."
                    />

                    <InteractiveCard 
                      icon={Calculator}
                      iconClass="bg-teal-600 text-white"
                      bgClass="bg-white"
                      borderClass="border-teal-200/70"
                      title="حاسبة الزكاة والمسبحة الإلكترونية"
                      shortDesc="حساب زكاة المال والذهب بسهولة، ومسبحة إلكترونية ذكية تحفظ عدد التسبيحات والأذكار التي قمت بها."
                      fullDesc="حاسبة الزكاة مصممة بذكاء لتسهيل أداء هذا الركن العظيم من أركان الإسلام. توفر خيارات لحساب زكاة الأموال النقدية، الذهب، والفضة بضغطة زر واحدة بناءً على النصاب المحدث. أما المسبحة الإلكترونية، فتمنحك تجربة تسبيح سلسة مع إمكانية حفظ الأرقام والأذكار المختلفة ومتابعة إنجازك اليومي، لتكون رفيقك الدائم في كل لحظة فراغ لترطيب لسانك بذكر الله."
                    />
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1.5 border border-slate-800">
                    <div className="flex items-center gap-2 text-[var(--color-gold)] font-bold text-xs">
                      <Lightbulb size={16} />
                      <span>تجربة هادئة بدون إعلانات أو إزعاج</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      تم تصميم جميع شاشات وأدوات التطبيق بألوان مريحة للعين وبدون أي إعلانات مزعجة لتتمتع بتجربة إيمانية صافية وهادئة تماماً.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* TAB 4: ACCURACY & LEGAL/ISLAMIC METHODOLOGY */}
              {activeTab === 'quran' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
                  <div className="flex items-center justify-between border-r-4 border-[var(--color-gold)] pr-3">
                    <h3 className="text-sm sm:text-base font-black text-[var(--color-primary-dark)]">
                      كيف يتأكد النظام من صحة الإجابة شرعياً؟
                    </h3>
                    <span className="text-[10px] font-extrabold text-[var(--color-gold-dark)] bg-[var(--color-gold-light)] px-2.5 py-0.5 rounded-full">
                      منهجية شرعية موثوقة
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed font-medium">
                    يهتم تطبيق "أنيس القلوب" بالأمان الديني والعلمي التام، ويتبع منهجاً مستقيماً وموثوقاً عند الرد على الاستفسارات الدينية أو المسائل الفقهية والشبهات:
                  </p>

                  <div className="space-y-3">
                    <InteractiveCard 
                      icon={ShieldCheck}
                      iconClass="bg-[var(--color-gold)] text-slate-950"
                      bgClass="bg-white"
                      title="الاستفسارات الدينية والأحكام الشرعية (الفتاوى)"
                      shortDesc="التطبيق لا يخترع فتاوى ولا يجتهد من عنده. عند سؤالك عن أي أمر ديني، يعرض لك النظام النصوص الصريحة."
                      fullDesc="يعتمد التطبيق منهجية شرعية صارمة تتمثل في 'النقل لا العقل' فيما يخص الفتاوى والأحكام. فهو لا يقدم آراء شخصية أو اجتهادات فردية، بل يلتزم بعرض النصوص الشرعية الواضحة من القرآن الكريم والسنة النبوية الصحيحة. وإيماناً بتخصص أهل الفتوى، يحرص النظام دائماً على توجيه المستخدم لضرورة استشارة لجان الفتوى الرسمية والمفتين المعتمدين في بلده في المسائل الشخصية والنوازل المعقدة لضمان الحصول على الحكم الشرعي الدقيق لحالته الخاصة."
                    />

                    <InteractiveCard 
                      icon={Brain}
                      iconClass="bg-purple-600 text-white"
                      bgClass="bg-white"
                      borderClass="border-purple-200/70"
                      title="التعامل مع الشبهات والأمور المشبوهة أو المربكة"
                      shortDesc="إذا طرح المستخدم سؤالاً حول أمر فيه شبهة، يقوم النظام بتبسيط الأمر من خلال الاستشهاد بالآيات المحكمات."
                      fullDesc="يتبنى التطبيق أسلوباً حكيماً في معالجة الشبهات يعتمد على قاعدة 'رد المتشابه إلى المحكم'. عند مواجهة أسئلة جدلية أو قضايا فكرية مربكة، يقوم النظام بتهدئة الحوار وتقديم ردود علمية هادئة تستند إلى المحكمات من آيات القرآن الكريم ومقررات العقيدة الإسلامية الواضحة. يتم تفنيد الشبهة بأسلوب عقلي ومنطقي متزن، ينأى عن الجدال العقيم، ويهدف بالدرجة الأولى إلى حماية عقيدة المستخدم وتثبيت يقينه بأسلوب عصري ومقنع بعيداً عن التعقيد الفلسفي."
                    />

                    <InteractiveCard 
                      icon={Heart}
                      iconClass="bg-emerald-600 text-white"
                      bgClass="bg-white"
                      borderClass="border-emerald-200/70"
                      title="معالجة المشكلات الاجتماعية والسكينة النفسية"
                      shortDesc="يقدم التطبيق الدعم الإيماني والنفسي لمشاكل الحياة اليومية (كالخوف والقلق) باستخراج الدواء القرآني."
                      fullDesc="يعتبر التطبيق بمثابة 'مستشار أسري واجتماعي' بمرجعية قرآنية. فهو يتعامل مع المشاكل الأسرية، ضغوط العمل، والتحديات الاجتماعية من منظور التوجيه الإلهي. يقدم النظام حلولاً تركز على البناء النفسي السليم كتعزيز قيم التسامح، العفو، الحكمة، وإصلاح ذات البين، مستمداً ذلك من قصص الأنبياء والتوجيهات القرآنية. يهدف هذا النهج إلى تحويل الأزمات إلى فرص للتقرب إلى الله وتزكية النفس، مع تقديم نصائح عملية تعزز من تماسك الفرد والمجتمع."
                    />

                    {/* Approved Scholar Sources Box */}
                    <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-1 border border-slate-800">
                      <div className="flex items-center gap-2 text-[var(--color-gold)] font-bold text-xs">
                        <CheckCircle2 size={15} />
                        <span>الاعتماد الحصري على أمات المصادر الإسلامية</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                        تعتمد كافة الردود والآيات على التفاسير الإسلامية المشهود لها بالقبول (مثل تفاسير ابن كثير، الطبري، والسعدي) لضمان سلامة المحتوى ونقائه التام من أي أفكار غريبة أو شاذة.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Feedback CTA */}
              <div id="about-feedback-cta" className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-[var(--color-primary)]/10 via-emerald-50 to-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex flex-col sm:flex-row justify-between items-center gap-3 text-right">
                <div className="space-y-0.5 w-full sm:w-auto">
                  <h4 className="text-xs sm:text-sm font-black text-[var(--color-primary-dark)]">هل لديك رأي أو اقتراح لتطوير التطبيق؟</h4>
                  <p className="text-[11px] text-gray-600 font-medium">نرحب بكافة ملاحظاتكم واقتراحاتكم لتطوير هذه المنظومة القرآنية المباركة.</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenFeedback();
                  }}
                  className="w-full sm:w-auto shrink-0 px-4 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer active:scale-98"
                >
                  أرسل اقتراحك الآن
                </button>
              </div>

              {/* Author Footer */}
              <div id="about-credits-section" className="text-center pt-3 border-t border-gray-200/70 space-y-0.5">
                <p className="text-xs text-[var(--color-primary-dark)] font-black">أنيس القلوب - رفيقك القرآني للتدبر والسكينة</p>
                <p className="text-[11px] text-gray-600 font-bold">إعداد وتطوير: المهندس / عزام فهد</p>
                <p className="text-[9px] text-gray-400 font-medium">الإصدار 1.1.0 • صُنع بشرعية علمية وابتكار تقني لخدمة كتاب الله الشريف</p>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AboutModal;
