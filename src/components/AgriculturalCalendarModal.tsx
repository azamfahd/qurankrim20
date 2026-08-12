import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Leaf, 
  Sun, 
  Wind, 
  CloudRain, 
  Sparkles, 
  Sprout, 
  ArrowRight, 
  ArrowLeft, 
  Info, 
  Search, 
  BookOpen, 
  CheckCircle, 
  Compass, 
  CalendarDays,
  Sunrise,
  Award,
  Quote,
  HelpCircle,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getAgriculturalDetails, 
  HIMYARITE_MONTHS, 
  MARKERS, 
  isLeapYear,
  getMarkersForHimyariteMonth,
  getDaysForHimyariteMonth,
  HimyariteMonthDayInfo,
  HimyariteMonth,
  Marker,
  getSyriacMonthName,
  getGregorianMonthWithSyriac,
  formatGregorianDateWithSyriac,
  SYRIAC_MONTHS,
  GREGORIAN_ARABIC_MONTHS,
  SIMPLIFIED_MONTH_PACKAGES,
  SimplifiedMonthPackage
} from '../lib/yemeniCalendar';

const SYRIAC_MONTH_DETAILS = [
  {
    number: 1,
    syriac: 'كانون الثاني',
    gregorian: 'يناير',
    meaning: 'الاستقرار المنزلي وشدة البرد',
    desc: 'يتوسط فصل الشتاء، ويمتاز بالليالي الطويلة الباردة جداً وسكون الطبيعة.'
  },
  {
    number: 2,
    syriac: 'شباط',
    gregorian: 'فبراير',
    meaning: 'الضرب والجلد والرياح الهوجاء',
    desc: 'يمتاز بتقلبات طقسه ورياحه الباردة النشطة، ويبدأ فيه تحرك العصارة في الأشجار.'
  },
  {
    number: 3,
    syriac: 'آذار',
    gregorian: 'مارس',
    meaning: 'الحركة والنداء وتفتح الربيع',
    desc: 'باكورة فصل الربيع، وتعتدل فيه الأجواء، وتتفتح أزهار اللوز والفاكهة.'
  },
  {
    number: 4,
    syriac: 'نيسان',
    gregorian: 'أبريل',
    meaning: 'النبت الجديد وبدء الخير والبركات',
    desc: 'موسم هطول أمطار الربيع وتألق الغطاء النباتي الأخضر في الوديان.'
  },
  {
    number: 5,
    syriac: 'أيار',
    gregorian: 'مايو',
    meaning: 'النور والضياء والدفء الساطع',
    desc: 'تشتد فيه أشعة الشمس وتبدأ أولى ثمار الفواكه بالظهور ونضج محاصيل الحبوب.'
  },
  {
    number: 6,
    syriac: 'حزيران',
    gregorian: 'يونيو',
    meaning: 'الحنطة وحصاد القمح والقيظ',
    desc: 'يمثل الانقلاب الصيفي وبداية الحر الشديد، وجني محصول القمح وتجفيف الحبوب.'
  },
  {
    number: 7,
    syriac: 'تموز',
    gregorian: 'يوليو',
    meaning: 'المياه والنماء والحرارة الشديدة',
    desc: 'أشد أشهر الصيف حرارة، وفيه تنضج الفواكه الصيفية المتنوعة كالمشمش واللوز.'
  },
  {
    number: 8,
    syriac: 'آب',
    gregorian: 'أغسطس',
    meaning: 'الغلة والفاكهة والغطاء العشبي الوفير',
    desc: 'موسم تلبد الغيوم وهطول السيول الغزيرة وظهور نجم سهيل اليماني المبارك.'
  },
  {
    number: 9,
    syriac: 'أيلول',
    gregorian: 'سبتمبر',
    meaning: 'الصراخ والعويل أو التوديع والانتقال',
    desc: 'توديع الصيف ودخول الاعتدال الخريفي، وفيه تبدأ نسائم الخريف الباردة ليلاً.'
  },
  {
    number: 10,
    syriac: 'تشرين الأول',
    gregorian: 'أكتوبر',
    meaning: 'البدء أو الشهر الأول من الخريف',
    desc: 'دخول موسم حصاد الحبوب الرئيسي (الصراب) وجفاف سنابل الذرة الرفيعة.'
  },
  {
    number: 11,
    syriac: 'تشرين الثاني',
    gregorian: 'نوفمبر',
    meaning: 'الشهر الثاني من الخريف وتراكم البرد',
    desc: 'هبوط درجات الحرارة تدريجياً، ونهاية موسم الحصاد وبدء سكون التربة.'
  },
  {
    number: 12,
    syriac: 'كانون الأول',
    gregorian: 'ديسمبر',
    meaning: 'التأسيس والوقوف وبداية الشتاء الكوني',
    desc: 'حدوث الانقلاب الشتوي ودخول ذروة البرد والصقيع (الضريب) على المرتفعات.'
  }
];

const SEASONS_DATA = [
  {
    id: 'a',
    title: 'أ - موسم البذار - الدفأ - شهران',
    period: 'من 1 فبراير إلى 31 مارس (23 جمادى الآخرة / 10 شباط إلى 25 شعبان / 24 آذار)',
    details: [
      {
        subTitle: 'الفترة الأولى (1 فبراير - 1 مارس):',
        text: 'يوافق حميري (آخر ذو الحجة وأول محرم)، وللطقس حساب (الصريح). يختص ببذار الذرة الصيفية مبكراً، ويتم فيه تخمير بذور الحبوب البر، الشعير، ثوم، حلبة، عدس، دخن، في المرتفعات الوسطى الباردة. ويحصد فيه شهر طه، ويبذر شهر حصين (العدس إلى آخره، والدخن والذرة الصيفية مبكراً في الأودية الحارة والسهول الساحلية مثل أبين، وصنعاء، وغيرها)، وتبدأ حضرموت ببذار موسم صيف الجوف (من نجم الزبرة (يقطع أول أيلول 7 مارس))، وفي 29 فبراير (نهير رياح: لقرطعة وشقي في مارس)، وفي 3 مارس (عقرب ريـاح، وفي 6 مارس: 4 نيسان)، وفي 21 مارس (تشديد قرة، الرياح وتصبح الأشجار واللقاح السحاب، كثيرة المطر، وفي 4 إبريل: معتدل من طاهر ثاني تبدأ مواسم أسقف للبطاط والذرة، في معلم السكك، الموافق 161 (أبريل)، ويشتد حتى معلم حريمو كأساس الموافق 1 يونيو).'
      },
      {
        subTitle: 'الفترة الثانية (2 مارس - 31 مارس):',
        text: 'يوافق حميري (أول صفر إلى أول ربيع الأول)، وحسابها (الصريح). يختص ببذار الذرة البيضاء، الذرة الشامية، السمسم، الدخن، الظهر (أو العدس في بعض المناطق الباردة)، الحلبة، البصل، الثوم، الطماطم، الكوسة، الخيار، والبطيخ والشمام في المناطق الشرقية والسالية (مثل تهامة وأبين).'
      }
    ]
  },
  {
    id: 'b',
    title: 'ب - موسم الصيف لبذار أنواع الذرة',
    period: 'شهران ونصف (تبدأ من 1 أبريل)',
    details: [
      {
        subTitle: 'تفاصيل وبداية الموسم:',
        text: 'يبدأ من 1 أبريل (161 أثار)؛ فيبدأ الذرة الفقارية الكبيرة للذرة في المناطق المعتدلة (مثل أب) وتحصد السبعة أشهر، ويوم 11 أبريل (1 نيسان / يوافق حميري (ذو الثانیه) ويساري شهر قران (البسيس)، تبذر فيه منطقه المناطق (مثل تعز، وإب، وجحاف)، وفي 11 أبريل (6 نيسان) صدر منه مناطق اليمن (الجمهورية ومعروف عشم ورمحة ومواسوها)، وتحصد السبعة أشهر - صوتها لسنة أخير وفي 20 مايو (28 نيسان) يشتد البرد في الأراضي الكاشفة في جميع المرتفعات الوسطى (مثل: أنس)، ويسمى حوسبة وتد، وهو البدء لعشرة المقدرة بغضّ مصاحب للجصرية والتعاقب بسورة ثابتة، عند المزارعين بانتقضا (الغريق، وإغماء فصل الشتاء، الهادي بكر، من تكسيره لبعض السنين ويغلبون، فرووتات لا لشريب (الصقيع)).'
      },
      {
        subTitle: 'المناخ والبرد الخاطف والمساميات:',
        text: 'يبدأ على محيط فصل الربيع سجدان إلى 3 الكل يشيرون إلى انخفاض درجة الحرارة خلال أيام قليل، تسمى (اياتي الصبح - من شدة برودتها). وليالي الصيف تبدأ من 11 مارس (16 شباط) ولا تختلف هذه الأيام من رياح وبرد في بعض المدن، ويخشى حدوث ضريب أما بسبب ضرب على محصول زرادة عن اللطيف ومحصول كرنب الشتاء عند ظهورها، وقد أشار إليها علي بياز، في قوة على برد الزران موسم الذرة مع شروق الشمس. كما تناول الشتاء فصده (شهر الكبير إلى بداية كل فصل وبدء إيمان، كما توجد في محيط الدائرة تفاصيل خطوط أو شرائط بين كل خمس درجات، وهي نقطة إلى 10 مثل أشهر الفترات، ومقاديرها لمعرفة مواقيت تواريخ الزرع المقابل لتاريخ الهلال التقويم الشمسي (الصريح)).'
      }
    ]
  },
  {
    id: 'c',
    title: 'ج - موسم صراة (الصيفي دهرا أو صيراب)',
    period: 'شهر كامل (يبدأ من 11 يونيو)',
    details: [
      {
        subTitle: 'أهم المحاصيل ومطالع الأنواء:',
        text: 'يبدأ من 11 يونيو (11 تموز) يوافق حميري (ذو مدران) وله من العالم القطب (منزل الدر) للمناخ حتى منتصف (الوازع واليمن، ويقترم فيه: العش، والشر، والشحر، والسليط، والعدس، والصبر، والفللي والبطيخ والذرة الصفراء، وتبذر الخضروات مثل الطماطم والبطاط، ويبذر فيه الحبوب للوطر المحصول، ومن معلمي الطبيعتين الواقعتين من 1-6 يونيو (بيدر الصيف والعكس في أب وما سواها). وفي عظمه الطلب الوافق 19 يونيو (1 تموز) تبذر ذراه شدة الحرارة ساخنة، وفي معلم صيف وعقب صريف، معلم صفيل (والفللي - للمسقى ورأس بصور استمرار الخريف وتخر في معظم الروابع).'
      }
    ]
  },
  {
    id: 'd',
    title: 'د - موسم بذر الخريف',
    period: 'يبدأ من 9 سبتمبر',
    details: [
      {
        subTitle: 'بذار المرتفعات والأودية والسهول:',
        text: 'يبدأ من 9 سبتمبر (7 آب) ويبذر الشعير والقمح والسلتي في المناطق الوسطى والمعتدلة، ويحصد في بيادر.. وفي الخاضع نهب الروابع (الشعداء) شمالية وغير تردها من 1 سبتمبر (1 أيلول / يوافق حميري ذو القعدة..)، وفي معظم المناطق يبدأ شرف الحارة.. ويقطع البذر زمن الوعيد في منتصف شهر يوليو (29 يونيو) تبدأ (اليوم الراهن أو صيف الحدي، ويعقب بذر الدخن والذرة والشام والروست وعلي بن طفيل ومطالع الساحل، القرية ربيعية).'
      }
    ]
  },
  {
    id: 'e',
    title: 'هـ - موسم بذرا للقباطة - شهران',
    period: 'من 1 ديسمبر إلى نهاية يناير',
    details: [
      {
        subTitle: 'الفترة الأولى (1 ديسمبر - 31 ديسمبر):',
        text: 'الأول يبدأ من 1 ديسمبر (23 تشرين ثاني / الأول الإبصاري / شهر 1)، (ذو الأول الإبصاري شهر قران 13، يبذر فيه البر، الفطرة، القاطر البارد)، وعلى.. قطع البذر اليوم وما سواها.'
      },
      {
        subTitle: 'الفترة الثانية (1 يناير - 31 يناير):',
        text: 'والثاني يبدأ من 1 يناير (22 ديسمبر / يوم التمور (المقيار والشمام - التعامد على السقى، والثاني يبدأ من 1 يناير (الكانون الثاني) يوافق حميري (ذو الحجاج) ويشاور شهر قران 11: رفيه بيذر، البر والشعير وأقضائها، على السقى في المناطق الباردة والتعامل (علي، وادي العار، عنس، وادي زبيدي، وما سواها)، وفي شهر أحد الموافق (يناير) تبدأ تقطيع أشجار العنب في مناطق خولان ووادي ظهر ومواضعها، وفي أواخر شهر النسيج الموافق 1 فبراير يتم التقليم بمنطقة همدان ومواساها.'
      }
    ]
  },
  {
    id: 'f',
    title: 'و - موسم بذار المناطق الدافئة - تجارة',
    period: 'الزراعة الثانية بتهامة وحضرموت',
    details: [
      {
        subTitle: 'تفاصيل المواسم والمحاصيل الدافئة:',
        text: 'تستعير موسم (الزراعة - الثاني) يعني (رجبية - في تهامة (وذكر ديسي)، in إبح.. في الفلاس، درج، وادي سرعة وصامح، ويعتمد بعد ثلاثة أشهر، ويميز (بيتي وسيف وبكر في ليج وت تهامة، وفي وادي عمير من حضرموت من 6 أكتوبر يبدأ الزرع (الطالعالم، البصل، الثوم، الكندن، التنباك)، وفي 14 أكتوبر يبدأ زرع البر بحضرموت، وفي 27 أكتوبر يزرع الدخن والجنة بتهامة، وفي يوم 27 أكتوبر (ختمير العشبر والحمراء والبطيخ واليفيد) بوادي حضرموت.'
      }
    ]
  }
];

const CIRCLES_DATA = [
  {
    circleNum: '1',
    title: 'الدائرة الأولى (الداخلية)',
    desc: 'نجوم مطالع الزراعة وعدتها 28.',
    bullets: [
      'معلما وكان معظّم 13 يوماً عدداً.',
      'معلم السلام أو التقليم الثاني فهي 11 يوماً.'
    ]
  },
  {
    circleNum: '2',
    title: 'الدائرة الثانية',
    desc: 'منازل السنة الشمسية مدارها 28 منزلة، وكل منزلة 13 يوماً؛ عدد منزل البروج هي 365 يوماً ومكان نزولها في 5 أيام بدمام.',
    bullets: [
      'مميزة - الصيف تقاس فجر يوم 7 يوليو وللدم و السلام أو المكظم الثاني في مصر تقام فجر يوم 30 يونيو فيودع الشمس إلى منتصف والتنزل من الجريف: تطلع الفجر يوم واحد أغسطس، فندمس سهل، والمعروف يفتاح فجر يوم 11 أغسطس (المشتركي).',
      'كما تطلع الحناء يوم 17 يوليو، كما يتطابق الهلال مع السعيد خلف الفجر يوم 20 يوليو والعناية وتأريخ عبد النجوم هجراً، شمسي يطابقها بأسماء معاهد الشتاء.'
    ]
  },
  {
    circleNum: '3',
    title: 'الدائرة الثالثة',
    desc: 'التاريخ الميلادي وتفاعله مع التاريخ السرياني (شمسى / بالروحي).',
    bullets: [
      'يوافق يوم 14 مارس من التاريخ الميلادي يوافق أول من التاريخ الرومي.',
      'كما يوافق أول يوم (19 تشرين الثاني) وهكذا بقية الشهور.'
    ]
  },
  {
    circleNum: '4',
    title: 'الدائرة الرابعة',
    desc: 'تبدأ بالبروج وهي اثنا عشر برجاً وكل برج كل 30 منزلاً وكل منزلة 70 اختصاراً جعلت كل برج مقسماً إلى خمس درجات (5، 10، 15، 20، 25، 30).',
    bullets: [
      'أوائل برج الحمل (1) أبريل وهو مقدم الأرض ودور حول الشمس وما سواها من الأرض في 365 يوماً وربع يوم، ويكون يوماً كاملاً كل أربع سنوات وتسمى السنة الكبيسة وعدتها 366 يوماً.',
      'كذلك منازل الشهر القمري هلال الشهور القديمة 30 يوماً.'
    ]
  }
];

const HADRAMOUT_SEASONS = [
  {
    season: 'الصيف (الخريف المبكر والزبرة)',
    stars: 'الزبرة (يقطع أول أيلول 7 مارس)، الهنعة، الذراع، النثرة، الطرفة، الجبهة',
    desc: 'فترات ارتفاع الحرارة وبداية بذر موسم صيف الجوف (من نجم الزبرة). تهيئة التربة الزراعية وإجراء عمليات السقي والحراثة.'
  },
  {
    season: 'الخريف (مواسم الحصاد والسيول والسهيل)',
    stars: 'الخرصان، عرقوب سهيل، سهيل، اللواء، صياح اللمع، نجم سهيل اليماني',
    desc: 'تلبد السحب الكثيفة وسيلان الأودية وهبوط السيول الغزيرة وتلقيح النخيل ونضج محاصيل التمر الوفيرة.'
  },
  {
    season: 'الشتاء (ذروة الصقيع والبرد)',
    stars: 'القرين، النجمين، البلدة، سعد الذابح، سعد بلع، سعد السعود، الإكليل',
    desc: 'رياح شديدة البرودة وجافة وهبوط درجات الحرارة للمستويات الدنيا، وتلقيم وحفظ الأشجار وسكون العصارة.'
  },
  {
    season: 'الربيع (الاعتدال والمطر الربيعي)',
    stars: 'المقدم، المؤخر، الرشا، الشرطين، البطين، الثريا، الدبران',
    desc: 'موسم تفتح الزهور والاعتدال المناخي البديع وجريان ينابيع المياه الخفيفة التي تسقي المزارع.'
  },
  {
    season: 'العقارب والصفا (مواسم انتقالية)',
    stars: 'عقرب ريـاح (3 مارس)، عقرب السم، عقرب الدم، عقرب الدسم، سعد الأخبية، الصفا والمكظم',
    desc: 'تتغير فيها الرياح وتهب نسائم رياح رطبة أو جافة لتهيئة المواسم الزراعية الكبيرة القادمة.'
  }
];

interface AgriculturalCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'today' | 'month' | 'explore';
type ExploreSubType = 'months' | 'markers' | 'syriac';

export default function AgriculturalCalendarModal({ isOpen, onClose }: AgriculturalCalendarModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showSources, setShowSources] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [exploreType, setExploreType] = useState<ExploreSubType>('markers'); // Default to markers
  const [searchQuery, setSearchQuery] = useState('');
  const [seasonFilter, setSeasonFilter] = useState<string>('الكل');

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(new Date());
      setShowSources(false);
      setActiveTab('today');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const details = getAgriculturalDetails(selectedDate);
  const currentMonthDays = getDaysForHimyariteMonth(selectedDate, details.himyariteMonth);
  const activeMonthMarkers = getMarkersForHimyariteMonth(details.himyariteMonth);

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    if (dateVal) {
      setSelectedDate(new Date(dateVal));
    }
  };

  const handleSelectHimyariteDay = (dayInfo: HimyariteMonthDayInfo) => {
    setSelectedDate(dayInfo.gregorianDate);
    setActiveTab('today'); // Switch back to day view to see details of clicked day
  };

  const handleSelectHimyariteMonth = (month: HimyariteMonth) => {
    // Set date to the start of this Himyarite month
    const currentYear = new Date().getFullYear();
    const targetDate = new Date(currentYear, month.startMonth - 1, month.startDay);
    setSelectedDate(targetDate);
    setActiveTab('today'); // Go to day/month details view
    setShowSources(false);
  };

  const getSeasonColor = (season: string) => {
    switch (season) {
      case 'الربيع': return 'from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10 text-emerald-900 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40 shadow-xs';
      case 'الصيف': return 'from-orange-50/80 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/10 text-orange-900 dark:text-orange-300 border-orange-200/60 dark:border-orange-900/40 shadow-xs';
      case 'الخريف': return 'from-amber-50/80 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/10 text-amber-900 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/40 shadow-xs';
      case 'الشتاء': return 'from-blue-50/80 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 text-blue-900 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/40 shadow-xs';
      default: return 'from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10 text-emerald-900 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40 shadow-xs';
    }
  };

  const getSeasonBadgeColor = (season: string) => {
    switch (season) {
      case 'الربيع': return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
      case 'الصيف': return 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-900/30';
      case 'الخريف': return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
      case 'الشتاء': return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
      default: return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-700';
    }
  };

  const getSeasonIcon = (season: string) => {
    switch (season) {
      case 'الربيع': return <Sprout className="w-8 h-8" />;
      case 'الصيف': return <Sun className="w-8 h-8" />;
      case 'الخريف': return <Leaf className="w-8 h-8" />;
      case 'الشتاء': return <CloudRain className="w-8 h-8" />;
      default: return <Sun className="w-8 h-8" />;
    }
  };

  const getSeasonLightColor = (season: string) => {
    switch (season) {
      case 'الربيع': return 'bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-900 dark:text-emerald-300 border-emerald-100/60 dark:border-emerald-900/20';
      case 'الصيف': return 'bg-orange-50/50 dark:bg-orange-950/10 text-orange-900 dark:text-orange-300 border-orange-100/60 dark:border-orange-900/20';
      case 'الخريف': return 'bg-amber-50/50 dark:bg-amber-950/10 text-amber-900 dark:text-amber-300 border-amber-100/60 dark:border-amber-900/20';
      case 'الشتاء': return 'bg-blue-50/50 dark:bg-blue-950/10 text-blue-900 dark:text-blue-300 border-blue-100/60 dark:border-blue-900/20';
      default: return 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border-gray-100 dark:border-gray-800';
    }
  };

  const seasonColorClass = getSeasonColor(details.season);
  const seasonLightClass = getSeasonLightColor(details.season);
  const seasonBadgeClass = getSeasonBadgeColor(details.season);

  // Maximum days calculations
  const isFebLeapMarker = details.marker.marker.includes('سابع عشر') && isLeapYear(selectedDate.getFullYear());
  const isJabhahMarker = details.marker.manzil === 'الجبهة';
  const markerMaxDays = (isFebLeapMarker || isJabhahMarker) ? 14 : 13;
  const monthMaxDays = details.himyariteMonth.duration;

  // Dynamic Styles matching the season and day characteristics
  const getProgressColors = (season: string) => {
    switch (season) {
      case 'الربيع':
        return {
          markerCircle: 'text-emerald-500 dark:text-emerald-400',
          markerText: 'text-emerald-600 dark:text-emerald-400',
          monthCircle: 'text-teal-500 dark:text-teal-400',
          monthText: 'text-teal-600 dark:text-teal-400'
        };
      case 'الصيف':
        return {
          markerCircle: 'text-orange-500 dark:text-orange-400',
          markerText: 'text-orange-600 dark:text-orange-400',
          monthCircle: 'text-amber-500 dark:text-amber-400',
          monthText: 'text-amber-600 dark:text-amber-400'
        };
      case 'الخريف':
        return {
          markerCircle: 'text-amber-600 dark:text-amber-500',
          markerText: 'text-amber-700 dark:text-amber-400',
          monthCircle: 'text-yellow-600 dark:text-yellow-550',
          monthText: 'text-yellow-600 dark:text-yellow-400'
        };
      case 'الشتاء':
        return {
          markerCircle: 'text-blue-500 dark:text-blue-400',
          markerText: 'text-blue-600 dark:text-blue-400',
          monthCircle: 'text-indigo-500 dark:text-indigo-400',
          monthText: 'text-indigo-600 dark:text-indigo-400'
        };
      default:
        return {
          markerCircle: 'text-emerald-500 dark:text-emerald-400',
          markerText: 'text-emerald-600 dark:text-emerald-400',
          monthCircle: 'text-teal-500 dark:text-teal-400',
          monthText: 'text-teal-600 dark:text-teal-400'
        };
    }
  };

  const progressColors = getProgressColors(details.season);

  const getPlantingSeasonForDate = (date: Date) => {
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    // a - موسم البذار - الدفأ - شهران: 1 Feb to 31 Mar
    if (month === 2 || month === 3) {
      return SEASONS_DATA[0];
    }
    // b - موسم الصيف لبذار أنواع الذرة: 1 Apr to 10 Jun
    if (month === 4 || month === 5 || (month === 6 && day <= 10)) {
      return SEASONS_DATA[1];
    }
    // c - موسم صراة: 11 Jun to 8 Sep
    if ((month === 6 && day >= 11) || month === 7 || month === 8 || (month === 9 && day <= 8)) {
      return SEASONS_DATA[2];
    }
    // d - موسم بذر الخريف: 9 Sep to 30 Nov
    if ((month === 9 && day >= 9) || month === 10 || month === 11) {
      return SEASONS_DATA[3];
    }
    // e - موسم بذرا للقباطة: 1 Dec to 31 Jan
    if (month === 12 || month === 1) {
      return SEASONS_DATA[4];
    }
    return SEASONS_DATA[0];
  };

  const getHadramoutSeasonForDate = (date: Date, season: string) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if (month === 3 || (month === 4 && day <= 15)) {
      return HADRAMOUT_SEASONS[4]; // العقارب والصفا
    }
    
    switch (season) {
      case 'الربيع': return HADRAMOUT_SEASONS[3];
      case 'الصيف': return HADRAMOUT_SEASONS[0];
      case 'الخريف': return HADRAMOUT_SEASONS[1];
      case 'الشتاء': return HADRAMOUT_SEASONS[2];
      default: return HADRAMOUT_SEASONS[0];
    }
  };

  const currentPlantingSeason = getPlantingSeasonForDate(selectedDate);
  const currentHadramoutSeason = getHadramoutSeasonForDate(selectedDate, details.season);

  const getHimyariteMonthGregorianDates = (m: HimyariteMonth) => {
    const year = selectedDate.getFullYear();
    const startDate = new Date(year, m.startMonth - 1, m.startDay);
    const endDate = new Date(year, m.startMonth - 1, m.startDay + m.duration - 1);
    
    const formatShort = (d: Date) => {
      const day = d.getDate();
      const mNum = d.getMonth() + 1;
      const gregName = GREGORIAN_ARABIC_MONTHS[mNum] || '';
      const syriacName = SYRIAC_MONTHS[mNum] || '';
      return `${day} ${gregName} (${syriacName})`;
    };

    return {
      startStr: formatShort(startDate),
      endStr: formatShort(endDate),
      startDate,
      endDate
    };
  };

  // Search filter implementations
  const filteredMonths = HIMYARITE_MONTHS.filter(m => {
    const matchesSearch = m.name.includes(searchQuery) || 
                          m.desc.includes(searchQuery) || 
                          (m.meaning && m.meaning.includes(searchQuery));
    const matchesSeason = seasonFilter === 'الكل' || m.season === seasonFilter;
    return matchesSearch && matchesSeason;
  });

  const filteredMarkers = MARKERS.filter(m => {
    const arabicSeason = m.type === 'spring' ? 'الربيع' : m.type === 'summer' ? 'الصيف' : m.type === 'autumn' ? 'الخريف' : 'الشتاء';
    const matchesSearch = m.marker.includes(searchQuery) || 
                          m.manzil.includes(searchQuery) || 
                          (m.desc && m.desc.includes(searchQuery));
    const matchesSeason = seasonFilter === 'الكل' || arabicSeason === seasonFilter;
    return matchesSearch && matchesSeason;
  });

  const filteredSyriacMonths = SYRIAC_MONTH_DETAILS.filter(m => {
    const matchesSearch = m.syriac.includes(searchQuery) || 
                          m.gregorian.includes(searchQuery) || 
                          m.meaning.includes(searchQuery) || 
                          m.desc.includes(searchQuery);
    let seasonOfMonths = 'الشتاء';
    if (m.number >= 3 && m.number <= 5) seasonOfMonths = 'الربيع';
    else if (m.number >= 6 && m.number <= 8) seasonOfMonths = 'الصيف';
    else if (m.number >= 9 && m.number <= 11) seasonOfMonths = 'الخريف';
    
    const matchesSeason = seasonFilter === 'الكل' || seasonOfMonths === seasonFilter;
    return matchesSearch && matchesSeason;
  });

  const filteredSeasonsData = SEASONS_DATA.filter(s => {
    if (!searchQuery) return true;
    return s.title.includes(searchQuery) || 
           s.period.includes(searchQuery) || 
           s.details.some(d => d.subTitle.includes(searchQuery) || d.text.includes(searchQuery));
  });

  const filteredCirclesData = CIRCLES_DATA.filter(c => {
    if (!searchQuery) return true;
    return c.title.includes(searchQuery) || 
           c.desc.includes(searchQuery) || 
           c.bullets.some(b => b.includes(searchQuery));
  });

  const filteredHadramoutSeasons = HADRAMOUT_SEASONS.filter(h => {
    if (!searchQuery) return true;
    return h.season.includes(searchQuery) || 
           h.stars.includes(searchQuery) || 
           h.desc.includes(searchQuery);
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-stone-50 dark:bg-gray-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-stone-200 dark:border-gray-800"
            dir="rtl"
          >
            {/* Modal Header - Compact & Premium */}
            <div className="flex items-center justify-between p-4 sm:px-6 border-b border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-700 dark:text-emerald-400">
                  <Compass className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-white leading-tight">التقويم الزراعي الفلكي اليمني</h2>
                  <p className="text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">معالم الزراعة، مطالع النجوم والمواسم الحميرية التراثية</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowSources(!showSources)}
                  className={`p-2 rounded-lg transition-all ${showSources ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' : 'text-stone-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-stone-100 dark:hover:bg-gray-800'}`}
                  title="المصادر والمراجع الفلكية"
                >
                  <Info className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-800/80 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs - Gorgeous Yemeni Agricultural Styling */}
            {!showSources && (
              <div className="flex border-b border-stone-200 dark:border-gray-800 bg-stone-100/80 dark:bg-gray-900/80 p-2 gap-2">
                <button
                  onClick={() => { setActiveTab('today'); setShowSources(false); }}
                  className={`flex-1 py-2.5 px-3.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === 'today' 
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md shadow-emerald-600/25 scale-[1.01]' 
                      : 'bg-white dark:bg-gray-800 text-stone-600 dark:text-stone-300 hover:text-emerald-700 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 border border-stone-200/80 dark:border-gray-700/80'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  يومية التقويم
                </button>
                <button
                  onClick={() => { setActiveTab('month'); setShowSources(false); }}
                  className={`flex-1 py-2.5 px-3.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === 'month' 
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md shadow-emerald-600/25 scale-[1.01]' 
                      : 'bg-white dark:bg-gray-800 text-stone-600 dark:text-stone-300 hover:text-emerald-700 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 border border-stone-200/80 dark:border-gray-700/80'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  دورة الشهر الحميري
                </button>
                <button
                  onClick={() => { setActiveTab('explore'); setShowSources(false); }}
                  className={`flex-1 py-2.5 px-3.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === 'explore' 
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md shadow-emerald-600/25 scale-[1.01]' 
                      : 'bg-white dark:bg-gray-800 text-stone-600 dark:text-stone-300 hover:text-emerald-700 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 border border-stone-200/80 dark:border-gray-700/80'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  موسوعة المعالم والشهور
                </button>
              </div>
            )}

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-4 space-y-4 flex-1 bg-white dark:bg-gray-900 scrollbar-thin scrollbar-thumb-stone-200 dark:scrollbar-thumb-gray-800">
              
              {showSources ? (
                /* Sources Information */
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 max-w-2xl mx-auto py-2"
                >
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/15 p-5 sm:p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center space-y-4">
                    <div className="w-12 h-12 bg-emerald-100/80 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto text-emerald-700 dark:text-emerald-400">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-stone-900 dark:text-emerald-300">مرجعية الحسابات الفلكية التراثية</h3>
                      <p className="text-xs text-stone-500 dark:text-gray-400 mt-1">يعتمد نظام الحساب على أدق وثائق ومخطوطات الفلك الزراعي اليمني</p>
                    </div>

                    <div className="p-4 bg-white dark:bg-gray-950 rounded-xl border border-stone-200 dark:border-gray-800 text-right max-w-md mx-auto space-y-2">
                      <p className="font-extrabold text-stone-900 dark:text-white text-sm border-b border-stone-100 dark:border-gray-800 pb-1.5">الدائرة الفلكية لمطالع المعالم الزراعية في اليمن</p>
                      <p className="text-xs text-stone-600 dark:text-gray-300"><strong>جمع وتحقيق:</strong> القاضي الفلكي / يحيى بن يحيى العنسي</p>
                      <p className="text-xs text-stone-600 dark:text-gray-300"><strong>دقة المعادلات:</strong> مطابقة تامة للمعالم والأنواء ومواقيت مواسم المطر والبذار وحركة الشمس تدريجياً.</p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-lg inline-block font-bold">
                        معادلات حساب دقيقة للسنوات البسيطة والكبيسة
                      </p>
                    </div>

                    <p className="text-xs leading-relaxed max-w-lg mx-auto text-stone-600 dark:text-gray-400">
                      تعتبر الحكمة اليمانية المنقولة جيلًا بعد جيل عبر أشعار "علي ولد زايد" و"أحمد بن عباد" مدرسة زراعية وفلكية متكاملة لربط مطالع النجوم الـ28 بالتقويم الشمسي والشهور الحميرية القديمة التي يعيد هذا التطبيق إحياءها بدقة واحترافية.
                    </p>
                    <button 
                      onClick={() => setShowSources(false)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs"
                    >
                      العودة للتقويم الحالي
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Dynamic Date Control Bar - Compact */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-50 dark:bg-gray-950 p-2.5 rounded-xl border border-stone-200 dark:border-gray-800">
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <button 
                        onClick={handlePrevDay} 
                        className="p-2 bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-stone-700 dark:text-stone-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg border border-stone-200 dark:border-gray-700 transition-all shadow-2xs"
                        title="اليوم السابق"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={handleToday} 
                        className="px-3.5 py-2 text-xs font-bold bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 rounded-lg border border-stone-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all flex-1 sm:flex-none text-center shadow-2xs"
                      >
                        اليوم الحالي
                      </button>
                      <button 
                        onClick={handleNextDay} 
                        className="p-2 bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-stone-700 dark:text-stone-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg border border-stone-200 dark:border-gray-700 transition-all shadow-2xs"
                        title="اليوم التالي"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="relative w-full sm:w-auto">
                      <input 
                        type="date" 
                        value={(selectedDate || new Date()).toISOString().split('T')[0]}
                        onChange={handleDateChange}
                        className="w-full sm:w-60 pl-3 pr-9 py-1.5 bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 rounded-lg text-xs font-bold text-stone-800 dark:text-gray-200 focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                      />
                      <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
                    </div>
                  </div>

                  {activeTab === 'today' && (
                    /* TAB 1: Detailed Daily Information */
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 lg:grid-cols-12 gap-4"
                    >
                      {/* Left: Compact Season Banner & Dynamic Progress Rings */}
                      <div className="lg:col-span-4 space-y-4">
                        {/* Core Season Card - Beautifully Compacted */}
                        <div className={`relative overflow-hidden rounded-xl p-3.5 border shadow-xs bg-gradient-to-br ${seasonColorClass}`}>
                          <div className="absolute top-1/2 -translate-y-1/2 left-3 opacity-15 transform -scale-x-100">
                            {getSeasonIcon(details.season)}
                          </div>
                          
                          <div className="relative z-10 space-y-2.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 dark:bg-gray-900/95 border border-stone-200/50 dark:border-gray-800/80 text-[10px] font-black tracking-wide text-stone-700 dark:text-gray-300 shadow-3xs">
                              موسم {details.season}
                            </span>
                            
                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl sm:text-4xl font-black tracking-tight">{details.himyariteDay}</span>
                                <span className="text-[10px] font-bold opacity-80">يوم مضى من</span>
                              </div>
                              <h3 className="text-base sm:text-lg font-extrabold mt-0.5">
                                شهر {details.himyariteMonth.name}
                              </h3>
                              <p className="text-[10px] opacity-70 mt-0.5">({details.himyariteMonth.meaning})</p>
                            </div>
                            
                            <div className="pt-2 border-t border-stone-200/40 dark:border-gray-800/40 space-y-0.5">
                              <span className="text-[9px] uppercase font-bold opacity-75">التوافق الميلادي المعادل:</span>
                              <p className="text-xs font-bold opacity-95">
                                {formatGregorianDateWithSyriac(selectedDate)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Progress Cards - Side by Side or Compact Stack */}
                        <div className="grid grid-cols-2 gap-2.5">
                          {/* Marker Progress */}
                          <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center shadow-3xs transition-all ${
                            details.season === 'الربيع' ? 'bg-emerald-50/25 dark:bg-emerald-950/10 border-emerald-100/40 dark:border-emerald-900/30' :
                            details.season === 'الصيف' ? 'bg-orange-50/25 dark:bg-orange-950/10 border-orange-100/40 dark:border-orange-900/30' :
                            details.season === 'الخريف' ? 'bg-amber-50/25 dark:bg-amber-950/10 border-amber-100/40 dark:border-amber-900/30' :
                            'bg-blue-50/25 dark:bg-blue-950/10 border-blue-100/40 dark:border-blue-900/30'
                          }`}>
                            <div className="relative w-14 h-14 mb-1.5">
                              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-stone-200/60 dark:text-gray-800" strokeWidth="6" />
                                <motion.circle 
                                  cx="50" cy="50" r="42" fill="none" stroke="currentColor" 
                                  className={progressColors.markerCircle} 
                                  strokeWidth="7"
                                  strokeDasharray="264 264"
                                  initial={{ strokeDashoffset: 264 }}
                                  animate={{ strokeDashoffset: 264 - (details.markerDay / markerMaxDays) * 264 }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-sm font-black ${progressColors.markerText}`}>{details.markerDay}</span>
                                <span className="text-[8px] font-bold text-stone-400">من {markerMaxDays}</span>
                              </div>
                            </div>
                            <h4 className="text-[9px] font-black text-stone-500 dark:text-gray-400">أيام معلَم {details.marker.manzil}</h4>
                          </div>

                          {/* Month Progress */}
                          <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center shadow-3xs transition-all ${
                            details.season === 'الربيع' ? 'bg-emerald-50/25 dark:bg-emerald-950/10 border-emerald-100/40 dark:border-emerald-900/30' :
                            details.season === 'الصيف' ? 'bg-orange-50/25 dark:bg-orange-950/10 border-orange-100/40 dark:border-orange-900/30' :
                            details.season === 'الخريف' ? 'bg-amber-50/25 dark:bg-amber-950/10 border-amber-100/40 dark:border-amber-900/30' :
                            'bg-blue-50/25 dark:bg-blue-950/10 border-blue-100/40 dark:border-blue-900/30'
                          }`}>
                            <div className="relative w-14 h-14 mb-1.5">
                              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-stone-200/60 dark:text-gray-800" strokeWidth="6" />
                                <motion.circle 
                                  cx="50" cy="50" r="42" fill="none" stroke="currentColor" 
                                  className={progressColors.monthCircle} 
                                  strokeWidth="7"
                                  strokeDasharray="264 264"
                                  initial={{ strokeDashoffset: 264 }}
                                  animate={{ strokeDashoffset: 264 - (details.himyariteDay / monthMaxDays) * 264 }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-sm font-black ${progressColors.monthText}`}>{details.himyariteDay}</span>
                                <span className="text-[8px] font-bold text-stone-400">من {monthMaxDays}</span>
                              </div>
                            </div>
                            <h4 className="text-[9px] font-black text-stone-500 dark:text-gray-400">أيام الشهر الحميري</h4>
                          </div>
                        </div>

                        {/* Dynamic Planting Season Card */}
                        <div className="bg-white dark:bg-gray-950 p-3.5 rounded-xl border border-stone-200 dark:border-gray-800 shadow-3xs space-y-2.5">
                          <div className="flex items-center gap-2 border-b border-stone-100 dark:border-gray-800 pb-1.5">
                            <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-455" />
                            <h4 className="text-xs font-black text-stone-900 dark:text-white">موسم البذار والزراعة اليمني الحالي</h4>
                          </div>
                          <div className="space-y-2">
                            <div className="bg-stone-50/70 dark:bg-gray-900/40 p-2 rounded-lg border border-stone-150/40 dark:border-gray-800/60">
                              <h5 className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 leading-tight text-right">
                                {currentPlantingSeason.title}
                              </h5>
                              <span className="text-[9px] font-bold text-stone-400 dark:text-gray-500 mt-1 block text-right">
                                الفترة: {currentPlantingSeason.period}
                              </span>
                            </div>
                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 text-right">
                              {currentPlantingSeason.details.map((det, i) => (
                                <div key={i} className="text-[10px] leading-relaxed bg-stone-50/20 dark:bg-gray-900/10 p-2 rounded-md border border-stone-100/50 dark:border-gray-850/40">
                                  <p className="font-extrabold text-stone-800 dark:text-gray-200 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    {det.subTitle}
                                  </p>
                                  <p className="font-semibold text-stone-500 dark:text-gray-400 text-[10px] leading-normal mt-0.5">
                                    {det.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                            {/* Regional/Warm Area Planting (Season F) reference note inside the card */}
                            <div className="p-2 bg-amber-50/30 dark:bg-amber-950/10 rounded-lg border border-amber-100/20 text-[9px] font-semibold text-stone-600 dark:text-gray-400 text-right">
                              <span className="font-black text-amber-700 dark:text-amber-400">ملاحظة المناطق الحارة (تهامة وحضرموت):</span> {SEASONS_DATA[5].details[0].text.substring(0, 110)}...
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Splitted details, focus on proverbs & recommendations */}
                      <div className="lg:col-span-8 space-y-4">
                        {/* Current Marker Status Badge & Summary */}
                        <div className={`p-4 rounded-xl border shadow-2xs relative overflow-hidden transition-all bg-gradient-to-br ${
                          details.season === 'الربيع' ? 'from-emerald-50/40 to-teal-50/20 dark:from-emerald-950/10 dark:to-teal-950/5 border-emerald-200/50 dark:border-emerald-900/35' :
                          details.season === 'الصيف' ? 'from-orange-50/40 to-amber-50/20 dark:from-orange-950/10 dark:to-amber-950/5 border-orange-200/50 dark:border-orange-900/35' :
                          details.season === 'الخريف' ? 'from-amber-50/40 to-yellow-50/20 dark:from-amber-950/10 dark:to-yellow-950/5 border-amber-200/50 dark:border-amber-900/35' :
                          'from-blue-50/40 to-indigo-50/20 dark:from-blue-950/10 dark:to-indigo-950/5 border-blue-200/50 dark:border-blue-900/35'
                        }`}>
                          {/* Faint Background Watermark Icon */}
                          <div className="absolute -left-6 -bottom-6 opacity-5 pointer-events-none transform -rotate-12 scale-150">
                            {getSeasonIcon(details.season)}
                          </div>

                          <div className="relative z-10 flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg shrink-0 ${seasonBadgeClass}`}>
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-[10px] font-bold text-stone-400 dark:text-gray-500 uppercase">المَعلم الفلكي والنجم الحالي:</h4>
                              <p className="text-base font-black text-stone-800 dark:text-stone-100 mt-0.5">
                                {details.marker.marker} (منزلة {details.marker.manzil})
                              </p>
                            </div>
                          </div>
                          
                          <div className="relative z-10 flex flex-wrap gap-1.5 mt-3">
                            <span className={`text-[10px] font-extrabold px-2 py-1 rounded-md border ${seasonBadgeClass}`}>
                              موسم: {details.season}
                            </span>
                            {details.marker.solarDegrees && (
                              <span className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-md border border-emerald-100/20 flex items-center gap-1">
                                <Sunrise className="w-3 h-3" />
                                {details.marker.solarDegrees}
                              </span>
                            )}
                            {details.marker.windPattern && (
                              <span className="text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md border border-blue-100/20 flex items-center gap-1">
                                <Wind className="w-3 h-3" />
                                {details.marker.windPattern}
                              </span>
                            )}
                          </div>
                        </div>



                        {/* Detailed Weather / Climatic Description */}
                        {details.marker.desc && (
                          <div className={`p-3.5 rounded-xl border shadow-2xs space-y-1.5 transition-all bg-gradient-to-br ${
                            details.season === 'الربيع' ? 'from-emerald-50/20 to-teal-50/10 dark:from-emerald-950/5 dark:to-teal-950/5 border-emerald-200/30 dark:border-emerald-900/25' :
                            details.season === 'الصيف' ? 'from-orange-50/20 to-amber-50/10 dark:from-orange-950/5 dark:to-amber-950/5 border-orange-200/30 dark:border-orange-900/25' :
                            details.season === 'الخريف' ? 'from-amber-50/20 to-yellow-50/10 dark:from-amber-950/5 dark:to-yellow-950/5 border-amber-200/30 dark:border-amber-900/25' :
                            'from-blue-50/20 to-indigo-50/10 dark:from-blue-950/5 dark:to-indigo-950/5 border-blue-200/30 dark:border-blue-900/25'
                          }`}>
                            <h4 className={`text-[10px] font-bold flex items-center gap-1 ${
                              details.season === 'الربيع' ? 'text-emerald-700 dark:text-emerald-400' :
                              details.season === 'الصيف' ? 'text-orange-700 dark:text-orange-400' :
                              details.season === 'الخريف' ? 'text-amber-700 dark:text-amber-400' :
                              'text-blue-700 dark:text-blue-400'
                            }`}>
                              {details.season === 'الربيع' ? <Sprout className="w-3.5 h-3.5" /> :
                               details.season === 'الصيف' ? <Sun className="w-3.5 h-3.5" /> :
                               details.season === 'الخريف' ? <Leaf className="w-3.5 h-3.5" /> :
                               <CloudRain className="w-3.5 h-3.5" />}
                              الحالة الجوية والمناخ الفلكي في هذه الفترة:
                            </h4>
                            <p className="text-stone-700 dark:text-stone-300 font-bold leading-relaxed text-xs sm:text-sm">
                              {details.marker.desc}
                            </p>
                          </div>
                        )}

                        {/* Practical Recommendations */}
                        {details.marker.recommendations && (
                          <div className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                            details.season === 'الربيع' ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-100/40 dark:border-emerald-900/20' :
                            details.season === 'الصيف' ? 'bg-orange-50/20 dark:bg-orange-950/10 border-orange-100/40 dark:border-orange-900/20' :
                            details.season === 'الخريف' ? 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-100/40 dark:border-amber-900/20' :
                            'bg-blue-50/20 dark:bg-blue-950/10 border-blue-100/40 dark:border-blue-900/20'
                          }`}>
                            <h4 className={`font-extrabold text-xs flex items-center gap-1.5 ${
                              details.season === 'الربيع' ? 'text-emerald-900 dark:text-emerald-300' :
                              details.season === 'الصيف' ? 'text-orange-900 dark:text-orange-300' :
                              details.season === 'الخريف' ? 'text-amber-900 dark:text-amber-300' :
                              'text-blue-900 dark:text-blue-300'
                            }`}>
                              {details.season === 'الربيع' ? <Sprout className="w-4 h-4 text-emerald-600" /> :
                               details.season === 'الصيف' ? <Sun className="w-4 h-4 text-orange-500" /> :
                               details.season === 'الخريف' ? <Leaf className="w-4 h-4 text-amber-600" /> :
                               <CloudRain className="w-4 h-4 text-blue-500" />}
                              إرشادات العمليات الحقلية والزراعية الموصى بها اليوم:
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {details.marker.recommendations.map((rec, idx) => (
                                <div key={idx} className={`flex items-start gap-2 bg-white/85 dark:bg-gray-900/70 p-2.5 rounded-lg border shadow-3xs transition-all ${
                                  details.season === 'الربيع' ? 'border-emerald-100/20 dark:border-emerald-900/10' :
                                  details.season === 'الصيف' ? 'border-orange-100/20 dark:border-orange-900/10' :
                                  details.season === 'الخريف' ? 'border-amber-100/20 dark:border-amber-900/10' :
                                  'border-blue-100/20 dark:border-blue-900/10'
                                }`}>
                                  <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                                    details.season === 'الربيع' ? 'text-emerald-600 dark:text-emerald-400' :
                                    details.season === 'الصيف' ? 'text-orange-500 dark:text-orange-400' :
                                    details.season === 'الخريف' ? 'text-amber-600 dark:text-amber-400' :
                                    'text-blue-500 dark:text-blue-400'
                                  }`} />
                                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                                    {rec}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hadramout Regional Season Reference */}
                        <div className="p-4 rounded-xl border border-stone-200 dark:border-gray-850 bg-stone-50/50 dark:bg-gray-950/25 space-y-2.5">
                          <div className="flex items-center gap-2 border-b border-stone-200/50 dark:border-gray-800 pb-1.5">
                            <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-450" />
                            <h4 className="text-xs font-black text-stone-900 dark:text-white">التقويم الزراعي الإقليمي بمحافظة حضرموت (الشيباني)</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                            <div className="md:col-span-4 bg-white dark:bg-gray-900 p-3 rounded-lg border border-stone-150 dark:border-gray-800 text-center space-y-1">
                              <span className="text-[10px] font-bold text-stone-400 dark:text-gray-500 uppercase">الفصل الزراعي بحضرموت:</span>
                              <p className="text-xs font-black text-blue-800 dark:text-blue-400 leading-tight">{currentHadramoutSeason.season}</p>
                            </div>
                            <div className="md:col-span-8 space-y-1.5 text-right">
                              <p className="text-[11px] font-semibold text-stone-600 dark:text-gray-300 leading-normal">
                                <strong className="text-emerald-700 dark:text-emerald-400">النجوم المحددة:</strong> {currentHadramoutSeason.stars}
                              </p>
                              <p className="text-[11px] font-semibold text-stone-600 dark:text-gray-450 leading-relaxed">
                                <strong className="text-stone-800 dark:text-gray-200">الأهمية والوصف:</strong> {currentHadramoutSeason.desc}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'month' && (
                    /* TAB 2: Detailed Month Information with full Interactive Grid */
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Month Summary Banner - Reimagined with "باقة الشهر المبسطة" */}
                      {(() => {
                        const pkg = SIMPLIFIED_MONTH_PACKAGES.find(p => p.name === details.himyariteMonth.name) || {
                          simpleMeaning: details.himyariteMonth.meaning,
                          simpleClimate: details.himyariteMonth.desc,
                          keyActions: [details.himyariteMonth.agriculturalImportance],
                          famousProverb: '',
                          easyTip: 'التزم بإرشادات الري المنتظم وحراثة التربة.'
                        };

                        return (
                          <div className="space-y-3.5">
                            <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-gray-800 pb-1.5">
                              <h3 className="text-sm font-black text-stone-800 dark:text-gray-300 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                                باقة الشهر المبسطة والذكية لتنظيم المواسم لعام كامل
                              </h3>
                              <span className="text-[10px] bg-emerald-550 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-black">
                                شرح سهل يفهمه الجميع
                              </span>
                            </div>

                            {/* Main Grid for simplified package */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-right">
                              {/* Left column: Meanings, Climate & Proverbs (7 cols) */}
                              <div className="md:col-span-7 space-y-3">
                                {/* Meaning & Climate Card */}
                                <div className={`p-4 rounded-xl border ${seasonLightClass} shadow-3xs flex gap-3.5`}>
                                  <div className="p-2.5 bg-white/80 dark:bg-gray-900/80 rounded-xl shrink-0 h-fit text-amber-600">
                                    {getSeasonIcon(details.season)}
                                  </div>
                                  <div className="space-y-1 text-right flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${seasonBadgeClass}`}>
                                        فصل {details.season}
                                      </span>
                                      <span className="text-[10px] text-stone-400 dark:text-gray-500 font-bold">
                                        القران: {details.himyariteMonth.qiran}
                                      </span>
                                    </div>
                                    <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
                                      شهر {details.himyariteMonth.name}
                                    </h2>
                                    <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 leading-normal">
                                      {pkg.simpleMeaning}
                                    </p>
                                    <p className="text-[11px] font-semibold text-stone-600 dark:text-gray-300 leading-relaxed pt-2 border-t border-stone-200/30 dark:border-gray-800/30 mt-1.5">
                                      <strong className="text-stone-800 dark:text-stone-200 font-bold">الأجواء والطقس ببساطة:</strong> {pkg.simpleClimate}
                                    </p>
                                  </div>
                                </div>

                                {/* Proverbs & Sayings Card */}
                                {pkg.famousProverb && (
                                  <div className="p-3.5 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/30 rounded-xl text-right relative overflow-hidden group">
                                    <Quote className="absolute -top-1 -left-1 w-12 h-12 text-amber-100/40 dark:text-amber-950/10 -rotate-12 pointer-events-none select-none" />
                                    <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 block mb-1">المثل التراثي والشعبي المأثور:</span>
                                    <p className="text-xs italic font-black text-stone-850 dark:text-stone-100 leading-relaxed relative z-10">
                                      « {pkg.famousProverb} »
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Right column: Farmers Actions & Golden Tip (5 cols) */}
                              <div className="md:col-span-5 space-y-3">
                                {/* Key Actions Checklist */}
                                <div className="p-4 bg-white dark:bg-gray-950 border border-stone-200 dark:border-gray-800 rounded-xl space-y-2.5 shadow-3xs">
                                  <span className="text-[10px] font-black text-stone-400 dark:text-gray-500 block">أهم الأعمال والمهام الحقلية والمنزلية:</span>
                                  <div className="space-y-2">
                                    {pkg.keyActions.map((action, i) => (
                                      <div key={i} className="flex items-start gap-2 text-[11px] leading-relaxed">
                                        <div className="p-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-md shrink-0 mt-0.5">
                                          <CheckCircle className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="font-semibold text-stone-700 dark:text-gray-200">{action}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Golden Easy Tip */}
                                <div className="p-3 bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-100/20 dark:border-emerald-900/20 rounded-xl flex gap-2.5 items-start">
                                  <div className="p-1.5 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5">
                                    <Award className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="space-y-0.5 text-right flex-1">
                                    <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 block">نصيحة ذهبية منزلية ميسّرة:</span>
                                    <p className="text-[11px] font-bold text-stone-700 dark:text-gray-300 leading-normal">
                                      {pkg.easyTip}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Interactive Month Day Grid - Redesigned to be compact */}
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-stone-200 dark:border-gray-800 shadow-2xs space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-gray-800 pb-2.5">
                          <div>
                            <h4 className="font-black text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                              <Calendar className="w-4.5 h-4.5 text-emerald-600" />
                              الجدول التفاعلي اليومي لشهر {details.himyariteMonth.name} ({details.himyariteMonth.duration} يوماً)
                            </h4>
                            <p className="text-[10px] text-stone-400 dark:text-gray-500">اختر أي يوم لتحديث تفاصيل المعالم الحالية بالخارج فوراً</p>
                          </div>

                          {/* Legend - Sleeker */}
                          <div className="flex flex-wrap gap-2.5 items-center text-[10px] font-bold text-stone-500">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-600"></span> اليوم المحدد
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span> المعلم الحالي
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-stone-100 dark:bg-gray-800 border border-stone-300 dark:border-gray-700"></span> يوم عادي
                            </span>
                          </div>
                        </div>

                        {/* 7-column grid layout for the days - compact height */}
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-1.5 sm:gap-2">
                          {currentMonthDays.map((dayInfo) => {
                            const isSelected = dayInfo.isSelected;
                            const isToday = dayInfo.isToday;
                            const isMarkerCurrent = dayInfo.marker.manzil === details.marker.manzil;

                            return (
                              <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                key={dayInfo.himyariteDayNumber}
                                onClick={() => handleSelectHimyariteDay(dayInfo)}
                                className={`p-1.5 rounded-lg border text-right transition-all flex flex-col justify-between min-h-[4.25rem] sm:min-h-[4.75rem] ${
                                  isSelected 
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' 
                                    : isToday 
                                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 text-stone-900 dark:text-stone-100'
                                      : 'bg-stone-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-850 border-stone-150 dark:border-gray-800 text-stone-800 dark:text-stone-300'
                                }`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className={`text-sm font-extrabold ${isSelected ? 'text-white' : 'text-stone-900 dark:text-white'}`}>
                                    {dayInfo.himyariteDayNumber}
                                  </span>
                                  {isToday && (
                                    <span className="text-[8px] bg-amber-500 text-white px-1 rounded-sm font-black scale-90">
                                      اليوم
                                    </span>
                                  )}
                                </div>

                                <div className="mt-1 w-full text-right leading-none space-y-0.5">
                                  <div className={`text-[9px] font-bold flex flex-wrap items-center justify-between gap-x-0.5 ${isSelected ? 'text-emerald-100' : 'text-stone-400 dark:text-stone-500'}`}>
                                    <span>{dayInfo.gregorianDate.getDate()} {GREGORIAN_ARABIC_MONTHS[dayInfo.gregorianDate.getMonth() + 1]}</span>
                                    <span className={`text-[8px] font-extrabold ${isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>({SYRIAC_MONTHS[dayInfo.gregorianDate.getMonth() + 1]})</span>
                                  </div>
                                  <span className={`text-[8px] block font-black truncate px-1 py-0.5 rounded-sm text-center ${
                                    isSelected 
                                      ? 'bg-emerald-700 text-white' 
                                      : isMarkerCurrent 
                                        ? 'bg-amber-100/70 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 font-extrabold' 
                                        : 'bg-stone-200/50 dark:bg-gray-700/60 text-stone-500 dark:text-gray-400'
                                  }`}>
                                    {dayInfo.marker.manzil}
                                  </span>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Overlapping Markers for Month */}
                      <div className="bg-stone-50/60 dark:bg-gray-950 p-4 rounded-xl border border-stone-200 dark:border-gray-800 space-y-2.5">
                        <h4 className="font-extrabold text-xs text-stone-700 dark:text-stone-300">النجوم والمنازل التي تتداخل خلال شهر {details.himyariteMonth.name}:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {activeMonthMarkers.map((marker, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-950 p-3 rounded-lg border border-stone-150 dark:border-gray-800 shadow-3xs flex items-start gap-2.5">
                              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 shrink-0 mt-0.5">
                                <Compass className="w-4 h-4" />
                              </div>
                              <div className="space-y-0.5 text-xs">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-black text-stone-900 dark:text-white">{marker.marker}</span>
                                  <span className="text-[9px] bg-stone-100 dark:bg-gray-800 text-stone-600 dark:text-gray-400 px-1.5 py-0.5 rounded-md font-bold">
                                    المنزلة: {marker.manzil}
                                  </span>
                                </div>
                                <p className="text-[11px] text-stone-500 dark:text-gray-400 leading-normal font-semibold">
                                  {marker.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Integrated Four Astronomical Circles */}
                      <div className="bg-white dark:bg-gray-950 p-4 rounded-xl border border-stone-200 dark:border-gray-800 shadow-2xs space-y-3.5">
                        <div className="flex items-center gap-2 border-b border-stone-100 dark:border-gray-800 pb-2 text-right">
                          <Compass className="w-5 h-5 text-amber-500 shrink-0" />
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-stone-900 dark:text-white">الدوائر الفلكية الأربع لتنظيم المواسم والبروج</h4>
                            <p className="text-[10px] text-stone-400 dark:text-gray-500">منظومة الحساب الفلكي اليمني والتقويم الشمسي لضبط الزراعة</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-right">
                          {CIRCLES_DATA.map((c) => (
                            <div 
                              key={c.circleNum} 
                              className="bg-stone-50/50 dark:bg-gray-900/30 p-3.5 rounded-lg border border-stone-150 dark:border-gray-850 shadow-3xs flex flex-col justify-between relative overflow-hidden group min-h-[140px]"
                            >
                              {/* Watermark of circle number */}
                              <div className="absolute -bottom-4 -left-3 text-5xl font-black text-stone-100/60 dark:text-gray-850/20 pointer-events-none select-none">
                                {c.circleNum}
                              </div>

                              <div className="relative z-10 space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-5 h-5 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 rounded-full flex items-center justify-center font-black text-[10px]">
                                    {c.circleNum}
                                  </span>
                                  <h5 className="font-extrabold text-xs text-stone-900 dark:text-white">{c.title}</h5>
                                </div>
                                <p className="text-[10px] font-bold text-stone-600 dark:text-gray-400 leading-normal">{c.desc}</p>
                                
                                <div className="space-y-1 pt-1 border-t border-stone-200/40 dark:border-gray-800/40">
                                  {c.bullets.map((b, idx) => (
                                    <div key={idx} className="flex items-start gap-1 text-[9px] font-semibold text-stone-500 dark:text-gray-500 leading-normal">
                                      <div className="w-1 h-1 rounded-full bg-amber-500 shrink-0 mt-1" />
                                      <span>{b}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'explore' && (
                    /* TAB 3: Browse and Search all 12 Months, 28 Stars, and proverbs */
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Sub tab selectors & Search bar */}
                      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white dark:bg-gray-950 p-3 rounded-xl border border-stone-200 dark:border-gray-800 shadow-2xs">
                        {/* 3 tabs: Markers, Months, Syriac */}
                        <div className="flex flex-wrap gap-1.5 w-full md:w-auto bg-stone-100/90 dark:bg-gray-900 p-1.5 rounded-xl border border-stone-200/60 dark:border-gray-800">
                          <button
                            onClick={() => { setExploreType('markers'); setSearchQuery(''); }}
                            className={`px-3.5 py-2 text-xs font-extrabold rounded-lg transition-all duration-200 ${
                              exploreType === 'markers' 
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-orange-500/25 scale-102' 
                                : 'bg-white dark:bg-gray-800 text-stone-600 dark:text-stone-300 hover:text-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 border border-stone-200/60 dark:border-gray-700'
                            }`}
                          >
                            مطالع الزراعة والمنازل (28 نجم)
                          </button>
                          <button
                            onClick={() => { setExploreType('months'); setSearchQuery(''); }}
                            className={`px-3.5 py-2 text-xs font-extrabold rounded-lg transition-all duration-200 ${
                              exploreType === 'months' 
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-orange-500/25 scale-102' 
                                : 'bg-white dark:bg-gray-800 text-stone-600 dark:text-stone-300 hover:text-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 border border-stone-200/60 dark:border-gray-700'
                            }`}
                          >
                            الشهور الحميرية القديمة (12 شهر)
                          </button>
                          <button
                            onClick={() => { setExploreType('syriac'); setSearchQuery(''); }}
                            className={`px-3.5 py-2 text-xs font-extrabold rounded-lg transition-all duration-200 ${
                              exploreType === 'syriac' 
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-orange-500/25 scale-102' 
                                : 'bg-white dark:bg-gray-800 text-stone-600 dark:text-stone-300 hover:text-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 border border-stone-200/60 dark:border-gray-700'
                            }`}
                          >
                            الشهور السريانية والمشرقية (12 شهر)
                          </button>
                        </div>

                        <div className="relative w-full md:w-64">
                          <input
                            type="text"
                            placeholder={
                              exploreType === 'markers' ? "ابحث عن منزلة (الثريا، الجبهة)..." :
                              exploreType === 'months' ? "ابحث عن شهر حميري..." :
                              "ابحث عن شهر سرياني أو ميلادي..."
                            }
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-3 pr-9 py-2 bg-stone-50 dark:bg-gray-800 border border-stone-200 dark:border-gray-700 rounded-xl text-xs font-bold text-stone-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          />
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Seasonal Filters - Distinctive Vibrant Colors */}
                      <div className="flex gap-2 flex-wrap items-center bg-stone-50/80 dark:bg-gray-950/60 p-2.5 rounded-xl border border-stone-200/60 dark:border-gray-800">
                        <span className="text-[11px] font-black text-stone-500 dark:text-gray-400 flex items-center gap-1.5 ml-1">
                          <Filter className="w-3.5 h-3.5 text-emerald-600" /> تصفية حسب الفصل الزراعي:
                        </span>
                        {['الكل', 'الربيع', 'الصيف', 'الخريف', 'الشتاء'].map((season) => {
                          const isActive = seasonFilter === season;
                          let activeClass = 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25 border-emerald-600';
                          if (season === 'الصيف') activeClass = 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 border-orange-500';
                          else if (season === 'الخريف') activeClass = 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-md shadow-amber-500/25 border-amber-500';
                          else if (season === 'الشتاء') activeClass = 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 border-blue-600';
                          else if (season === 'الكل') activeClass = 'bg-gradient-to-r from-stone-800 to-stone-900 dark:from-gray-700 dark:to-gray-800 text-white shadow-md shadow-stone-600/25 border-stone-800';

                          return (
                            <button
                              key={season}
                              onClick={() => setSeasonFilter(season)}
                              className={`px-3 py-1.5 text-xs font-black rounded-lg border transition-all duration-200 ${
                                isActive 
                                  ? `${activeClass} scale-105` 
                                  : 'bg-white dark:bg-gray-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-gray-800 hover:bg-stone-100 dark:hover:bg-gray-850 hover:border-stone-300'
                              }`}
                            >
                              {season}
                            </button>
                          );
                        })}
                      </div>

                      {exploreType === 'markers' && (
                        /* Astronomical Markers with Featured Current Card */
                        <div className="space-y-4">
                          {/* FEATURED CURRENT MARKER CARD */}
                          <div className={`relative overflow-hidden p-5 rounded-xl border-2 bg-gradient-to-br ${
                            details.season === 'الربيع' ? 'from-emerald-50 to-teal-100/50 dark:from-emerald-950/30 dark:to-teal-900/20 border-emerald-500' :
                            details.season === 'الصيف' ? 'from-orange-50 to-amber-100/50 dark:from-orange-950/30 dark:to-amber-900/20 border-orange-500' :
                            details.season === 'الخريف' ? 'from-amber-50 to-yellow-100/50 dark:from-amber-950/30 dark:to-yellow-900/20 border-amber-500' :
                            'from-blue-50 to-indigo-100/50 dark:from-blue-950/30 dark:to-indigo-900/20 border-blue-500'
                          } shadow-sm`}>
                            {/* Glowing current indicator */}
                            <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black animate-pulse shadow-xs">
                              <Compass className="w-2.5 h-2.5 animate-spin-slow" />
                              <span>نجم المعلم النشط حالياً</span>
                            </div>

                            <div className="absolute -bottom-6 -left-6 opacity-10 pointer-events-none transform rotate-12 scale-150">
                              {getSeasonIcon(details.season)}
                            </div>

                            <div className="space-y-3 relative z-10">
                              <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-xl bg-white dark:bg-gray-900/80 shadow-3xs ${
                                  details.season === 'الربيع' ? 'text-emerald-600' :
                                  details.season === 'الصيف' ? 'text-orange-500' :
                                  details.season === 'الخريف' ? 'text-amber-600' :
                                  'text-blue-500'
                                }`}>
                                  <Compass className="w-5 h-5" />
                                </div>
                                <div>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${seasonBadgeClass}`}>
                                    فصل {details.season}
                                  </span>
                                  <h3 className="text-lg font-black text-stone-900 dark:text-white mt-1">
                                    {details.marker.marker} (المنزلة: {details.marker.manzil})
                                  </h3>
                                </div>
                              </div>

                              <p className="text-xs sm:text-sm text-stone-700 dark:text-gray-200 font-bold leading-relaxed">
                                {details.marker.desc}
                              </p>

                              {details.marker.proverb && (
                                <div className="bg-white/80 dark:bg-gray-900/80 p-2.5 rounded-lg border border-stone-200/40 text-xs italic font-black text-stone-850 dark:text-stone-100 leading-relaxed">
                                  « {details.marker.proverb} »
                                </div>
                              )}

                              {details.marker.recommendations && (
                                <div className="space-y-1.5 pt-2 border-t border-stone-200/40 dark:border-gray-800/40">
                                  <span className="text-[9px] font-black uppercase text-stone-400 dark:text-gray-500">الإرشادات التوجيهية الحالية للعمل الحلقي:</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    {details.marker.recommendations.map((rec, i) => (
                                      <div key={i} className="flex items-start gap-1.5 bg-white/40 dark:bg-gray-900/20 p-2 rounded-md border border-stone-100/20">
                                        <CheckCircle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                          details.season === 'الربيع' ? 'text-emerald-600' :
                                          details.season === 'الصيف' ? 'text-orange-500' :
                                          details.season === 'الخريف' ? 'text-amber-600' :
                                          'text-blue-500'
                                        }`} />
                                        <span className="font-semibold">{rec}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="text-[10px] text-stone-400 font-bold">
                                التوقيت: يبدأ من {details.marker.startDay} {getGregorianMonthWithSyriac(details.marker.startMonth)} ميلادياً {details.marker.solarDegrees && `• درجات الشمس: ${details.marker.solarDegrees}`}
                              </div>
                            </div>
                          </div>

                          <div className="border-b border-stone-200 dark:border-gray-800 pb-2 mt-2">
                            <h4 className="text-xs font-black text-stone-400 dark:text-gray-500">دليل مطالع ومنازل الـ 28 معلماً زراعياً ({filteredMarkers.length}):</h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredMarkers.map((m, idx) => {
                              const arabicSeason = m.type === 'spring' ? 'الربيع' : m.type === 'summer' ? 'الصيف' : m.type === 'autumn' ? 'الخريف' : 'الشتاء';
                              const isCurrent = m.manzil === details.marker.manzil;
                              return (
                                <div 
                                  key={idx} 
                                  className={`p-4 rounded-xl border transition-all ${isCurrent ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-300 shadow-3xs' : 'bg-white dark:bg-gray-950 border-stone-200 dark:border-gray-800'}`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-sm font-black text-stone-900 dark:text-white">{m.marker}</h3>
                                        {isCurrent && (
                                          <span className="text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">المعلم الحالي</span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold mt-0.5">المنزلة الفلكية: {m.manzil}</p>
                                    </div>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${getSeasonBadgeColor(arabicSeason)}`}>
                                      فصل {arabicSeason}
                                    </span>
                                  </div>

                                  {m.proverb && (
                                    <div className="mt-2.5 bg-stone-50 dark:bg-gray-900/60 p-2.5 rounded-lg border border-stone-100 dark:border-gray-800 text-xs text-stone-700 dark:text-gray-300 font-bold italic leading-relaxed">
                                      « {m.proverb} »
                                    </div>
                                  )}

                                  <p className="mt-2 text-xs text-stone-600 dark:text-gray-400 font-semibold leading-relaxed">
                                    {m.desc}
                                  </p>

                                  {m.recommendations && (
                                    <div className="mt-3 space-y-1">
                                      <span className="text-[9px] font-black uppercase text-stone-400 dark:text-stone-500">الإرشادات الزراعية:</span>
                                      <div className="grid grid-cols-1 gap-1 text-[11px] text-stone-600 dark:text-gray-300">
                                        {m.recommendations.slice(0, 2).map((rec, i) => (
                                          <div key={i} className="flex items-center gap-1.5">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                            <span className="font-semibold truncate">{rec}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-stone-400 border-t border-stone-100 dark:border-gray-850 pt-2.5">
                                    <span>يبدأ يوم {m.startDay} {getGregorianMonthWithSyriac(m.startMonth)} ميلادياً</span>
                                    {m.solarDegrees && <span className="text-stone-400/80">{m.solarDegrees}</span>}
                                  </div>
                                </div>
                              );
                            })}
                            {filteredMarkers.length === 0 && (
                              <div className="col-span-2 text-center py-10 text-stone-400 font-bold">لا يوجد نتائج تطابق فلترة البحث.</div>
                            )}
                          </div>
                        </div>
                      )}

                      {exploreType === 'months' && (
                        /* Month Catalogue with Featured Current Card */
                        <div className="space-y-4">
                          {/* FEATURED CURRENT MONTH CARD */}
                          <div className={`relative overflow-hidden p-5 rounded-xl border-2 bg-gradient-to-br ${
                            details.season === 'الربيع' ? 'from-emerald-50 to-teal-100/50 dark:from-emerald-950/30 dark:to-teal-900/20 border-emerald-500' :
                            details.season === 'الصيف' ? 'from-orange-50 to-amber-100/50 dark:from-orange-950/30 dark:to-amber-900/20 border-orange-500' :
                            details.season === 'الخريف' ? 'from-amber-50 to-yellow-100/50 dark:from-amber-950/30 dark:to-yellow-900/20 border-amber-500' :
                            'from-blue-50 to-indigo-100/50 dark:from-blue-950/30 dark:to-indigo-900/20 border-blue-500'
                          } shadow-sm`}>
                            {/* Glowing current indicator */}
                            <div className="absolute top-3 left-3 flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black animate-pulse shadow-xs">
                              <CalendarDays className="w-2.5 h-2.5" />
                              <span>الشهر الحميري النشط حالياً</span>
                            </div>

                            <div className="absolute -bottom-6 -left-6 opacity-10 pointer-events-none transform rotate-12 scale-150">
                              <Calendar className="w-12 h-12" />
                            </div>

                            <div className="space-y-3 relative z-10">
                              <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-xl bg-white dark:bg-gray-900/80 shadow-3xs ${
                                  details.season === 'الربيع' ? 'text-emerald-600' :
                                  details.season === 'الصيف' ? 'text-orange-500' :
                                  details.season === 'الخريف' ? 'text-amber-600' :
                                  'text-blue-500'
                                }`}>
                                  <CalendarDays className="w-5 h-5" />
                                </div>
                                <div>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${seasonBadgeClass}`}>
                                    موسم {details.season}
                                  </span>
                                  <h3 className="text-lg font-black text-stone-900 dark:text-white mt-1">
                                    شهر {details.himyariteMonth.name}
                                  </h3>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed">
                                <div className="bg-white/40 dark:bg-gray-900/20 p-2.5 rounded-lg border border-stone-200/20">
                                  <h4 className="font-extrabold text-stone-500 mb-0.5">المعنى والدلالة التاريخية:</h4>
                                  <p className="font-bold text-stone-850 dark:text-stone-100">{details.himyariteMonth.meaning || 'شهر زراعي قديم'}</p>
                                </div>
                                <div className="bg-white/40 dark:bg-gray-900/20 p-2.5 rounded-lg border border-stone-200/20">
                                  <h4 className="font-extrabold text-stone-500 mb-0.5">القران المقترن به:</h4>
                                  <p className="font-bold text-emerald-700 dark:text-emerald-400">{details.himyariteMonth.qiran}</p>
                                </div>
                              </div>

                              <div className="space-y-2 text-xs leading-relaxed">
                                <p className="font-semibold">
                                  <strong>الملخص المناخي:</strong> {details.himyariteMonth.desc}
                                </p>
                                {details.himyariteMonth.agriculturalImportance && (
                                  <p className="p-2 rounded-lg bg-emerald-50/10 dark:bg-emerald-950/10 border border-emerald-100/10 font-semibold text-emerald-900 dark:text-emerald-300">
                                    <strong>الأهمية الزراعية للشهر:</strong> {details.himyariteMonth.agriculturalImportance}
                                  </p>
                                )}
                              </div>

                              {/* Detailed Gregorian dates & progress info */}
                              <div className="border-t border-stone-200/40 dark:border-gray-800/40 pt-3 mt-3 space-y-2.5">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-bold text-stone-600 dark:text-gray-400">
                                  <div className="bg-stone-50/50 dark:bg-gray-900/40 p-2 rounded-lg border border-stone-100/50 dark:border-gray-800/30">
                                    <span className="text-stone-400 dark:text-gray-500 block text-[9px] font-black mb-0.5">تاريخ البداية ميلادياً:</span>
                                    <span>{getHimyariteMonthGregorianDates(details.himyariteMonth).startStr}</span>
                                  </div>
                                  <div className="bg-stone-50/50 dark:bg-gray-900/40 p-2 rounded-lg border border-stone-100/50 dark:border-gray-800/30">
                                    <span className="text-stone-400 dark:text-gray-500 block text-[9px] font-black mb-0.5">تاريخ النهاية ميلادياً:</span>
                                    <span>{getHimyariteMonthGregorianDates(details.himyariteMonth).endStr}</span>
                                  </div>
                                  <div className="bg-stone-50/50 dark:bg-gray-900/40 p-2 rounded-lg border border-stone-100/50 dark:border-gray-800/30">
                                    <span className="text-stone-400 dark:text-gray-500 block text-[9px] font-black mb-0.5">عدد أيام الشهر:</span>
                                    <span>{details.himyariteMonth.duration} يوماً</span>
                                  </div>
                                </div>

                                <div className="bg-emerald-50/30 dark:bg-emerald-950/10 p-2.5 rounded-lg border border-emerald-100/20 text-[11px] space-y-2">
                                  <div className="flex justify-between items-center font-bold text-emerald-900 dark:text-emerald-300">
                                    <span>مؤشر الأيام المتبقية والمضت للشهر:</span>
                                    <span>
                                      مضى <span className="font-black text-xs text-emerald-700 dark:text-emerald-400">{details.himyariteDay}</span> يوماً • بقي <span className="font-black text-xs text-amber-600 dark:text-amber-400">{details.himyariteMonth.duration - details.himyariteDay}</span> يوماً
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-stone-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all"
                                      style={{ width: `${(details.himyariteDay / details.himyariteMonth.duration) * 100}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-stone-400 font-bold pt-1">
                                  <span>يبدأ يوم {details.himyariteMonth.startDay} من {getGregorianMonthWithSyriac(details.himyariteMonth.startMonth)} ميلادياً</span>
                                  <button
                                    onClick={() => handleSelectHimyariteMonth(details.himyariteMonth)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg transition-all flex items-center gap-1 shadow-xs"
                                  >
                                    معاينة الشهر في التقويم
                                    <ArrowLeft className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="border-b border-stone-200 dark:border-gray-800 pb-2 mt-2">
                            <h4 className="text-xs font-black text-stone-400 dark:text-gray-500">موسوعة الاثني عشر شهراً حميرياً قديماً ({filteredMonths.length}):</h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredMonths.map((m, idx) => {
                              const isCurrent = m.name === details.himyariteMonth.name;
                              const pkg = SIMPLIFIED_MONTH_PACKAGES.find(p => p.name === m.name) || {
                                simpleMeaning: m.meaning,
                                simpleClimate: m.desc,
                                keyActions: [m.agriculturalImportance],
                                famousProverb: '',
                                easyTip: 'التزم بإرشادات العمل الزراعي والري.'
                              };

                              return (
                                <div 
                                  key={idx} 
                                  className={`p-4 rounded-xl border text-right flex flex-col justify-between transition-all ${isCurrent ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-300 shadow-3xs' : 'bg-white dark:bg-gray-950 border-stone-200 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-900/30'}`}
                                >
                                  <div>
                                    <div className="flex items-start justify-between gap-2 border-b border-stone-100 dark:border-gray-800 pb-2">
                                      <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <h3 className="text-sm font-black text-stone-900 dark:text-white">{m.name}</h3>
                                          {isCurrent && (
                                            <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">الشهر الحالي</span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-extrabold mt-0.5">{pkg.simpleMeaning}</p>
                                      </div>
                                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${getSeasonBadgeColor(m.season)}`}>
                                          فصل {m.season}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="mt-3 space-y-2.5 text-xs text-stone-600 dark:text-gray-300 leading-relaxed">
                                      <p className="font-semibold text-[11px] bg-stone-50/50 dark:bg-gray-900/30 p-2 rounded-lg border border-stone-100/30 dark:border-gray-800/30">
                                        <strong className="text-stone-850 dark:text-stone-200">الطقس والأجواء: </strong>{pkg.simpleClimate}
                                      </p>
                                      
                                      <div className="space-y-1.5 pt-1">
                                        <span className="text-[10px] font-black text-stone-400 dark:text-gray-500 block">أهم الأعمال والعمليات خلال الشهر:</span>
                                        <div className="space-y-1">
                                          {pkg.keyActions.map((action, actionIdx) => (
                                            <div key={actionIdx} className="flex items-start gap-1.5 text-[11px]">
                                              <Sprout className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                              <span className="font-semibold text-stone-700 dark:text-stone-200">{action}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {pkg.famousProverb && (
                                        <div className="bg-amber-50/20 dark:bg-amber-950/5 p-2 rounded-lg border border-amber-100/15 text-[11px] italic font-bold text-stone-800 dark:text-stone-200 leading-relaxed">
                                          « {pkg.famousProverb} »
                                        </div>
                                      )}

                                      <div className="bg-emerald-50/15 dark:bg-emerald-950/10 p-2 rounded-lg border border-emerald-100/10 text-[11px] font-semibold text-stone-600 dark:text-gray-300">
                                        <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 block mb-0.5">💡 نصيحة ميسّرة للجميع:</span>
                                        {pkg.easyTip}
                                      </div>
                                    </div>

                                    <div className="mt-3 border-t border-stone-100 dark:border-gray-800/60 pt-2.5 space-y-1.5 text-[11px] font-semibold text-stone-500 dark:text-gray-400">
                                      <div className="grid grid-cols-2 gap-1.5 bg-stone-50/50 dark:bg-gray-900/25 p-1.5 rounded-lg border border-stone-100/50 dark:border-gray-800/30">
                                        <div>
                                          <span className="text-stone-400 dark:text-gray-500 block text-[9px] font-black">يبدأ من:</span>
                                          <span className="font-extrabold text-stone-850 dark:text-stone-200">{getHimyariteMonthGregorianDates(m).startStr}</span>
                                        </div>
                                        <div>
                                          <span className="text-stone-400 dark:text-gray-500 block text-[9px] font-black">وينتهي في:</span>
                                          <span className="font-extrabold text-stone-850 dark:text-stone-200">{getHimyariteMonthGregorianDates(m).endStr}</span>
                                        </div>
                                      </div>
                                      
                                      <div className="flex justify-between items-center text-[10px] font-bold text-stone-450 dark:text-gray-500 px-1">
                                        <span>عدد الأيام: {m.duration} يوماً</span>
                                        <span className="text-emerald-600 dark:text-emerald-400">{m.qiran}</span>
                                      </div>

                                      {isCurrent && (
                                        <div className="bg-emerald-50/30 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-200/20 text-[10px] space-y-1.5 mt-2">
                                          <div className="flex justify-between items-center font-bold text-emerald-800 dark:text-emerald-300">
                                            <span>أيام هذا الشهر:</span>
                                            <span>
                                              مضى <span className="font-black text-xs text-emerald-700 dark:text-emerald-455">{details.himyariteDay}</span> يوماً • بقي <span className="font-black text-xs text-amber-600 dark:text-amber-455">{m.duration - details.himyariteDay}</span> يوماً
                                            </span>
                                          </div>
                                          <div className="w-full h-1 bg-stone-200 dark:bg-gray-850 rounded-full overflow-hidden">
                                            <div 
                                              className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all"
                                              style={{ width: `${(details.himyariteDay / m.duration) * 100}%` }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleSelectHimyariteMonth(m)}
                                    className="mt-3.5 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/40 dark:hover:bg-emerald-700 text-emerald-800 dark:text-emerald-300 hover:dark:text-white text-[11px] font-black rounded-lg border border-emerald-200/60 dark:border-emerald-800/50 transition-all flex items-center justify-center gap-1.5 w-full shadow-2xs group"
                                  >
                                    <Calendar className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white transition-colors" />
                                    معاينة هذا الشهر في التقويم
                                    <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                                  </button>
                                </div>
                              );
                            })}
                            {filteredMonths.length === 0 && (
                              <div className="col-span-2 text-center py-10 text-stone-400 font-bold">لا يوجد نتائج تطابق فلترة البحث.</div>
                            )}
                          </div>
                        </div>
                      )}

                      {exploreType === 'syriac' && (
                        /* Syriac/Gregorian Months Reference cards with Search & Filters */
                        <div className="space-y-4">
                          <div className="border-b border-stone-200 dark:border-gray-800 pb-2 mt-2">
                            <h4 className="text-xs font-black text-stone-400 dark:text-gray-500">دليل الشهور السريانية والمشرقية المقابلة للميلادية ({filteredSyriacMonths.length}):</h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredSyriacMonths.map((m, idx) => {
                              const currentMonthNum = new Date().getMonth() + 1;
                              const isCurrent = m.number === currentMonthNum;
                              let seasonName = 'الشتاء';
                              if (m.number >= 3 && m.number <= 5) seasonName = 'الربيع';
                              else if (m.number >= 6 && m.number <= 8) seasonName = 'الصيف';
                              else if (m.number >= 9 && m.number <= 11) seasonName = 'الخريف';

                              return (
                                <div 
                                  key={idx} 
                                  className={`p-4 rounded-xl border text-right flex flex-col justify-between transition-all relative overflow-hidden group ${isCurrent ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-300 shadow-3xs' : 'bg-white dark:bg-gray-950 border-stone-200 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-900/30'}`}
                                >
                                  {/* Giant watermark of the month number */}
                                  <div className="absolute -bottom-6 -left-4 text-7xl font-black text-stone-100/70 dark:text-gray-900/35 pointer-events-none select-none transition-transform group-hover:scale-110">
                                    {m.number.toString().padStart(2, '0')}
                                  </div>

                                  <div className="relative z-10">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <h3 className="text-sm font-black text-stone-900 dark:text-white">{m.syriac}</h3>
                                          {isCurrent && (
                                            <span className="text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">الشهر الحالي</span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold mt-0.5">الشهر الميلادي: {m.gregorian}</p>
                                      </div>
                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 ${getSeasonBadgeColor(seasonName)}`}>
                                        {seasonName}
                                      </span>
                                    </div>

                                    <div className="mt-3 space-y-1.5 border-t border-stone-100 dark:border-gray-800/80 pt-2.5 text-xs text-stone-600 dark:text-gray-300 leading-relaxed">
                                      <p className="font-semibold text-stone-800 dark:text-gray-200">
                                        <strong>الدلالة والمعنى: </strong>{m.meaning}
                                      </p>
                                      <p className="font-semibold text-stone-500 dark:text-gray-400 text-[11px] leading-normal">
                                        <strong>الأجواء والمناخ: </strong>{m.desc}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => {
                                      const currentYear = new Date().getFullYear();
                                      // set selection to the first day of that month
                                      setSelectedDate(new Date(currentYear, m.number - 1, 1));
                                      setActiveTab('today');
                                    }}
                                    className="mt-4 py-1.5 px-3 bg-stone-50 hover:bg-emerald-600 hover:text-white dark:bg-gray-900/40 dark:hover:bg-emerald-700 text-stone-700 dark:text-stone-300 hover:dark:text-white text-[11px] font-black rounded-lg border border-stone-200/60 dark:border-gray-800/50 transition-all flex items-center justify-center gap-1 w-full"
                                  >
                                    معاينة الشهر في التقويم
                                    <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
                                  </button>
                                </div>
                              );
                            })}
                            {filteredSyriacMonths.length === 0 && (
                              <div className="col-span-full text-center py-10 text-stone-400 font-bold">لا يوجد نتائج تطابق فلترة البحث.</div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
