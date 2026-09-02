import React, { useState, useEffect } from 'react';
import { 
  X, Calculator, Info, TrendingUp, DollarSign, Coins, Gem, 
  Building, Scale, Copy, Check, RotateCcw, BookOpen, ChevronDown, 
  ChevronUp, Sparkles, ShieldCheck, Layers, HelpCircle, Share2,
  ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ZakatCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CURRENCIES = [
  { code: 'SAR', label: 'ريال سعودي (SAR)' },
  { code: 'USD', label: 'دولار أمريكي (USD)' },
  { code: 'AED', label: 'درهم إماراتي (AED)' },
  { code: 'EGP', label: 'جنيه مصري (EGP)' },
  { code: 'EUR', label: 'يورو (EUR)' },
  { code: 'KWD', label: 'دينار كويتي (KWD)' },
  { code: 'QAR', label: 'ريال قطري (QAR)' },
  { code: 'JOD', label: 'دينار أردني (JOD)' },
  { code: 'DZD', label: 'دينار جزائري (DZD)' },
  { code: 'MAD', label: 'درهم مغربي (MAD)' },
  { code: 'TND', label: 'دينار تونسي (TND)' },
  { code: 'OMR', label: 'ريال عماني (OMR)' },
  { code: 'BHD', label: 'دينار بحريني (BHD)' },
  { code: 'IQD', label: 'دينار عراقي (IQD)' },
  { code: 'LYD', label: 'دينار ليبي (LYD)' },
  { code: 'YER', label: 'ريال yمني (YER)' },
];

const ZAKAT_BENEFICIARIES = [
  { title: "الفقراء", desc: "من لا يجدون كفايتهم اليومية الأساسية من الطعام والكسوة والسكن." },
  { title: "المساكين", desc: "من لديهم بعض الدخل ولكن لا يكفيهم لسد حاجتهم الأساسية الكافية." },
  { title: "العاملون عليها", desc: "الجباة والقائمون على جمع الزكاة وحسابها وتوزيعها." },
  { title: "المؤلفة قلوبهم", desc: "من يُرجى إسلامهم أو تثبيت إيمانهم أو كفّ شر غيرهم." },
  { title: "وفي الرقاب", desc: "في عتق العبيد وفك الأسرى ومساعدة المكاتبين." },
  { title: "الغارمون", desc: "الذين تحملوا ديوناً في غير معصية وعجزوا عن سدادها." },
  { title: "في سبيل الله", desc: "المجاهدون والدعاة والمشاريع والمرافق العامة التي تخدم الأمة." },
  { title: "ابن السبيل", desc: "المسافر الذي انقطعت به النفقة والزاد في غير معصية." }
];

const ZAKAT_DEFAULTS: { [key: string]: { gold: number; fitr: number } } = {
  SAR: { gold: 300, fitr: 20 },
  USD: { gold: 80, fitr: 10 },
  AED: { gold: 295, fitr: 25 },
  EGP: { gold: 3600, fitr: 35 },
  EUR: { gold: 73, fitr: 10 },
  KWD: { gold: 24, fitr: 2 },
  QAR: { gold: 290, fitr: 15 },
  JOD: { gold: 56, fitr: 2.5 },
  DZD: { gold: 10800, fitr: 150 },
  MAD: { gold: 800, fitr: 20 },
  TND: { gold: 250, fitr: 2.5 },
  OMR: { gold: 30, fitr: 2 },
  BHD: { gold: 30, fitr: 2 },
  IQD: { gold: 105000, fitr: 3000 },
  LYD: { gold: 390, fitr: 10 },
  YER: { gold: 20000, fitr: 1500 }
};

export const ZakatCalculatorModal: React.FC<ZakatCalculatorModalProps> = ({ isOpen, onClose }) => {
  // Load initial form data or set defaults
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('anis_zakat_currency') || 'SAR';
  });

  const [yearType, setYearType] = useState<'hijri' | 'gregorian'>(() => {
    return (localStorage.getItem('anis_zakat_yeartype') as 'hijri' | 'gregorian') || 'hijri';
  });

  // Calculation mode: 'wizard' | 'fitr'
  const [calcMode, setCalcMode] = useState<'wizard' | 'fitr'>(() => {
    const stored = localStorage.getItem('anis_zakat_calcmode');
    if (stored === 'simple') return 'wizard';
    return (stored as 'wizard' | 'fitr') || 'wizard';
  });

  // Step-by-step Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardHasGold, setWizardHasGold] = useState(false);
  const [wizardHasInvestments, setWizardHasInvestments] = useState(false);
  const [wizardHasDebts, setWizardHasDebts] = useState(false);

  // Commodity prices per gram (Starts empty, and if stored value was previous default '300', we clear it to start empty)
  const [goldPrice24, setGoldPrice24] = useState(() => {
    const stored = localStorage.getItem('anis_zakat_gold24');
    if (stored === '300') return '';
    return stored || '';
  });

  // Asset inputs
  const [cash, setCash] = useState(() => localStorage.getItem('anis_zakat_cash') || '');
  const [goldGrams24, setGoldGrams24] = useState(() => localStorage.getItem('anis_zakat_gold_g24') || '');
  const [goldGrams21, setGoldGrams21] = useState(() => localStorage.getItem('anis_zakat_gold_g21') || '');
  const [goldGrams18, setGoldGrams18] = useState(() => localStorage.getItem('anis_zakat_gold_g18') || '');
  const [stocksAndFunds, setStocksAndFunds] = useState(() => localStorage.getItem('anis_zakat_stocks') || '');
  const [tradeInventory, setTradeInventory] = useState(() => localStorage.getItem('anis_zakat_trade') || '');
  const [receivables, setReceivables] = useState(() => localStorage.getItem('anis_zakat_receivables') || '');
  const [payables, setPayables] = useState(() => localStorage.getItem('anis_zakat_payables') || '');

  // Zakat al-Fitr state
  const [fitrFamilyCount, setFitrFamilyCount] = useState(() => localStorage.getItem('anis_zakat_fitr_count') || '1');
  const [fitrValuePerPerson, setFitrValuePerPerson] = useState(() => localStorage.getItem('anis_zakat_fitr_val') || '');

  // UI state
  const [activeTab, setActiveTab] = useState<'calculator' | 'rules' | 'recipients'>('calculator');
  const [isCopied, setIsCopied] = useState(false);

  const defaultGoldPrice = ZAKAT_DEFAULTS[currency]?.gold || 300;
  const defaultFitrValue = ZAKAT_DEFAULTS[currency]?.fitr || 20;

  // Auto-set reasonable commodity price presets when currency changes (as helper for users)
  useEffect(() => {
    const selectedDefault = ZAKAT_DEFAULTS[currency];
    if (selectedDefault) {
      // Keep goldPrice24 empty by default, only set fitrValuePerPerson if empty
      if (!fitrValuePerPerson) {
        setFitrValuePerPerson(selectedDefault.fitr.toString());
      }
    }
  }, [currency]);

  // Persist form inputs
  useEffect(() => {
    try {
      localStorage.setItem('anis_zakat_currency', currency);
      localStorage.setItem('anis_zakat_yeartype', yearType);
      localStorage.setItem('anis_zakat_calcmode', calcMode);
      localStorage.setItem('anis_zakat_gold24', goldPrice24);
      localStorage.setItem('anis_zakat_cash', cash);
      localStorage.setItem('anis_zakat_gold_g24', goldGrams24);
      localStorage.setItem('anis_zakat_gold_g21', goldGrams21);
      localStorage.setItem('anis_zakat_gold_g18', goldGrams18);
      localStorage.setItem('anis_zakat_stocks', stocksAndFunds);
      localStorage.setItem('anis_zakat_trade', tradeInventory);
      localStorage.setItem('anis_zakat_receivables', receivables);
      localStorage.setItem('anis_zakat_payables', payables);
      localStorage.setItem('anis_zakat_fitr_count', fitrFamilyCount);
      localStorage.setItem('anis_zakat_fitr_val', fitrValuePerPerson);
    } catch (e) {}
  }, [
    currency, yearType, calcMode, goldPrice24,
    cash, goldGrams24, goldGrams21, goldGrams18,
    stocksAndFunds, tradeInventory, receivables, payables,
    fitrFamilyCount, fitrValuePerPerson
  ]);

  // Reset calculations based on selected mode
  const resetModeFields = () => {
    if (calcMode === 'fitr') {
      setFitrFamilyCount('1');
    } else {
      setCash('');
      setGoldGrams24('');
      setGoldGrams21('');
      setGoldGrams18('');
      setStocksAndFunds('');
      setTradeInventory('');
      setReceivables('');
      setPayables('');
      setWizardStep(1);
      setWizardHasGold(false);
      setWizardHasInvestments(false);
      setWizardHasDebts(false);
    }
  };

  // Calculations
  const parseNum = (val: string) => Math.max(0, parseFloat(val) || 0);

  const price24 = goldPrice24 ? parseNum(goldPrice24) : defaultGoldPrice;
  const price21 = price24 * (21 / 24);
  const price18 = price24 * (18 / 24);

  // Asset valuations
  const getGoldValuation = () => {
    if (calcMode === 'fitr') return 0;
    if (calcMode === 'wizard' && !wizardHasGold) return 0;
    return (parseNum(goldGrams24) * price24) +
           (parseNum(goldGrams21) * price21) +
           (parseNum(goldGrams18) * price18);
  };

  const getInvestmentsValuation = () => {
    if (calcMode === 'fitr') return 0;
    if (calcMode === 'wizard' && !wizardHasInvestments) return 0;
    return parseNum(stocksAndFunds) + parseNum(tradeInventory) + parseNum(receivables);
  };

  const getDeductions = () => {
    if (calcMode === 'fitr') return 0;
    if (calcMode === 'wizard' && !wizardHasDebts) return 0;
    return parseNum(payables);
  };

  const goldValuation = getGoldValuation();
  const investmentsValuation = getInvestmentsValuation();
  const netDeductions = getDeductions();

  // Total Gross Assets
  const totalGrossAssets = parseNum(cash) + goldValuation + investmentsValuation;
  
  // Net pool of Zakat
  const netPool = Math.max(0, totalGrossAssets - netDeductions);

  // Nisab threshold: Gold = 85g 24K
  const nisabThreshold = 85 * price24;

  const isEligible = netPool >= nisabThreshold && nisabThreshold > 0;

  // Rate: 2.5% for Lunar Hijri year, 2.5775% for Solar Gregorian year
  const zakatRate = yearType === 'hijri' ? 0.025 : 0.025775;
  const zakatAmount = isEligible ? (netPool * zakatRate) : 0;

  // Zakat al-Fitr calculation
  const fitrFamilyCountNum = parseNum(fitrFamilyCount);
  const fitrValuePerPersonNum = parseNum(fitrValuePerPerson);
  const fitrZakatAmount = fitrFamilyCountNum * fitrValuePerPersonNum;

  const copyReport = () => {
    let reportText = '';
    if (calcMode === 'fitr') {
      reportText = `=== تقرير حاسبة زكاة الفطر (أنيس القلوب) ===
نوع الحساب: زكاة الفطر (رمضان المبارك)
العملة: ${currency}
عدد أفراد الأسرة (المعولين): ${fitrFamilyCountNum} فرد
القيمة التقديرية للفرد: ${fitrValuePerPersonNum} ${currency}
إجمالي زكاة الفطر نقداً: ${fitrZakatAmount.toLocaleString()} ${currency}
المقدار العيني المعادل (صاع نبوي تقريباً 2.5 إلى 3 كجم للفرد):
- الأرز/الحبوب: ${(fitrFamilyCountNum * 3).toLocaleString()} كجم تقريباً
- الدقيق/القمح: ${(fitrFamilyCountNum * 2.5).toLocaleString()} كجم تقريباً
- التمر الخالص: ${(fitrFamilyCountNum * 3).toLocaleString()} كجم تقريباً
=======================================`;
    } else {
      const modeLabel = 'المساعد التفاعلي خطوة بخطوة';

      reportText = `=== تقرير حاسبة الزكاة الشرعية (أنيس القلوب) ===
نوع الحساب: ${modeLabel}
العملة: ${currency}
إجمالي الأصول والمدخرات: ${totalGrossAssets.toLocaleString()} ${currency}
تفاصيل الذهب: ${goldValuation.toLocaleString()} ${currency}
تفاصيل الاستثمارات والتجارة: ${investmentsValuation.toLocaleString()} ${currency}
الديون المخصومة: ${netDeductions.toLocaleString()} ${currency}
صافي وعاء الزكاة: ${netPool.toLocaleString()} ${currency}
حد النصاب المقارن (الذهب 85جرام): ${nisabThreshold.toLocaleString()} ${currency}
حالة الزكاة: ${isEligible ? 'وجبت فيها الزكاة' : 'لم تبلغ النصاب الشرعي بعد'}
مقدار الزكاة الواجب إخراجه (${yearType === 'hijri' ? '2.5%' : '2.5775%'}): ${zakatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}
=======================================`;
    }

    navigator.clipboard.writeText(reportText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="zakat-modal-backdrop"
          id="zakat-modal-overlay"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="modal-backdrop flex items-center justify-center p-2 sm:p-4 z-50" 
          onClick={onClose}
        >
          <motion.div 
            key="zakat-modal-container"
            id="zakat-modal-container"
            initial={{ scale: 0.94, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.94, y: 20 }}
            className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col h-[90vh] border border-gray-100 dark:border-gray-800 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div id="zakat-modal-header" className="relative bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 sm:p-6 shrink-0 shadow-md">
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-amber-300">
                    <Calculator size={24} />
                  </div>
                  <div>
                    <h2 id="zakat-modal-title" className="text-xl sm:text-2xl font-bold font-serif">حاسبة الزكاة الشرعية</h2>
                    <p className="text-xs text-emerald-100/80">طرق سهلة وميسّرة لحساب زكاتك بدقة واطمئنان</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    id="zakat-close-btn"
                    onClick={onClose} 
                    className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/10"
                    aria-label="إغلاق"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Navigation Sub-Tabs */}
              <div id="zakat-navigation-tabs" className="mt-4 flex items-center gap-2 pt-2 border-t border-white/10 text-xs">
                <button
                  id="zakat-tab-calc"
                  onClick={() => setActiveTab('calculator')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'calculator'
                      ? 'bg-amber-400 text-emerald-950 shadow-sm'
                      : 'bg-white/10 text-emerald-100 hover:bg-white/20'
                  }`}
                >
                  <Calculator size={14} />
                  <span>الحاسبة الذكية</span>
                </button>

                <button
                  id="zakat-tab-recipients"
                  onClick={() => setActiveTab('recipients')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'recipients'
                      ? 'bg-amber-400 text-emerald-950 shadow-sm'
                      : 'bg-white/10 text-emerald-100 hover:bg-white/20'
                  }`}
                >
                  <BookOpen size={14} />
                  <span>مصارف الزكاة (الـ 8)</span>
                </button>

                <button
                  id="zakat-tab-rules"
                  onClick={() => setActiveTab('rules')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'rules'
                      ? 'bg-amber-400 text-emerald-950 shadow-sm'
                      : 'bg-white/10 text-emerald-100 hover:bg-white/20'
                  }`}
                >
                  <ShieldCheck size={14} />
                  <span>شروط وأحكام الزكاة</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div id="zakat-modal-body" className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/50 dark:bg-gray-950/50">
              
              {activeTab === 'calculator' && (
                <div className="space-y-6">
                  
                  {/* Selector for Calculation Modes (Wizard / Zakat al-Fitr) */}
                  <div className="bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex gap-1">
                    <button
                      id="zakat-mode-wizard-btn"
                      onClick={() => { setCalcMode('wizard'); setWizardStep(1); }}
                      className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all text-center ${
                        calcMode === 'wizard'
                          ? 'bg-emerald-800 text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      المساعد التفاعلي (ممتع)
                    </button>
                    <button
                      id="zakat-mode-fitr-btn"
                      onClick={() => { setCalcMode('fitr'); }}
                      className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all text-center ${
                        calcMode === 'fitr'
                          ? 'bg-emerald-800 text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      زكاة الفطر (رمضان)
                    </button>
                  </div>

                  {/* Settings Bar: Currency & Nisab Criteria */}
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                      <div>
                        <label htmlFor="zakat-currency-select" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                          العملة المستخدمة:
                        </label>
                        <select
                          id="zakat-currency-select"
                          value={currency}
                          onChange={e => setCurrency(e.target.value)}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {CURRENCIES.map(c => (
                            <option key={c.code} value={c.code}>{c.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                          نوع السنة الحولية:
                        </span>
                        <div className="flex gap-1">
                          <button
                            id="zakat-year-hijri"
                            onClick={() => setYearType('hijri')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              yearType === 'hijri'
                                ? 'bg-emerald-700 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            هجرية قمريّة (2.5%)
                          </button>
                          <button
                            id="zakat-year-gregorian"
                            onClick={() => setYearType('gregorian')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              yearType === 'gregorian'
                                ? 'bg-emerald-700 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            ميلادية شمسية (2.5775%)
                          </button>
                        </div>
                      </div>
                    </div>


                  </div>

                  {/* Render Mode 1: Step-by-Step Interactive Wizard */}
                  {calcMode === 'wizard' && (
                    <motion.div 
                      key="wizard-mode"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Step Tracker Progress Bar */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 font-serif">
                            {wizardStep === 5 ? 'تم الحساب بنجاح!' : `الخطوة ${wizardStep} من 4: ${
                              wizardStep === 1 ? 'المدخرات والسيولة' :
                              wizardStep === 2 ? 'الذهب والفضة' :
                              wizardStep === 3 ? 'الأسهم والاستثمارات' : 'الالتزامات والديون'
                            }`}
                          </span>
                          <span className="text-xs font-mono font-bold text-gray-400">{Math.round((Math.min(wizardStep, 4) / 4) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full transition-all duration-500 rounded-full"
                            style={{ width: `${(Math.min(wizardStep, 4) / 4) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Step Content */}
                      <div className="min-h-[220px] bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                        
                        {/* Wizard Step 1 */}
                        {wizardStep === 1 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl text-emerald-800 dark:text-emerald-300">
                                <DollarSign size={20} />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">هل تمتلك أموالاً نقدية (كاش) أو مدخرات بالبنك؟</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">تشمل المبالغ النقدية في حسابك الجاري، الودائع لأجل، الذهب أو المال السائل بالمنزل، والتي مضى عليها سنة كاملة وهي في ملكك.</p>
                              </div>
                            </div>
                            
                            <div className="relative pt-2">
                              <input 
                                id="zakat-wizard-cash"
                                type="number"
                                value={cash}
                                onChange={e => setCash(e.target.value)}
                                placeholder="أدخل إجمالي الكاش والمدخرات البنكية..."
                                className="w-full pl-12 pr-4 py-3 text-sm font-bold border-2 border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900 dark:text-white focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                              />
                              <span className="absolute left-4 top-[1.35rem] font-bold text-gray-400">{currency}</span>
                            </div>
                          </motion.div>
                        )}

                        {/* Wizard Step 2 */}
                        {wizardStep === 2 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-amber-100 dark:bg-amber-950/30 rounded-xl text-amber-800 dark:text-amber-300">
                                <Gem size={20} />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">هل تمتلك ذهباً بغرض الادخار والاستثمار؟</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">تنبيه: ذهب الزينة واللبس الشخصي للمرأة معفى من الزكاة عند جمهور العلماء. أما الذهب المخصص كسبائك أو مدخرات استثمارية فتجب فيه الزكاة.</p>
                              </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                              <button
                                id="zakat-wizard-gold-no"
                                onClick={() => { setWizardHasGold(false); setGoldGrams24(''); setGoldGrams21(''); setGoldGrams18(''); }}
                                className={`flex-1 py-3 text-xs font-bold rounded-2xl border transition-all ${
                                  !wizardHasGold 
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-600 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300'
                                }`}
                              >
                                لا أملك ذهباً للادخار
                              </button>
                              <button
                                id="zakat-wizard-gold-yes"
                                onClick={() => setWizardHasGold(true)}
                                className={`flex-1 py-3 text-xs font-bold rounded-2xl border transition-all ${
                                  wizardHasGold 
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-600 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300'
                                }`}
                              >
                                نعم، أملك ذهباً للادخار
                              </button>
                            </div>

                            {wizardHasGold && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }}
                                className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2"
                              >
                                <div>
                                  <label htmlFor="zakat-wiz-g24" className="block text-[10px] font-bold text-gray-500 mb-1">ذهب عيار 24 (جرام):</label>
                                  <input 
                                    id="zakat-wiz-g24"
                                    type="number"
                                    value={goldGrams24}
                                    onChange={e => setGoldGrams24(e.target.value)}
                                    placeholder="0"
                                    className="w-full p-2.5 text-xs font-bold border rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label htmlFor="zakat-wiz-g21" className="block text-[10px] font-bold text-gray-500 mb-1">ذهب عيار 21 (جرام):</label>
                                  <input 
                                    id="zakat-wiz-g21"
                                    type="number"
                                    value={goldGrams21}
                                    onChange={e => setGoldGrams21(e.target.value)}
                                    placeholder="0"
                                    className="w-full p-2.5 text-xs font-bold border rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label htmlFor="zakat-wiz-g18" className="block text-[10px] font-bold text-gray-500 mb-1">ذهب عيار 18 (جرام):</label>
                                  <input 
                                    id="zakat-wiz-g18"
                                    type="number"
                                    value={goldGrams18}
                                    onChange={e => setGoldGrams18(e.target.value)}
                                    placeholder="0"
                                    className="w-full p-2.5 text-xs font-bold border rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                  />
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        )}

                        {/* Wizard Step 3 */}
                        {wizardStep === 3 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-indigo-100 dark:bg-indigo-950/30 rounded-xl text-indigo-800 dark:text-indigo-300">
                                <TrendingUp size={20} />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">هل تمتلك أسهماً، استثمارات، بضائع تجارية، أو ديوناً لك بذمة الآخرين؟</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">تشمل الأسهم والصناديق الاستثمارية، البضائع الجاهزة للبيع في تجارتك، والديون المضمونة السداد التي لك على الآخرين.</p>
                              </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                              <button
                                id="zakat-wizard-inv-no"
                                onClick={() => { setWizardHasInvestments(false); setStocksAndFunds(''); setTradeInventory(''); setReceivables(''); }}
                                className={`flex-1 py-3 text-xs font-bold rounded-2xl border transition-all ${
                                  !wizardHasInvestments 
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-600 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300'
                                }`}
                              >
                                لا، لا أمتلك استثمارات أو سلع تجارية
                              </button>
                              <button
                                id="zakat-wizard-inv-yes"
                                onClick={() => setWizardHasInvestments(true)}
                                className={`flex-1 py-3 text-xs font-bold rounded-2xl border transition-all ${
                                  wizardHasInvestments 
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-600 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300'
                                }`}
                              >
                                نعم، أمتلك استثمارات أو سلع تجارية
                              </button>
                            </div>

                            {wizardHasInvestments && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }}
                                className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2"
                              >
                                <div>
                                  <label htmlFor="zakat-wiz-stocks" className="block text-[10px] font-bold text-gray-500 mb-1">الأسهم والصناديق ({currency}):</label>
                                  <input 
                                    id="zakat-wiz-stocks"
                                    type="number"
                                    value={stocksAndFunds}
                                    onChange={e => setStocksAndFunds(e.target.value)}
                                    placeholder="0"
                                    className="w-full p-2.5 text-xs font-bold border rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label htmlFor="zakat-wiz-trade" className="block text-[10px] font-bold text-gray-500 mb-1">عروض التجارة/البضائع ({currency}):</label>
                                  <input 
                                    id="zakat-wiz-trade"
                                    type="number"
                                    value={tradeInventory}
                                    onChange={e => setTradeInventory(e.target.value)}
                                    placeholder="0"
                                    className="w-full p-2.5 text-xs font-bold border rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label htmlFor="zakat-wiz-receivables" className="block text-[10px] font-bold text-gray-500 mb-1">ديون مضمونة لك عند الآخرين ({currency}):</label>
                                  <input 
                                    id="zakat-wiz-receivables"
                                    type="number"
                                    value={receivables}
                                    onChange={e => setReceivables(e.target.value)}
                                    placeholder="0"
                                    className="w-full p-2.5 text-xs font-bold border rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                  />
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        )}

                        {/* Wizard Step 4 */}
                        {wizardStep === 4 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-red-100 dark:bg-red-950/30 rounded-xl text-red-800 dark:text-red-300">
                                <Scale size={20} />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">هل عليك ديون عاجلة أو التزامات حالة السداد تريد خصمها؟</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">لتجنب الإجحاف، يُسمح بخصم الديون الحالة والالتزامات المالية العاجلة التي يتوجب عليك سدادها فوراً للناس من وعاء الزكاة.</p>
                              </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                              <button
                                id="zakat-wizard-debt-no"
                                onClick={() => { setWizardHasDebts(false); setPayables(''); }}
                                className={`flex-1 py-3 text-xs font-bold rounded-2xl border transition-all ${
                                  !wizardHasDebts 
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-600 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300'
                                }`}
                              >
                                لا، ليس علي ديون عاجلة لخصمها
                              </button>
                              <button
                                id="zakat-wizard-debt-yes"
                                onClick={() => setWizardHasDebts(true)}
                                className={`flex-1 py-3 text-xs font-bold rounded-2xl border transition-all ${
                                  wizardHasDebts 
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-600 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300'
                                }`}
                              >
                                نعم، لدي ديون عاجلة أريد خصمها
                              </button>
                            </div>

                            {wizardHasDebts && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }}
                                className="pt-2"
                              >
                                <label htmlFor="zakat-wiz-payables" className="block text-[10px] font-bold text-gray-500 mb-1">الديون والالتزامات العاجلة التي عليك ({currency}):</label>
                                <input 
                                  id="zakat-wiz-payables"
                                  type="number"
                                  value={payables}
                                  onChange={e => setPayables(e.target.value)}
                                  placeholder="أدخل مبالغ الديون لخصمها..."
                                  className="w-full p-2.5 text-xs font-bold border rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                />
                              </motion.div>
                            )}
                          </motion.div>
                        )}

                        {/* Navigation Actions for Wizard */}
                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 gap-3">
                          <button
                            id="zakat-wizard-prev"
                            disabled={wizardStep === 1}
                            onClick={() => setWizardStep(prev => prev - 1)}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                              wizardStep === 1 
                                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <ArrowRight size={14} />
                            <span>السابق</span>
                          </button>

                          <button
                            id="zakat-wizard-next"
                            onClick={() => {
                              if (wizardStep < 4) {
                                setWizardStep(prev => prev + 1);
                              } else {
                                // Transition or show results directly
                                setWizardStep(5);
                              }
                            }}
                            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                          >
                            <span>{wizardStep === 4 ? 'عرض الحساب النهائي' : 'التالي'}</span>
                            {wizardStep === 4 ? <Check size={14} /> : <ArrowLeft size={14} />}
                          </button>
                        </div>

                      </div>

                      {/* Display helpful Wizard Step 5 Complete screen */}
                      {wizardStep === 5 && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-800 text-center space-y-3"
                        >
                          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center mx-auto text-xl">
                            <CheckCircle2 size={24} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">اكتمل الحساب التفاعلي بنجاح!</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">قمنا بدمج جميع قيم النقود، والذهب والفضة، والاستثمارات، وخصم ديونك المباشرة لإعطائك القيمة الشرعية الدقيقة أدناه.</p>
                          </div>
                          <button 
                            id="zakat-wizard-recalculate"
                            onClick={() => setWizardStep(1)}
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-700 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all"
                          >
                            إعادة إدخال الخطوات
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Render Mode 3: Zakat al-Fitr Form */}
                  {calcMode === 'fitr' && (
                    <motion.div 
                      key="fitr-mode"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-5"
                    >
                      {/* Introduction Banner */}
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-3xl border border-emerald-100 dark:border-emerald-800 flex gap-3 items-start">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-2xl shrink-0 mt-0.5">
                          <Sparkles size={18} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white">ما هي زكاة الفطر؟</h4>
                          <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                            هي زكاة واجبة على كل مسلم (صغيراً أو كبيراً، ذكراً أو أنثى) يملك قوت يومه وليلته في نهاية شهر رمضان المبارك. تُخرج طُهرةً للصائم من اللغو والرفث، وطُعمةً للمساكين ليشاركونا فرحة العيد.
                          </p>
                        </div>
                      </div>

                      {/* Inputs Grid */}
                      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="zakat-fitr-family-count" className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                              <Users size={16} className="text-emerald-600" />
                              عدد أفراد الأسرة (المعولين بما فيهم أنت):
                            </label>
                            <input 
                              id="zakat-fitr-family-count"
                              type="number"
                              min="1"
                              value={fitrFamilyCount}
                              onChange={e => setFitrFamilyCount(Math.max(1, parseInt(e.target.value) || 1).toString())}
                              placeholder="1"
                              className="w-full p-2.5 text-xs font-bold border rounded-2xl dark:bg-gray-700 dark:border-gray-600 dark:text-white animate-fade-in"
                            />
                          </div>

                          <div>
                            <label htmlFor="zakat-fitr-val-person" className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                              <DollarSign size={16} className="text-amber-500" />
                              القيمة التقديرية للفرد نقداً (حسب بلدك):
                            </label>
                            <div className="relative">
                              <input 
                                id="zakat-fitr-val-person"
                                type="number"
                                min="0"
                                value={fitrValuePerPerson}
                                onChange={e => setFitrValuePerPerson(Math.max(0, parseFloat(e.target.value) || 0).toString())}
                                placeholder="20"
                                className="w-full pl-12 pr-3 py-2.5 text-xs font-bold border rounded-2xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 font-bold">{currency}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                              * هذه القيمة تقديرية ويتم تحديثها سنوياً من قبل وزارات الأوقاف أو دار الإفتاء في بلدك (بما يعادل ثمن صاع طعام). يمكنك تعديلها لتطابق القيمة الرسمية المعلنة في بلدك لرمضان الحالي.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Food vs Cash Choice Panel */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <BookOpen size={15} className="text-emerald-700" />
                          خيارات إخراج زكاة الفطر الشرعية:
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Option 1: Foodstuffs (Sunnah) */}
                          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 dark:from-emerald-950/10 dark:to-teal-950/5 p-4 rounded-3xl border border-emerald-100/50 dark:border-emerald-800/30 space-y-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                              الخيار الأول: الإخراج طعاماً (السنة النبوية)
                            </span>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                              هو الأصل عند جمهور العلماء ويُخرج من قوت البلد الغالب (مثل الأرز أو الدقيق). المقدار صاع نبوي (حوالي 2.5 إلى 3 كجم لكل فرد):
                            </p>
                            
                            <div className="space-y-1.5 pt-1">
                              <div className="flex justify-between items-center bg-white/60 dark:bg-gray-800/40 p-2 rounded-xl text-xs">
                                <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">🌾 الأرز (3 كجم / للفرد)</span>
                                <span className="font-black text-emerald-800 dark:text-emerald-300 font-mono">{(parseInt(fitrFamilyCount) * 3).toLocaleString()} كجم</span>
                              </div>
                              <div className="flex justify-between items-center bg-white/60 dark:bg-gray-800/40 p-2 rounded-xl text-xs">
                                <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">🍞 الدقيق / القمح (2.5 كجم / للفرد)</span>
                                <span className="font-black text-emerald-800 dark:text-emerald-300 font-mono">{(parseInt(fitrFamilyCount) * 2.5).toLocaleString()} كجم</span>
                              </div>
                              <div className="flex justify-between items-center bg-white/60 dark:bg-gray-800/40 p-2 rounded-xl text-xs">
                                <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">🌴 التمر الخالص (3 كجم / للفرد)</span>
                                <span className="font-black text-emerald-800 dark:text-emerald-300 font-mono">{(parseInt(fitrFamilyCount) * 3).toLocaleString()} كجم</span>
                              </div>
                            </div>
                          </div>

                          {/* Option 2: Cash value */}
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50/20 dark:from-amber-950/10 dark:to-orange-950/5 p-4 rounded-3xl border border-amber-100/40 dark:border-amber-800/20 flex flex-col justify-between space-y-3">
                            <div className="space-y-2">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                                الخيار الثاني: الإخراج نقداً (رأي أبي حنيفة)
                              </span>
                              <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                                رخص الحنفية وبعض العلماء إخراج قيمة زكاة الفطر نقداً لمصلحة الفقير ليسد بها احتياجات العيد الأخرى كالملابس والألعاب والدواء.
                              </p>
                            </div>

                            <div className="bg-white/60 dark:bg-gray-800/40 p-3 rounded-2xl text-center border border-amber-100/30 dark:border-amber-900/20">
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block mb-0.5">القيمة المالية الإجمالية المستحقة:</span>
                              <span className="text-xl sm:text-2xl font-black font-mono text-amber-900 dark:text-amber-200">
                                {fitrZakatAmount.toLocaleString()} <span className="text-xs font-sans font-bold">{currency}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Zakat al-Fitr Actions */}
                      <div className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl flex items-center justify-between gap-3 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <button
                          id="zakat-fitr-copy-btn"
                          onClick={copyReport}
                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          {isCopied ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
                          <span>{isCopied ? 'تم نسخ التقرير!' : 'نسخ تقرير زكاة الفطر'}</span>
                        </button>

                        <button
                          id="zakat-fitr-reset-btn"
                          onClick={() => { setFitrFamilyCount('1'); }}
                          className="px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 font-bold transition-colors flex items-center gap-1"
                        >
                          <RotateCcw size={14} />
                          <span>تصفير</span>
                        </button>
                      </div>

                    </motion.div>
                  )}

                  {/* Sharia Result and Final Output Screen */}
                  {calcMode !== 'fitr' && (
                    <div id="zakat-results-card" className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 text-white p-5 sm:p-6 rounded-3xl shadow-xl space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center text-xs text-emerald-200 border-b border-white/10 pb-3 gap-2">
                        <span>إجمالي الأصول المقدرة: <strong className="font-mono text-white">{totalGrossAssets.toLocaleString()} {currency}</strong></span>
                        <span>حد النصاب المطلوب حالياً: <strong className="font-mono text-white">{nisabThreshold.toLocaleString()} {currency}</strong></span>
                      </div>

                      <div className="text-center py-2">
                        <span className="text-xs uppercase font-bold text-amber-300 tracking-wider">مقدار الزكاة الشرعية الواجب إخراجها</span>
                        <div className="text-4xl sm:text-5xl font-black font-mono my-2 text-white drop-shadow-md">
                          {zakatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-lg font-sans mr-2 text-amber-300">{currency}</span>
                        </div>

                        {isEligible ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-bold shadow-sm">
                            <Sparkles size={14} />
                            <span>بلغ مالك النصاب، وجبت الزكاة بارك الله لك في رزقك وطهّره</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-emerald-200 rounded-full text-xs font-medium">
                            <AlertCircle size={14} className="text-amber-400" />
                            <span>لم يبلغ المال حد النصاب الشرعي بعد، لا تجب الزكاة حالياً</span>
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
                        <button
                          id="zakat-copy-btn"
                          onClick={copyReport}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10"
                        >
                          {isCopied ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
                          <span>{isCopied ? 'تم نسخ التقرير!' : 'نسخ تقرير الزكاة'}</span>
                        </button>

                        <button
                          id="zakat-reset-btn"
                          onClick={resetModeFields}
                          className="px-3 py-2 text-xs text-red-300 hover:text-red-100 flex items-center gap-1 font-bold transition-colors"
                        >
                          <RotateCcw size={14} />
                          <span>تصفير البيانات</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Optional Gold Price input under the results card */}
                  {calcMode !== 'fitr' && (
                    <div id="zakat-gold-price-card" className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
                      {/* Nisab Basis Standard */}
                      <div className="pb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-gray-100 dark:border-gray-700">
                        <span className="font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                          <ShieldCheck size={14} className="text-emerald-600" />
                          الحد الأدنى لوجوب الزكاة (معيار النصاب الشرعي):
                        </span>
                        <span className="font-bold text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-xl">
                          معيار الذهب عيار 24 (85 جرام) - المعتمد للمدخرات النقدية
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        <span className="flex items-center gap-1.5">
                          <Gem size={16} className="text-amber-500 animate-pulse" />
                          سعر جرام الذهب عيار 24 اليوم (اختياري لتحديث حد النصاب تلقائياً):
                        </span>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg">اختياري</span>
                      </div>
                      <div className="relative">
                        <input 
                          id="zakat-gold-price-input"
                          type="number"
                          value={goldPrice24}
                          onChange={e => setGoldPrice24(e.target.value)}
                          className="w-full pl-12 pr-3 py-2 text-xs font-bold border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder={`مثال: ${defaultGoldPrice}`}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">{currency}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        * إدخال سعر الذهب اختياري وليس ضرورياً لحساب زكاة أموالك مباشرة، وإنما يستخدم فقط لتحديث قيمة "حد النصاب الشرعي" تلقائياً (قيمة 85 جرام ذهب عيار 24). إذا لم تدخله، سيستخدم البرنامج السعر الافتراضي التقريبي لبلدك.
                      </p>
                    </div>
                  )}

                </div>
              )}

              {/* Tab 2: Recipients (مصارف الزكاة الـ 8) */}
              {activeTab === 'recipients' && (
                <div id="zakat-recipients-tab-content" className="space-y-4">
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-800/50 text-xs text-amber-950 dark:text-amber-200 leading-relaxed font-serif">
                    <strong>قال الله تعالى في سورة التوبة (الآية 60): </strong>
                    <p className="mt-1.5 text-sm font-bold text-amber-900 dark:text-amber-100 leading-normal">
                      "إِنَّمَا الصَّدَقَاتُ لِلْفُقَرَاءِ وَالْمَسَاكِينِ وَالعَامِلِينَ عَلَيْهَا وَالمُؤَلَّفَةِ قُلُوبُهُمْ وَفِي الرِّقَابِ وَالغَارِمِينَ وَفِي سَبِيلِ اللَّهِ وَابْنِ السَّبِيلِ ۖ فَرِيضَةً مِنَ اللَّهِ ۗ وَاللَّهُ عَلِيمٌ حَكِيمٌ"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ZAKAT_BENEFICIARIES.map((item, idx) => (
                      <div 
                        key={idx}
                        id={`zakat-beneficiary-${idx}`}
                        className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:border-emerald-100 dark:hover:border-emerald-950"
                      >
                        <div className="flex items-center gap-2 mb-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-center font-mono font-black">
                            {idx + 1}
                          </span>
                          <span>{item.title}</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Rules & FAQs */}
              {activeTab === 'rules' && (
                <div id="zakat-rules-tab-content" className="space-y-3 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-2">
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-1.5">
                      <ShieldCheck size={16} />
                      1. شرط النصاب (حد الغنى الشرعي)
                    </h4>
                    <p>
                      النصاب هو المقدار الذي إذا ملكه المسلم وحال عليه الحول وجبت فيه الزكاة. وهو يعادل قيمة 85 جراماً من الذهب الخالص (عيار 24)، وهو المعيار المعتمد شرعاً للسيولة النقدية والعملات المعاصرة والمدخرات.
                    </p>
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-2">
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-1.5">
                      <ShieldCheck size={16} />
                      2. شرط مرور الحول (السنة الكاملة)
                    </h4>
                    <p>
                      يشترط أن يمضي على تملك المال البالغ للنصاب سنة هجرية كاملة (354 يوماً تقريباً)، باستثناء زكاة الزروع والثمار التي تُخرج يوم حصادها.
                    </p>
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-2">
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-1.5">
                      <ShieldCheck size={16} />
                      3. زكاة الحلي والمجوهرات للزينة
                    </h4>
                    <p>
                      جمهور العلماء على أن ذهب الزينة المعتاد الملبوس للمرأة لا زكاة فيه إذا كان في حد الاعتدال، بينما يرى آخرون وجوب زكاة الذهب مطلقاً إذا بلغ النصاب.
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 rounded-2xl border border-amber-200/40 dark:border-amber-800/30 space-y-2">
                    <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm flex items-center gap-1.5">
                      <ShieldCheck size={16} />
                      4. أصحاب الدخل البسيط والزكاة العينية (كالدقيق والأرز)
                    </h4>
                    <div className="space-y-2">
                      <p>
                        <strong>أولاً: هل تجب عليك الزكاة؟</strong> إذا كان دخلك بسيطاً ولا تدخر منه فائضاً يبلغ النصاب (ما يعادل قيمة 85 جراماً من الذهب الخالص) وتمر عليه سنة هجرية كاملة، <strong>فلا تجب عليك زكاة المال إطلاقاً</strong>. بل قد تكون أنت مستحقاً لتلقي الزكاة لمساعدتك.
                      </p>
                      <p>
                        <strong>ثانياً: هل يجوز إخراج طعام (عيني) كالدقيق بدلاً من المال؟</strong>
                      </p>
                      <ul className="list-disc list-inside space-y-1.5 text-gray-600 dark:text-gray-300 pl-1">
                        <li>
                          <strong>في زكاة المال:</strong> الأصل إخراجها نقداً ليتصرف الفقير بها كيفما يشاء. وجوّز بعض الفقهاء (كالحنفية) إخراج قيمتها مواداً عينية كالأرز أو الدقيق أو اللباس إذا كان ذلك يحقق منفعة أكبر ومباشرة للفقير المحتاج.
                        </li>
                        <li>
                          <strong>في زكاة الفطر (رمضان):</strong> هي التي تفرض على كل مسلم يملك قوت يومه وليلته لعيد الفطر، <strong>والأصل والسنة فيها أن تُخرج عيناً من قوت البلد</strong> كالدقيق والقمح والأرز والتمر والزبيب، ومقدارها صاع واحد (حوالي 2.5 إلى 3 كجم) عن الشخص الواحد تخرجها من بيتك أو تشتريها وتوزعها على الفقراء.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
