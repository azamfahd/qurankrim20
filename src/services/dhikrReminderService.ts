import { DhikrItem, DhikrReminderSettings, DhikrReciterInfo } from '../types';

export const DEFAULT_DHIKR_SETTINGS: DhikrReminderSettings = {
  enabled: false,
  triggerOnAppOpen: false, // التنبيه عند فتح التطبيق مباشرة (مغلق ومستقل ليمنع أي إزعاج)
  intervalMinutes: 15,
  soundType: 'voice_and_chime',
  category: 'all',
  reciterId: 'mishary', // الصوت التلقائي الأساسي والمباشر للشيخ مشاري راشد العفاسي
  volume: 85,
  vibrate: true,
  quietHoursEnabled: true,
  quietHoursStart: '23:00',
  quietHoursEnd: '06:00',
  showFloatingBanner: true,
  compactBanner: false,
  autoDismissSeconds: 12,
  selectedDhikrIds: []
};

/**
 * قائمة كبار القراء والمشايخ المتاحين بأصوات حقيقية مسجلة مدمجة في النظام
 */
export const DHIKR_RECITERS: DhikrReciterInfo[] = [
  {
    id: 'mishary',
    name: 'الشيخ مشاري راشد العفاسي',
    title: 'الصوت التلقائي الأساسي - نبرة خاشعة تريح القلب',
    description: 'تلاوة وأذكار بصوت الشيخ مشاري العفاسي محملة ومدمجة بشكل أساسي في النظام جاهزة للعمل فوراً بدون إنترنت',
    avatar: '🎙️',
    previewUrl: '/audio/adhkar/mishary_preview.mp3',
    audioUrls: {
      salawat: '/audio/adhkar/mishary_salawat.mp3',
      istighfar: '/audio/adhkar/mishary_istighfar.mp3',
      baqiyat: '/audio/adhkar/mishary_baqiyat.mp3',
      hawqala: '/audio/adhkar/mishary_hawqala.mp3',
      tahsin: '/audio/adhkar/mishary_tahsin.mp3',
      preview: '/audio/adhkar/mishary_preview.mp3'
    },
    isBuiltIn: true
  },
  {
    id: 'maher',
    name: 'الشيخ ماهر المعيقلي',
    title: 'إمام المسجد الحرام بمكة المكرمة',
    description: 'تلاوة وأذكار شجية من رحاب البيت الحرام مدمجة محلياً',
    avatar: '🕋',
    previewUrl: '/audio/adhkar/maher_preview.mp3',
    audioUrls: {
      salawat: '/audio/adhkar/maher_salawat.mp3',
      istighfar: '/audio/adhkar/maher_istighfar.mp3',
      baqiyat: '/audio/adhkar/maher_baqiyat.mp3',
      hawqala: '/audio/adhkar/maher_hawqala.mp3',
      tahsin: '/audio/adhkar/maher_tahsin.mp3',
      preview: '/audio/adhkar/maher_preview.mp3'
    },
    isBuiltIn: true
  },
  {
    id: 'abdulbasit',
    name: 'الشيخ عبد الباسط عبد الصمد',
    title: 'صوت مكة الخالد وسفير القرآن',
    description: 'نبرة تاريخية ذهبية تفيض خشوعاً وجلالاً مدمجة محلياً',
    avatar: '📜',
    previewUrl: '/audio/adhkar/abdulbasit_preview.mp3',
    audioUrls: {
      salawat: '/audio/adhkar/abdulbasit_salawat.mp3',
      istighfar: '/audio/adhkar/abdulbasit_istighfar.mp3',
      baqiyat: '/audio/adhkar/abdulbasit_baqiyat.mp3',
      hawqala: '/audio/adhkar/abdulbasit_hawqala.mp3',
      tahsin: '/audio/adhkar/abdulbasit_tahsin.mp3',
      preview: '/audio/adhkar/abdulbasit_preview.mp3'
    },
    isBuiltIn: true
  },
  {
    id: 'husary',
    name: 'الشيخ محمود خليل الحصري',
    title: 'شيخ عموم المقارئ المصرية وإمام الترتيل المتقن',
    description: 'أداء متقن ورصين يملأ القلب سكينة وخشوعاً مدمج محلياً',
    avatar: '📖',
    previewUrl: '/audio/adhkar/husary_preview.mp3',
    audioUrls: {
      salawat: '/audio/adhkar/husary_salawat.mp3',
      istighfar: '/audio/adhkar/husary_istighfar.mp3',
      baqiyat: '/audio/adhkar/husary_baqiyat.mp3',
      hawqala: '/audio/adhkar/husary_hawqala.mp3',
      tahsin: '/audio/adhkar/husary_tahsin.mp3',
      preview: '/audio/adhkar/husary_preview.mp3'
    },
    isBuiltIn: true
  },
  {
    id: 'minshawi',
    name: 'الشيخ محمد صديق المنشاوي',
    title: 'الصوت الباكي ذو الخشوع والوقار العالي',
    description: 'تلاوة وأذكار ترق لها القلوب وتخشع لسماعها مدمجة محلياً',
    avatar: '🕊️',
    previewUrl: '/audio/adhkar/minshawi_preview.mp3',
    audioUrls: {
      salawat: '/audio/adhkar/minshawi_salawat.mp3',
      istighfar: '/audio/adhkar/minshawi_istighfar.mp3',
      baqiyat: '/audio/adhkar/minshawi_baqiyat.mp3',
      hawqala: '/audio/adhkar/minshawi_hawqala.mp3',
      tahsin: '/audio/adhkar/minshawi_tahsin.mp3',
      preview: '/audio/adhkar/minshawi_preview.mp3'
    },
    isBuiltIn: true
  },
  {
    id: 'alghamdi',
    name: 'الشيخ سعد الغامدي',
    title: 'تلاوة متقنة هادئة وسكينة للنفس',
    description: 'أذكار وأدعية بصوت الشيخ سعد الغامدي الصافي مدمجة محلياً',
    avatar: '🌿',
    previewUrl: '/audio/adhkar/alghamdi_preview.mp3',
    audioUrls: {
      salawat: '/audio/adhkar/alghamdi_salawat.mp3',
      istighfar: '/audio/adhkar/alghamdi_istighfar.mp3',
      baqiyat: '/audio/adhkar/alghamdi_baqiyat.mp3',
      hawqala: '/audio/adhkar/alghamdi_hawqala.mp3',
      tahsin: '/audio/adhkar/alghamdi_tahsin.mp3',
      preview: '/audio/adhkar/alghamdi_preview.mp3'
    },
    isBuiltIn: true
  },
  {
    id: 'qatami',
    name: 'الشيخ ناصر القطامي',
    title: 'نبرة خاشعة ورقيقة تأسر القلوب',
    description: 'تسجيلات مميزة بصوت ندي وخشوع مؤثر مدمجة محلياً',
    avatar: '✨',
    previewUrl: '/audio/adhkar/qatami_preview.mp3',
    audioUrls: {
      salawat: '/audio/adhkar/qatami_salawat.mp3',
      istighfar: '/audio/adhkar/qatami_istighfar.mp3',
      baqiyat: '/audio/adhkar/qatami_baqiyat.mp3',
      hawqala: '/audio/adhkar/qatami_hawqala.mp3',
      tahsin: '/audio/adhkar/qatami_tahsin.mp3',
      preview: '/audio/adhkar/qatami_preview.mp3'
    },
    isBuiltIn: true
  },
  {
    id: 'sudais',
    name: 'الشيخ عبد الرحمن السديس',
    title: 'إمام وخطيب المسجد الحرام',
    description: 'أدعية وأذكار بصوت الشيخ السديس المكي الشهير مدمجة محلياً',
    avatar: '🕌',
    previewUrl: '/audio/adhkar/sudais_preview.mp3',
    audioUrls: {
      salawat: '/audio/adhkar/sudais_salawat.mp3',
      istighfar: '/audio/adhkar/sudais_istighfar.mp3',
      baqiyat: '/audio/adhkar/sudais_baqiyat.mp3',
      hawqala: '/audio/adhkar/sudais_hawqala.mp3',
      tahsin: '/audio/adhkar/sudais_tahsin.mp3',
      preview: '/audio/adhkar/sudais_preview.mp3'
    },
    isBuiltIn: true
  },
  {
    id: 'random',
    name: 'منوع بين كبار المشايخ (تبديل تلقائي)',
    title: 'تبديل تلقائي بين أصوات المشايخ الثمانية مع كل تذكير',
    description: 'استمع في كل مرة لصوت قارئ مختلف من خيرة الأصوات المسجلة',
    avatar: '🔀',
    previewUrl: '/audio/adhkar/mishary_preview.mp3',
    isBuiltIn: true
  }
];

/**
 * قاعدة بيانات شاملة وموثقة للأذكار الشريفة المصنفة حسب الوقت والمناسبة
 */
export const DHIKR_DATABASE: DhikrItem[] = [
  // -------------------------------------------------------------
  // 1. الصلاة على النبي ﷺ (Prophet Salawat)
  // -------------------------------------------------------------
  {
    id: 'salawat_1',
    text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا وَحَبِيبِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ',
    spokenText: 'اللهم صلِّ وسلِّم وبارك على نبينا محمد',
    category: 'prophet_salawat',
    categoryName: 'الصلاة على النبي ﷺ',
    virtue: '«مَنْ صَلَّى عَلَيَّ صَلَاةً صَلَّى اللَّهُ عَلَيْهِ بِهَا عَشْرًا وَحَطَّ عَنْهُ عَشْرَ خَطِيئَاتٍ»',
    source: 'صحيح مسلم وسنن النسائي',
    timeContext: 'any'
  },
  {
    id: 'salawat_2',
    text: 'صَلِّ عَلَى رَسُولِ اللَّهِ ﷺ ، وَعَطِّرْ قَلْبَكَ وَلِسَانَكَ وَيَوْمَكَ بِذِكْرِهِ الشَّرِيفِ',
    spokenText: 'صلِّ على رسول الله، صلى الله عليه وسلم',
    category: 'prophet_salawat',
    categoryName: 'الصلاة على النبي ﷺ',
    virtue: '«أَوْلَى النَّاسِ بِي يَوْمَ الْقِيَامَةِ أَكْثَرُهُمْ عَلَيَّ صَلَاةً»',
    source: 'سنن الترمذي',
    timeContext: 'any'
  },
  {
    id: 'salawat_3',
    text: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
    spokenText: 'اللهم صلِّ على محمد وعلى آل محمد كما صليت على إبراهيم وعلى آل إبراهيم إنك حميد مجيد',
    category: 'prophet_salawat',
    categoryName: 'الصلاة على النبي ﷺ (الصلاة الإبراهيمية)',
    virtue: 'أكمل وأفضل صيغ الصلاة على النبي ﷺ التي علمها لأصحابه',
    source: 'متفق عليه (البخاري ومسلم)',
    timeContext: 'friday'
  },
  {
    id: 'salawat_4',
    text: 'يَا رَبِّ صَلِّ وَسَلِّمْ دَائِمًا أَبَدًا عَلَى حَبِيبِكَ خَيْرِ الْخَلْقِ كُلِّهِمِ ، نَبِيِّ الرَّحْمَةِ وَشَفِيعِ الأُمَّةِ',
    spokenText: 'يا رب صلِّ وسلِّم دائماً أبداً على حبيبك خير الخلق كلهم',
    category: 'prophet_salawat',
    categoryName: 'الصلاة على النبي ﷺ',
    virtue: 'تفريج الكرب ومغفرة الذنب وكفاية ما أهم العبد من أمر الدنيا والآخرة',
    source: 'حديث أبي بن كعب - مستدرك الحاكم',
    timeContext: 'any'
  },
  {
    id: 'salawat_5',
    text: 'الصَّلَاةُ وَالسَّلَامُ عَلَيْكَ يَا رَسُولَ اللَّهِ ، الصَّلَاةُ وَالسَّلَامُ عَلَيْكَ يَا خَاتَمَ الأَنْبِيَاءِ وَالْمُرْسَلِينَ',
    spokenText: 'الصلاة والسلام عليك يا رسول الله، يا خاتم الأنبياء والمرسلين',
    category: 'prophet_salawat',
    categoryName: 'الصلاة على النبي ﷺ',
    virtue: 'نيل شفاعة الحبيب المصطفى ﷺ يوم القيامة ورفعة الدرجات في الجنة',
    source: 'الأحاديث الشريفة',
    timeContext: 'any'
  },
  {
    id: 'salawat_6',
    text: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ بِعَدَدِ مَنْ صَلَّى عَلَيْهِ ، وَصَلِّ عَلَى مُحَمَّدٍ بِعَدَدِ مَنْ لَمْ يُصَلِّ عَلَيْهِ ، وَصَلِّ عَلَى مُحَمَّدٍ كَمَا تُحِبُّ وَتَرْضَى',
    spokenText: 'اللهم صلِّ على محمد بعدد من صلى عليه، وصلِّ عليه بعدد من لم يصلِّ عليه',
    category: 'prophet_salawat',
    categoryName: 'الصلاة على النبي ﷺ',
    virtue: 'صلاة مضاعفة جامعة لفضائل الأذكار والصلوات',
    source: 'المأثورات النبوية',
    timeContext: 'friday'
  },
  {
    id: 'salawat_7',
    text: '﴿إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا﴾',
    spokenText: 'إن الله وملائكته يصلون على النبي يا أيها الذين آمنوا صلوا عليه وسلموا تسليما',
    category: 'prophet_salawat',
    categoryName: 'الصلاة على النبي ﷺ (آية قرآنية)',
    virtue: 'أمر رباني كريم بالصلاة والسلام على رسول الله ﷺ',
    source: 'سورة الأحزاب: 56',
    timeContext: 'friday'
  },

  // -------------------------------------------------------------
  // 2. الاستغفار والتوبة والرجوع إلى الله (Istighfar)
  // -------------------------------------------------------------
  {
    id: 'istighfar_1',
    text: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ ، خَلَقْتَنِي وَأَنَا عَبْدُكَ ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    spokenText: 'اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت',
    category: 'istighfar',
    categoryName: 'سيد الاستغفار',
    virtue: 'من قالها موقناً بها حين يمسي أو يصبح فمات دخل الجنة',
    source: 'صحيح البخاري',
    timeContext: 'any'
  },
  {
    id: 'istighfar_2',
    text: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيَّ الْقَيُّومَ وَأَتُوبُ إِلَيْهِ',
    spokenText: 'أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه',
    category: 'istighfar',
    categoryName: 'الاستغفار والتوبة',
    virtue: '«مَنْ قَالَهَا غُفِرَتْ ذُنُوبُهُ وَإِنْ كَانَ فَرَّ مِنَ الزَّحْفِ»',
    source: 'سنن أبي داود والترمذي',
    timeContext: 'any'
  },
  {
    id: 'istighfar_3',
    text: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    spokenText: 'أستغفر الله وأتوب إليه',
    category: 'istighfar',
    categoryName: 'الاستغفار والتوبة',
    virtue: '«طُوبَى لِمَنْ وَجَدَ فِي صَحِيفَتِهِ اسْتِغْفَارًا كَثِيرًا»',
    source: 'سنن ابن ماجه',
    timeContext: 'any'
  },
  {
    id: 'istighfar_4',
    text: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
    spokenText: 'رب اغفر لي وتب عليّ إنك أنت التواب الرحيم',
    category: 'istighfar',
    categoryName: 'الاستغفار والتوبة',
    virtue: 'كان يُعدّ للنبي ﷺ في المجلس الواحد مائة مرة',
    source: 'سنن أبي داود والترمذي',
    timeContext: 'any'
  },
  {
    id: 'istighfar_5',
    text: 'اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا ، وَلَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ ، فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ وَارْحَمْنِي إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ',
    spokenText: 'اللهم إني ظلمت نفسي ظلماً كثيراً، ولا يغفر الذنوب إلا أنت، فاغفر لي مغفرة من عندك وارحمني',
    category: 'istighfar',
    categoryName: 'الاستغفار والتوبة',
    virtue: 'دعاء علمه النبي ﷺ لأبي بكر الصديق رضي الله عنه ليقوله في صلاته',
    source: 'صحيح البخاري ومسلم',
    timeContext: 'any'
  },
  {
    id: 'istighfar_6',
    text: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ لِي وَلِوَالِدَيَّ وَلِجَمِيعِ الْمُسْلِمِينَ وَالْمُسْلِمَاتِ ، وَالْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ الأَحْيَاءِ مِنْهُمْ وَالأَمْوَاتِ',
    spokenText: 'أستغفر الله العظيم لي ولوالدي وللمؤمنين والمؤمنات الأحياء منهم والأموات',
    category: 'istighfar',
    categoryName: 'الاستغفار الشامل',
    virtue: 'كتب الله له بكل مؤمن ومؤمنة حسنة',
    source: 'مجمع الزوائد للطبراني',
    timeContext: 'any'
  },

  // -------------------------------------------------------------
  // 3. الباقيات الصالحات والتسبيح والتحميد (Baqiyat)
  // -------------------------------------------------------------
  {
    id: 'baqiyat_1',
    text: 'سُبْحَانَ اللَّهِ ، وَالْحَمْدُ لِلَّهِ ، وَلَا إِلَهَ إِلَّا اللَّهُ ، وَاللَّهُ أَكْبَرُ',
    spokenText: 'سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر',
    category: 'baqiyat',
    categoryName: 'الباقيات الصالحات',
    virtue: 'أحب الكلام إلى الله، وغراس الجنة، وتساقط الخطايا كما تساقط أوراق الشجر',
    source: 'صحيح مسلم والترمذي',
    timeContext: 'any'
  },
  {
    id: 'baqiyat_2',
    text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    spokenText: 'سبحان الله وبحمده ، سبحان الله العظيم',
    category: 'baqiyat',
    categoryName: 'الباقيات الصالحات',
    virtue: '«كَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ ، ثَقِيلَتَانِ فِي الْمِيزَانِ ، حَبِيبَتَانِ إِلَى الرَّحْمَنِ»',
    source: 'متفق عليه (خاتمة صحيح البخاري)',
    timeContext: 'any'
  },
  {
    id: 'baqiyat_3',
    text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    spokenText: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير',
    category: 'baqiyat',
    categoryName: 'تهليل وتوحيد',
    virtue: 'تعدل عتق عشر رقاب، وتكتب مائة حسنة، وتمحو مائة سيئة، وحرز من الشيطان',
    source: 'صحيح البخاري ومسلم',
    timeContext: 'any'
  },
  {
    id: 'baqiyat_4',
    text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ ، وَرِضَا نَفْسِهِ ، وَزِنَةَ عَرْشِهِ ، وَمِدَادَ كَلِمَاتِهِ',
    spokenText: 'سبحان الله وبحمده عدد خلقه ورضا نفسه وزنة عرشه ومداد كلماته',
    category: 'baqiyat',
    categoryName: 'الباقيات الصالحات',
    virtue: 'تزن وتعدل ساعات طويلة من العبادة والذكر المتواصل',
    source: 'صحيح مسلم عن جويرية رضي الله عنها',
    timeContext: 'morning'
  },
  {
    id: 'baqiyat_5',
    text: 'الْحَمْدُ لِلَّهِ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ كَمَا يَنْبَغِي لِجَلَالِ وَجْهِكَ وَعَظِيمِ سُلْطَانِكَ',
    spokenText: 'الحمد لله حمداً كثيراً طيباً مباركاً فيه',
    category: 'baqiyat',
    categoryName: 'التحميد والثناء',
    virtue: 'ابتدرها بضعة وثلاثون ملكاً أيهم يكتبها أولاً لعظيم أجرها',
    source: 'صحيح البخاري',
    timeContext: 'any'
  },
  {
    id: 'baqiyat_6',
    text: 'اللَّهُ أَكْبَرُ كَبِيرًا ، وَالْحَمْدُ لِلَّهِ كَثِيرًا ، وَسُبْحَانَ اللَّهِ بُكْرَةً وَأَصِيلًا',
    spokenText: 'الله أكبر كبيراً، والحمد لله كثيراً، وسبحان الله بكرة وأصيلاً',
    category: 'baqiyat',
    categoryName: 'التكبير والتسبيح',
    virtue: '«عَجِبْتُ لَهَا، فُتِحَتْ لَهَا أَبْوَابُ السَّمَاءِ»',
    source: 'صحيح مسلم',
    timeContext: 'any'
  },

  // -------------------------------------------------------------
  // 4. الحوقلة وتفريج الهموم والكروب (Hawqala & Relief)
  // -------------------------------------------------------------
  {
    id: 'hawqala_1',
    text: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
    spokenText: 'لا حول ولا قوة إلا بالله العلي العظيم',
    category: 'hawqala',
    categoryName: 'الحوقلة والاستعانة',
    virtue: '«كَنْزٌ مِنْ كُنُوزِ الْجَنَّةِ» وباب من أبواب تفريج الكروب والهموم',
    source: 'متفق عليه (البخاري ومسلم)',
    timeContext: 'any'
  },
  {
    id: 'hawqala_2',
    text: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ ، نِعْمَ الْمَوْلَى وَنِعْمَ النَّصِيرُ',
    spokenText: 'حسبنا الله ونعم الوكيل، نعم المولى ونعم النصير',
    category: 'hawqala',
    categoryName: 'كفاية الله وتفريج الكروب',
    virtue: 'قالها إبراهيم عليه السلام حين أُلقي في النار، وقالها النبي ﷺ وصحابته في حمراء الأسد',
    source: 'صحيح البخاري',
    timeContext: 'any'
  },
  {
    id: 'hawqala_3',
    text: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    spokenText: 'لا إله إلا أنت سبحانك إني كنت من الظالمين',
    category: 'hawqala',
    categoryName: 'دعوة ذي النون (يونس عليه السلام)',
    virtue: 'ما دعا بها مسلم في كربة أو ضيق إلا فرّج الله عنه واستجاب له',
    source: 'سنن الترمذي ومستدرك الحاكم',
    timeContext: 'any'
  },
  {
    id: 'hawqala_4',
    text: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ ، أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ',
    spokenText: 'يا حي يا قيوم برحمتك أستغيث، أصلح لي شأني كله ولا تكلني إلى نفسي طرفة عين',
    category: 'hawqala',
    categoryName: 'الاستغاثة بالله وتيسير الأمور',
    virtue: 'وصية النبي ﷺ لفاطمة رضي الله عنها صباحاً ومساءً',
    source: 'سنن النسائي الكبرى وصحيح الترغيب',
    timeContext: 'morning'
  },
  {
    id: 'hawqala_5',
    text: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ ، وَالْعَجْزِ وَالْكَسَلِ ، وَالْبُخْلِ وَالْجُبْنِ ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ',
    spokenText: 'اللهم إني أعوذ بك من الهم والحزن، والعجز والكسل، والبخل والجبن، وضلع الدين وغلبة الرجال',
    category: 'hawqala',
    categoryName: 'تفريج الهموم والديون',
    virtue: 'دعاء نبوي جامع لإزالة الأحزان والديون وتيسير الرزق',
    source: 'صحيح البخاري عن أنس بن مالك',
    timeContext: 'any'
  },
  {
    id: 'hawqala_6',
    text: 'تَوَكَّلْتُ عَلَى اللَّهِ الَّذِي لَا يَمُوتُ ، وَالْحَمْدُ لِلَّهِ الَّذِي لَمْ يَتَّخِذْ وَلَدًا وَلَمْ يَكُنْ لَهُ شَرِيكٌ فِي الْمُلْكِ',
    spokenText: 'توكلت على الله الذي لا يموت، والحمد لله',
    category: 'hawqala',
    categoryName: 'التوكل والكفاية',
    virtue: 'كفاية من المخاوف وتفويض الأمر إلى العزيز الحكيم',
    source: 'المأثورات',
    timeContext: 'day'
  },

  // -------------------------------------------------------------
  // 5. أذكار الصباح والمساء والتحصين والبركة (Morning & Evening & Protection)
  // -------------------------------------------------------------
  {
    id: 'morning_1',
    text: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ ، وَالْحَمْدُ لِلَّهِ ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    spokenText: 'أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له',
    category: 'morning_evening',
    categoryName: 'أذكار الصباح المأثورة',
    virtue: 'بداية اليوم بتوحيد الله والاعتراف بفضله وملكه التام',
    source: 'صحيح مسلم',
    timeContext: 'morning'
  },
  {
    id: 'evening_1',
    text: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ ، وَالْحَمْدُ لِلَّهِ ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    spokenText: 'أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له',
    category: 'morning_evening',
    categoryName: 'أذكار المساء المأثورة',
    virtue: 'ختام النهار وشكر نعم الله والإقبال على رحمته',
    source: 'صحيح مسلم',
    timeContext: 'evening'
  },
  {
    id: 'protect_1',
    text: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    spokenText: 'بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم',
    category: 'morning_evening',
    categoryName: 'أذكار الحفظ والتحصين',
    virtue: 'من قالها ثلاثاً لم يضره شيء من فجأة بلاء حتى يصبح وحتى يمسي',
    source: 'سنن أبي داود والترمذي',
    timeContext: 'any'
  },
  {
    id: 'protect_2',
    text: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    spokenText: 'أعوذ بكلمات الله التامات من شر ما خلق',
    category: 'morning_evening',
    categoryName: 'الاستعاذة والحفظ التام',
    virtue: 'حرز وحفظ تام من الهوام والشرور وسموم الآفات',
    source: 'صحيح مسلم',
    timeContext: 'evening'
  },
  {
    id: 'protect_3',
    text: 'رَضِيتُ بِاللَّهِ رَبًّا ، وَبِالْإِسْلَامِ دِينًا ، وَبِمُحَمَّدٍ ﷺ نَبِيًّا وَرَسُولًا',
    spokenText: 'رضيت بالله رباً، وبالإسلام ديناً، وبمحمد صلى الله عليه وسلم نبياً ورسولاً',
    category: 'morning_evening',
    categoryName: 'الرضا بالله ورسوله',
    virtue: '«كَانَ حَقًّا عَلَى اللَّهِ أَنْ يُرْضِيَهُ يَوْمَ الْقِيَامَةِ»',
    source: 'مسند أحمد وسنن أبي داود',
    timeContext: 'any'
  },
  {
    id: 'protect_4',
    text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي',
    spokenText: 'اللهم إني أسألك العفو والعافية في الدنيا والآخرة',
    category: 'morning_evening',
    categoryName: 'سؤال العفو والعافية',
    virtue: 'أفضل ما سأل عبد ربه بعد اليقين، وحفظ الأركان والأهل',
    source: 'سنن أبي داود وابن ماجه',
    timeContext: 'morning'
  },
  {
    id: 'protect_5',
    text: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    spokenText: 'حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم',
    category: 'morning_evening',
    categoryName: 'الكفاية من كل ما أهمك',
    virtue: 'من قالها سبع مرات كفاه الله ما أهمه من أمر الدنيا والآخرة',
    source: 'سنن أبي داود',
    timeContext: 'any'
  },
  {
    id: 'night_1',
    text: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي ، وَبِكَ أَرْفَعُهُ ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا ، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ',
    spokenText: 'باسمك ربي وضعت جنبي وبك أرفعه',
    category: 'morning_evening',
    categoryName: 'أذكار الليل والمنام',
    virtue: 'حفظ النفس في المنام واليقظة ورعاية الملائكة',
    source: 'صحيح البخاري ومسلم',
    timeContext: 'night'
  },

  // -------------------------------------------------------------
  // 6. أدعية قرآنية ونبوية جامعة (Quranic & Prophetic Duas)
  // -------------------------------------------------------------
  {
    id: 'quran_dua_1',
    text: '﴿رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ﴾',
    spokenText: 'ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار',
    category: 'general',
    categoryName: 'الدعاء القرآني الجامع',
    virtue: 'أكثر دعاء كان يدعو به النبي ﷺ لجمعه خير الدنيا والآخرة والوقاية من النار',
    source: 'سورة البقرة: 201 - متفق عليه',
    timeContext: 'any'
  },
  {
    id: 'quran_dua_2',
    text: '﴿رَبِّ اشْرَحْ لِي صَدْرِي ۝ وَيَسِّرْ لِي أَمْرِي ۝ وَاحْلُلْ عُقْدَةً مِنْ لِسَانِي ۝ يَفْقَهُوا قَوْلِي﴾',
    spokenText: 'رب اشرح لي صدري ويسر لي أمري',
    category: 'general',
    categoryName: 'دعاء انشراح الصدر وتيسير الأمور',
    virtue: 'دعاء كليم الله موسى عليه السلام لانشراح الصدر وتيسير المقاصد والأعمال',
    source: 'سورة طه: 25-28',
    timeContext: 'day'
  },
  {
    id: 'quran_dua_3',
    text: '﴿رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ﴾',
    spokenText: 'ربنا لا تزغ قلوبنا بعد إذ هديتنا وهب لنا من لدنك رحمة إنك أنت الوهاب',
    category: 'general',
    categoryName: 'الثبات على الإيمان والهداية',
    virtue: 'دعاء الراسخين في العلم للثبات على الهدى ومغفرة الزلات',
    source: 'سورة آل عمران: 8',
    timeContext: 'any'
  },
  {
    id: 'quran_dua_4',
    text: '﴿رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ ۝ رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ﴾',
    spokenText: 'رب اجعلني مقيم الصلاة ومن ذريتي ربنا وتقبل دعاء',
    category: 'general',
    categoryName: 'دعاء إبراهيم الخليل عليه السلام',
    virtue: 'بركة في الذرية وإقامة الصلاة ومغفرة للوالدين والمؤمنين أجمعين',
    source: 'سورة إبراهيم: 40-41',
    timeContext: 'any'
  }
];

export interface DhikrDailyStats {
  dateStr: string;
  totalRecitedCount: number;
  totalAlertsTriggered: number;
  salawatCount: number;
  istighfarCount: number;
  tasbihCount: number;
}

export interface DhikrAudioState {
  isPlaying: boolean;
  reciterId?: string;
  duration?: number;
  currentTime?: number;
  dhikrId?: string;
}

type DhikrListener = (dhikr: DhikrItem) => void;
type StatsListener = (stats: DhikrDailyStats) => void;
type SettingsListener = (settings: DhikrReminderSettings) => void;
type AudioStateListener = (state: DhikrAudioState) => void;

/**
 * مدير التخزين غير المتصل لصوتيات الأذكار وقراء القرآن (IndexedDB)
 */
export class DhikrOfflineManager {
  private static DB_NAME = 'anis_dhikr_audio_db_v2';
  private static STORE_NAME = 'reciters_audio';
  private static DB_VERSION = 1;
  private static dbPromise: Promise<IDBDatabase> | null = null;

  private static getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
          reject(new Error('IndexedDB not supported'));
          return;
        }
        const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(this.STORE_NAME)) {
            db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this.dbPromise;
  }

  public static async getReciterAudioBlob(reciterId: string, categoryKey: string): Promise<Blob | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(this.STORE_NAME, 'readonly');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.get(`${reciterId}_${categoryKey}`);
        req.onsuccess = () => {
          if (req.result && req.result.blob) {
            resolve(req.result.blob);
          } else {
            const previewReq = store.get(`${reciterId}_preview`);
            previewReq.onsuccess = () => resolve(previewReq.result?.blob || null);
            previewReq.onerror = () => resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  public static async isReciterDownloaded(reciterId: string): Promise<boolean> {
    const reciter = DHIKR_RECITERS.find(r => r.id === reciterId);
    if (reciter?.isBuiltIn) return true;
    return false;
  }
}

export class DhikrReminderService {
  private static settings: DhikrReminderSettings = DEFAULT_DHIKR_SETTINGS;
  private static intervalHandle: any = null;
  private static lastTriggerTimestamp: number = 0;
  private static snoozedUntilTimestamp: number = 0;
  private static listeners: Set<DhikrListener> = new Set();
  private static statsListeners: Set<StatsListener> = new Set();
  private static settingsListeners: Set<SettingsListener> = new Set();
  private static audioStateListeners: Set<AudioStateListener> = new Set();
  private static audioCtx: AudioContext | null = null;
  private static activeAudioElement: HTMLAudioElement | null = null;
  private static currentPlayingDhikrId: string | null = null;
  private static wakeLockSentinel: any = null;
  private static broadcastChannel: BroadcastChannel | null = null;
  private static isInitialized = false;
  private static isSWListenerInitialized = false;

  /**
   * تحويل تصنيف الذكر إلى مفتاح الملف الصوتي
   */
  public static getCategoryAudioKey(category: string): string {
    switch (category) {
      case 'prophet_salawat':
        return 'salawat';
      case 'istighfar':
        return 'istighfar';
      case 'baqiyat':
        return 'baqiyat';
      case 'hawqala':
        return 'hawqala';
      case 'morning_evening':
        return 'tahsin';
      case 'general':
      default:
        return 'salawat';
    }
  }

  /**
   * تهيئة محرك التنبيه الذكي
   */
  public static init(initialSettings?: DhikrReminderSettings) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      const saved = localStorage.getItem('anis_dhikr_reminder_settings');
      if (saved) {
        this.settings = { ...DEFAULT_DHIKR_SETTINGS, ...JSON.parse(saved) };
      } else if (initialSettings) {
        this.settings = { ...DEFAULT_DHIKR_SETTINGS, ...initialSettings };
      }
    } catch {
      this.settings = initialSettings ? { ...DEFAULT_DHIKR_SETTINGS, ...initialSettings } : DEFAULT_DHIKR_SETTINGS;
    }

    if (!this.settings.reciterId || !DHIKR_RECITERS.some(r => r.id === this.settings.reciterId)) {
      this.settings.reciterId = 'mishary';
    }

    try {
      const last = localStorage.getItem('anis_dhikr_last_trigger');
      if (last) this.lastTriggerTimestamp = parseInt(last, 10) || 0;
    } catch {}

    // Initialize BroadcastChannel for cross-tab coordination
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('anis_dhikr_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (!event.data) return;
          if (event.data.type === 'DHIKR_TRIGGERED_OTHER_TAB') {
            this.lastTriggerTimestamp = event.data.timestamp || Date.now();
          } else if (event.data.type === 'RECORD_RECITATION_OTHER_TAB') {
            this.recordRecitation(event.data.category || 'all');
          }
        };
      }
    } catch {}

    this.initServiceWorkerListeners();
    this.restartIntervalTimer();
    this.syncWithServiceWorker();

    // إذا كان المستخدم قد فعّل خيار التنبيه المباشر عند فتح التطبيق
    if (this.settings.enabled && this.settings.triggerOnAppOpen) {
      setTimeout(() => {
        const now = Date.now();
        const timeSinceLast = now - this.lastTriggerTimestamp;
        // إطلاق التنبيه فقط إذا مر أكثر من دقيقة على آخر تنبيه
        if (timeSinceLast >= 60 * 1000) {
          this.triggerReminder();
        }
      }, 2500);
    }

    const unlock = () => {
      this.getAudioContext();
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
  }

  /**
   * الاستماع للرسائل القادمة من Service Worker (شاشة القفل والخلفية)
   */
  public static initServiceWorkerListeners() {
    if (this.isSWListenerInitialized) return;
    this.isSWListenerInitialized = true;

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (!event.data) return;

        if (event.data.type === 'TRIGGER_DHIKR_ALERT') {
          const dhikr = event.data.dhikr;
          if (dhikr) {
            this.listeners.forEach(cb => {
              try { cb(dhikr); } catch {}
            });
          }
        } else if (event.data.type === 'RECORD_RECITATION') {
          this.recordRecitation(event.data.category || 'all');
        } else if (event.data.type === 'SHOW_DHIKR_BANNER_DIRECT') {
          const dhikrData = event.data.data;
          const found = DHIKR_DATABASE.find(d => d.id === dhikrData?.dhikrId) || DHIKR_DATABASE[0];
          this.listeners.forEach(cb => {
            try { cb(found); } catch {}
          });
        }
      });
    }
  }

  public static getSettings(): DhikrReminderSettings {
    return { ...this.settings };
  }

  public static updateSettings(newSettings: Partial<DhikrReminderSettings>): DhikrReminderSettings {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem('anis_dhikr_reminder_settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to persist dhikr settings:', e);
    }

    this.settingsListeners.forEach(cb => {
      try { cb(this.settings); } catch {}
    });

    this.restartIntervalTimer();
    this.syncWithServiceWorker();
    return this.settings;
  }

  /**
   * مزامنة الإعدادات وقاعدة الأذكار مع Service Worker لضمان العمل التام بالخلفية
   */
  public static async syncWithServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_DHIKR_REMINDER',
            settings: this.settings,
            database: DHIKR_DATABASE
          });
        }

        // Register Periodic Background Sync if supported (PWA / Android)
        if ('periodicSync' in reg) {
          try {
            await (reg as any).periodicSync.register('check-dhikr-reminder', {
              minInterval: Math.max(15, this.settings.intervalMinutes) * 60 * 1000
            });
          } catch (e) {
            console.info("Periodic Sync dhikr notice:", e);
          }
        }

        // Register Background Sync if supported
        if ('sync' in reg) {
          try {
            await (reg as any).sync.register('dhikr-sync');
          } catch {}
        }
      } catch (err) {
        console.warn('Could not sync dhikr with SW:', err);
      }
    }
  }

  /**
   * طلب إذن شاشة القفل وتجربة الإشعار الفوري
   */
  public static async testLockScreenNotification(customDhikr?: DhikrItem): Promise<boolean> {
    if (!('Notification' in window)) return false;

    let permission = Notification.permission;
    if (permission !== 'granted') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') return false;

    const dhikr = customDhikr || this.selectDhikr();

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'TEST_DHIKR_NOTIFICATION',
          dhikr: dhikr
        });
      } else {
        await this.sendSystemNotification(dhikr);
      }
      return true;
    } catch {
      return false;
    }
  }

  public static subscribeToReminder(listener: DhikrListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public static subscribeToStats(listener: StatsListener): () => void {
    this.statsListeners.add(listener);
    return () => this.statsListeners.delete(listener);
  }

  public static subscribeToSettings(listener: SettingsListener): () => void {
    this.settingsListeners.add(listener);
    return () => this.settingsListeners.delete(listener);
  }

  public static subscribeToAudioState(listener: AudioStateListener): () => void {
    this.audioStateListeners.add(listener);
    // Notify with current audio state immediately
    listener({
      isPlaying: !!this.activeAudioElement && !this.activeAudioElement.paused,
      dhikrId: this.currentPlayingDhikrId || undefined,
      duration: this.activeAudioElement?.duration || 0,
      currentTime: this.activeAudioElement?.currentTime || 0
    });
    return () => this.audioStateListeners.delete(listener);
  }

  private static notifyAudioState(state: DhikrAudioState) {
    this.audioStateListeners.forEach(cb => {
      try { cb(state); } catch (e) { console.warn('Audio state listener err:', e); }
    });
  }

  /**
   * إيقاف تشغيل الصوت الحالي فوراً (عند إغلاق الشعار أو الضغط على زر الإغلاق)
   */
  public static stopAudio() {
    if (this.activeAudioElement) {
      try {
        this.activeAudioElement.pause();
        this.activeAudioElement.currentTime = 0;
      } catch {}
      this.activeAudioElement = null;
    }
    this.currentPlayingDhikrId = null;
    this.notifyAudioState({ isPlaying: false, duration: 0, currentTime: 0 });
  }

  /**
   * هل يتم تشغيل صوت حالياً
   */
  public static isAudioPlaying(): boolean {
    return !!this.activeAudioElement && !this.activeAudioElement.paused;
  }

  /**
   * إعادة ضبط مؤقت التذكير التلقائي
   */
  private static restartIntervalTimer() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    if (!this.settings.enabled) return;

    this.intervalHandle = setInterval(() => {
      this.checkAndTriggerIfNeeded();
    }, 15000);
  }

  /**
   * فحص هل حان موعد التذكير الآن
   */
  private static checkAndTriggerIfNeeded() {
    if (!this.settings.enabled) return;

    const now = Date.now();

    if (now < this.snoozedUntilTimestamp) {
      return;
    }

    if (this.settings.quietHoursEnabled && this.isCurrentlyQuietHour()) {
      return;
    }

    const intervalMs = Math.max(1, this.settings.intervalMinutes) * 60 * 1000;
    const timeSinceLast = now - this.lastTriggerTimestamp;

    if (timeSinceLast >= intervalMs) {
      this.triggerReminder();
    }
  }

  /**
   * فحص ساعات الهدوء
   */
  public static isCurrentlyQuietHour(): boolean {
    if (!this.settings.quietHoursEnabled) return false;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = (this.settings.quietHoursStart || '23:00').split(':').map(Number);
    const [endH, endM] = (this.settings.quietHoursEnd || '06:00').split(':').map(Number);

    const startTotal = (startH || 0) * 60 + (startM || 0);
    const endTotal = (endH || 0) * 60 + (endM || 0);

    if (startTotal <= endTotal) {
      return currentMins >= startTotal && currentMins < endTotal;
    } else {
      return currentMins >= startTotal || currentMins < endTotal;
    }
  }

  /**
   * اختيار الذكر الذكي المناسب للوقت واليوم مع منع التكرار المتتالي
   */
  public static selectDhikr(): DhikrItem {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    const isFriday = now.getDay() === 5; // 5 is Friday

    // Determine time slot
    let timeSlot: 'morning' | 'evening' | 'night' | 'day' = 'day';
    if (hour >= 4 && hour < 11.5) {
      timeSlot = 'morning';
    } else if (hour >= 15 && hour < 20.5) {
      timeSlot = 'evening';
    } else if (hour >= 20.5 || hour < 4) {
      timeSlot = 'night';
    } else {
      timeSlot = 'day';
    }

    // Retrieve recent history of shown dhikrs to guarantee diversity & avoid repetition
    let recentIds: string[] = [];
    try {
      const saved = localStorage.getItem('anis_recent_dhikr_ids');
      if (saved) recentIds = JSON.parse(saved);
    } catch {}

    let pool = DHIKR_DATABASE;

    // Apply user category preference
    if (this.settings.category === 'prophet_salawat') {
      pool = DHIKR_DATABASE.filter(d => d.category === 'prophet_salawat');
    } else if (this.settings.category === 'istighfar') {
      pool = DHIKR_DATABASE.filter(d => d.category === 'istighfar');
    } else if (this.settings.category === 'baqiyat') {
      pool = DHIKR_DATABASE.filter(d => d.category === 'baqiyat');
    } else if (this.settings.category === 'hawqala') {
      pool = DHIKR_DATABASE.filter(d => d.category === 'hawqala');
    } else if (this.settings.category === 'morning_evening') {
      pool = DHIKR_DATABASE.filter(d => d.category === 'morning_evening');
    } else if (this.settings.category === 'custom' && this.settings.selectedDhikrIds && this.settings.selectedDhikrIds.length > 0) {
      const filtered = DHIKR_DATABASE.filter(d => this.settings.selectedDhikrIds?.includes(d.id));
      if (filtered.length > 0) pool = filtered;
    } else {
      // 'all' category: Contextual weighting according to time and day
      if (isFriday) {
        // Boost Friday blessings and Salawat on the Prophet ﷺ (50% probability)
        if (Math.random() < 0.5) {
          pool = DHIKR_DATABASE.filter(d => d.category === 'prophet_salawat' || d.timeContext === 'friday');
        }
      } else if (timeSlot === 'morning') {
        // Prioritize Morning Adhkar, Tahsin, Istighfar & Salawat
        if (Math.random() < 0.6) {
          pool = DHIKR_DATABASE.filter(d => d.timeContext === 'morning' || d.timeContext === 'any');
        }
      } else if (timeSlot === 'evening') {
        // Prioritize Evening Adhkar, Tahsin & Tasbih
        if (Math.random() < 0.6) {
          pool = DHIKR_DATABASE.filter(d => d.timeContext === 'evening' || d.timeContext === 'any');
        }
      } else if (timeSlot === 'night') {
        // Prioritize Night Adhkar & Istighfar
        if (Math.random() < 0.6) {
          pool = DHIKR_DATABASE.filter(d => d.timeContext === 'night' || d.category === 'istighfar' || d.timeContext === 'any');
        }
      }
    }

    // Filter out recently shown IDs to prevent consecutive repeats
    let candidatePool = pool.filter(d => !recentIds.includes(d.id));
    if (candidatePool.length === 0) {
      candidatePool = pool;
      recentIds = [];
    }

    const randomIndex = Math.floor(Math.random() * candidatePool.length);
    const chosen = candidatePool[randomIndex] || pool[0] || DHIKR_DATABASE[0];

    // Update recent history (keep max 12 items)
    try {
      recentIds.push(chosen.id);
      if (recentIds.length > 12) recentIds.shift();
      localStorage.setItem('anis_recent_dhikr_ids', JSON.stringify(recentIds));
    } catch {}

    return chosen;
  }

  /**
   * إطلاق التنبيه الذكي
   */
  public static async triggerReminder(customDhikr?: DhikrItem, isTest = false) {
    const dhikr = customDhikr || this.selectDhikr();
    const now = Date.now();

    if (!isTest) {
      this.lastTriggerTimestamp = now;
      try {
        localStorage.setItem('anis_dhikr_last_trigger', now.toString());
      } catch {}
      this.recordTriggeredStat();
    }

    // 1. Play Real Reciter Audio / Sound Alert
    this.playDhikrAlert(dhikr, this.settings);

    // 2. Vibrate phone if enabled
    if (this.settings.vibrate && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 100, 200]);
      } catch {}
    }

    // 3. Notify React subscribers (Displays sleek on-screen floating banner)
    this.listeners.forEach(cb => {
      try { cb(dhikr); } catch (e) { console.warn('Dhikr listener error:', e); }
    });

    // 4. Send Web Notification for background alerts
    this.sendSystemNotification(dhikr);
  }

  /**
   * تشغيل الصوت الحقيقي المسجل للشيخ أو النغمة الروحانية
   */
  public static async playDhikrAlert(dhikr: DhikrItem, settings: DhikrReminderSettings) {
    if (settings.soundType === 'silent') return;

    const vol = (settings.volume ?? 85) / 100;

    // Harmonic chime tone
    if (settings.soundType === 'voice_and_chime' || settings.soundType === 'chime_only') {
      try {
        await this.playIslamicHarmonicChime(vol);
      } catch (e) {
        console.warn('Chime audio error:', e);
      }
    }

    if (settings.soundType === 'voice_and_chime' || settings.soundType === 'voice_only') {
      const delay = settings.soundType === 'voice_and_chime' ? 500 : 0;
      setTimeout(() => {
        this.playRealReciterVoice(dhikr, settings.reciterId || 'mishary', vol);
      }, delay);
    }
  }

  /**
   * تشغيل الصوت المسجل الحقيقي للقارئ من الملفات المدمجة مباشرة مع تتبع الحالة
   */
  public static async playRealReciterVoice(
    dhikr: DhikrItem, 
    reciterId: string, 
    volume = 0.85
  ): Promise<void> {
    // Stop any currently playing audio
    this.stopAudio();

    this.currentPlayingDhikrId = dhikr.id;

    let targetReciterId = reciterId;
    if (reciterId === 'random') {
      const actualReciters = DHIKR_RECITERS.filter(r => r.id !== 'random');
      const pick = actualReciters[Math.floor(Math.random() * actualReciters.length)];
      targetReciterId = pick ? pick.id : 'mishary';
    }

    const categoryKey = this.getCategoryAudioKey(dhikr.category);
    const reciterInfo = DHIKR_RECITERS.find(r => r.id === targetReciterId);

    const candidates: string[] = [
      `/audio/adhkar/${targetReciterId}_${categoryKey}.mp3`,
      (reciterInfo?.audioUrls && reciterInfo.audioUrls[categoryKey]) || '',
      reciterInfo?.previewUrl || '',
      `/audio/adhkar/mishary_${categoryKey}.mp3`,
      `/audio/adhkar/mishary_salawat.mp3`
    ].filter(Boolean);

    // 1. Check if we have an offline indexedDB blob
    try {
      const offlineBlob = await DhikrOfflineManager.getReciterAudioBlob(targetReciterId, categoryKey);
      if (offlineBlob) {
        const blobUrl = URL.createObjectURL(offlineBlob);
        const played = await this.tryPlayAudioBlobUrl(blobUrl, volume, targetReciterId, dhikr.id);
        if (played) return;
      }
    } catch (e) {
      console.warn('Offline blob check error:', e);
    }

    // 2. Try candidate audio URLs sequentially
    for (const url of candidates) {
      try {
        const played = await this.tryPlayAudioUrl(url, volume, targetReciterId, dhikr.id);
        if (played) return;
      } catch {
        // try next candidate
      }
    }

    // If all fail, notify that audio stopped
    this.notifyAudioState({ isPlaying: false, duration: 0, currentTime: 0 });
  }

  private static tryPlayAudioBlobUrl(blobUrl: string, volume: number, reciterId: string, dhikrId: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const audio = new Audio(blobUrl);
        audio.volume = Math.max(0.05, Math.min(1.0, volume));
        this.activeAudioElement = audio;

        let hasResolved = false;

        audio.onplay = () => {
          this.notifyAudioState({
            isPlaying: true,
            reciterId,
            dhikrId,
            duration: audio.duration || 0,
            currentTime: audio.currentTime || 0
          });
        };

        audio.ontimeupdate = () => {
          this.notifyAudioState({
            isPlaying: true,
            reciterId,
            dhikrId,
            duration: audio.duration || 0,
            currentTime: audio.currentTime || 0
          });
        };

        audio.onended = () => {
          URL.revokeObjectURL(blobUrl);
          this.activeAudioElement = null;
          this.currentPlayingDhikrId = null;
          this.notifyAudioState({
            isPlaying: false,
            reciterId,
            dhikrId,
            duration: audio.duration || 0,
            currentTime: audio.duration || 0
          });
          if (!hasResolved) {
            hasResolved = true;
            resolve(true);
          }
        };

        audio.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          if (this.activeAudioElement === audio) {
            this.activeAudioElement = null;
            this.currentPlayingDhikrId = null;
          }
          this.notifyAudioState({ isPlaying: false });
          if (!hasResolved) {
            hasResolved = true;
            resolve(false);
          }
        };

        audio.play().then(() => {
          if (!hasResolved) {
            hasResolved = true;
            resolve(true);
          }
        }).catch(() => {
          URL.revokeObjectURL(blobUrl);
          if (!hasResolved) {
            hasResolved = true;
            resolve(false);
          }
        });
      } catch {
        resolve(false);
      }
    });
  }

  private static async requestWakeLock() {
    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      }
    } catch (e) {}
  }

  private static releaseWakeLock() {
    try {
      if (this.wakeLockSentinel) {
        this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      }
    } catch (e) {}
  }

  private static setupMediaSession(dhikrText: string, reciterName: string, categoryName: string, audio?: HTMLAudioElement) {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: dhikrText,
          artist: reciterName,
          album: `أنيس القلوب - ${categoryName}`,
          artwork: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/app-icon.svg', sizes: '512x512', type: 'image/svg+xml' }
          ]
        });

        navigator.mediaSession.playbackState = 'playing';

        const defaultActions: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
          ['play', () => {
            if (this.activeAudioElement && this.activeAudioElement.paused) {
              this.activeAudioElement.play().catch(() => {});
              navigator.mediaSession.playbackState = 'playing';
            }
          }],
          ['pause', () => {
            if (this.activeAudioElement && !this.activeAudioElement.paused) {
              this.activeAudioElement.pause();
              navigator.mediaSession.playbackState = 'paused';
            }
          }],
          ['stop', () => {
            this.stopAudio();
          }]
        ];

        defaultActions.forEach(([action, handler]) => {
          try {
            navigator.mediaSession.setActionHandler(action, handler);
          } catch {}
        });

        if (audio) {
          audio.ontimeupdate = () => {
            if ('setPositionState' in navigator.mediaSession && audio.duration && !isNaN(audio.duration)) {
              try {
                navigator.mediaSession.setPositionState({
                  duration: audio.duration,
                  playbackRate: audio.playbackRate || 1.0,
                  position: audio.currentTime
                });
              } catch {}
            }
          };
        }
      } catch (e) {
        console.warn("MediaSession notice for dhikr:", e);
      }
    }
  }

  private static tryPlayAudioUrl(url: string, volume: number, reciterId: string, dhikrId: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const audio = new Audio(url);
        audio.volume = Math.max(0.05, Math.min(1.0, volume));
        this.activeAudioElement = audio;

        this.requestWakeLock();
        const reciter = DHIKR_RECITERS.find(r => r.id === reciterId);
        const dhikr = DHIKR_DATABASE.find(d => d.id === dhikrId);
        this.setupMediaSession(
          dhikr?.text || 'ذكر الله وطمأنينة القلب',
          reciter?.name || 'الشيخ مشاري راشد العفاسي',
          dhikr?.categoryName || 'الأذكار والتسبيح',
          audio
        );

        let hasResolved = false;

        audio.onplay = () => {
          this.notifyAudioState({
            isPlaying: true,
            reciterId,
            dhikrId,
            duration: audio.duration || 0,
            currentTime: audio.currentTime || 0
          });
        };

        audio.ontimeupdate = () => {
          this.notifyAudioState({
            isPlaying: true,
            reciterId,
            dhikrId,
            duration: audio.duration || 0,
            currentTime: audio.currentTime || 0
          });
        };

        audio.onended = () => {
          this.releaseWakeLock();
          if (this.activeAudioElement === audio) {
            this.activeAudioElement = null;
            this.currentPlayingDhikrId = null;
          }
          this.notifyAudioState({
            isPlaying: false,
            reciterId,
            dhikrId,
            duration: audio.duration || 0,
            currentTime: audio.duration || 0
          });
          if (!hasResolved) {
            hasResolved = true;
            resolve(true);
          }
        };

        audio.onerror = () => {
          this.releaseWakeLock();
          if (this.activeAudioElement === audio) {
            this.activeAudioElement = null;
            this.currentPlayingDhikrId = null;
          }
          this.notifyAudioState({ isPlaying: false });
          if (!hasResolved) {
            hasResolved = true;
            resolve(false);
          }
        };

        audio.play().then(() => {
          if (!hasResolved) {
            hasResolved = true;
            resolve(true);
          }
        }).catch(() => {
          this.releaseWakeLock();
          if (!hasResolved) {
            hasResolved = true;
            resolve(false);
          }
        });
      } catch {
        this.releaseWakeLock();
        resolve(false);
      }
    });
  }

  /**
   * نغمة إسلامية روحانية متناسقة (Web Audio API Synthesizer)
   */
  public static playIslamicHarmonicChime(volume = 0.8): Promise<void> {
    return new Promise((resolve) => {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) {
          resolve();
          return;
        }

        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;
        const freqs = [523.25, 659.25, 783.99, 1046.50];

        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = i % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);

          const startTime = now + i * 0.08;
          const duration = 1.4 - i * 0.2;

          gain.gain.setValueAtTime(0.0001, startTime);
          gain.gain.exponentialRampToValueAtTime(0.22 * volume, startTime + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + duration + 0.1);
        });

        setTimeout(resolve, 600);
      } catch (e) {
        console.warn('Harmonic chime failed:', e);
        resolve();
      }
    });
  }

  /**
   * إرسال إشعار نظام بالخلفية
   */
  private static async sendSystemNotification(dhikr: DhikrItem) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const isSalawat = dhikr.category === 'prophet_salawat';
    const title = isSalawat ? '✨ صلِّ على النبي ﷺ' : `🌿 ذكر الله تعالى - ${dhikr.categoryName}`;
    const body = `${dhikr.text}\n\n${dhikr.virtue}`;

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body: body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: `dhikr-${Date.now()}`,
            vibrate: [150, 100, 200],
            silent: this.settings.soundType === 'silent',
            dir: 'rtl',
            lang: 'ar',
            data: { dhikrId: dhikr.id, category: dhikr.category }
          } as any);
          return;
        }
      }

      new Notification(title, {
        body: body,
        icon: '/icons/icon-192.png',
        dir: 'rtl',
        lang: 'ar'
      });
    } catch (e) {
      console.warn('Could not show system dhikr notification:', e);
    }
  }

  public static async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    try {
      const perm = await Notification.requestPermission();
      return perm;
    } catch {
      return Notification.permission;
    }
  }

  public static snooze(minutes = 60) {
    this.snoozedUntilTimestamp = Date.now() + minutes * 60 * 1000;
  }

  public static cancelSnooze() {
    this.snoozedUntilTimestamp = 0;
  }

  public static isSnoozed(): boolean {
    return Date.now() < this.snoozedUntilTimestamp;
  }

  public static getSnoozeRemainingMinutes(): number {
    if (!this.isSnoozed()) return 0;
    return Math.ceil((this.snoozedUntilTimestamp - Date.now()) / (60 * 1000));
  }

  public static recordRecitation(category: string) {
    const stats = this.getDailyStats();
    stats.totalRecitedCount += 1;

    if (category === 'prophet_salawat') stats.salawatCount += 1;
    else if (category === 'istighfar') stats.istighfarCount += 1;
    else stats.tasbihCount += 1;

    this.saveDailyStats(stats);
  }

  private static recordTriggeredStat() {
    const stats = this.getDailyStats();
    stats.totalAlertsTriggered += 1;
    this.saveDailyStats(stats);
  }

  public static getDailyStats(): DhikrDailyStats {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const saved = localStorage.getItem('anis_dhikr_daily_stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dateStr === todayStr) {
          return parsed;
        }
      }
    } catch {}

    const newStats: DhikrDailyStats = {
      dateStr: todayStr,
      totalRecitedCount: 0,
      totalAlertsTriggered: 0,
      salawatCount: 0,
      istighfarCount: 0,
      tasbihCount: 0
    };
    this.saveDailyStats(newStats);
    return newStats;
  }

  private static saveDailyStats(stats: DhikrDailyStats) {
    try {
      localStorage.setItem('anis_dhikr_daily_stats', JSON.stringify(stats));
    } catch {}

    this.statsListeners.forEach(cb => {
      try { cb(stats); } catch {}
    });
  }

  private static getAudioContext(): AudioContext | null {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    return this.audioCtx;
  }
}
