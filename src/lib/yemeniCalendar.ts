export interface HimyariteMonth {
  name: string;
  startMonth: number;
  startDay: number;
  duration: number;
  qiran: string;
  season: 'الشتاء' | 'الربيع' | 'الصيف' | 'الخريف';
  desc: string;
  meaning?: string;
  agriculturalImportance?: string;
}

export const SYRIAC_MONTHS: { [key: number]: string } = {
  1: 'كانون الثاني',
  2: 'شباط',
  3: 'آذار',
  4: 'نيسان',
  5: 'أيار',
  6: 'حزيران',
  7: 'تموز',
  8: 'آب',
  9: 'أيلول',
  10: 'تشرين الأول',
  11: 'تشرين الثاني',
  12: 'كانون الأول'
};

export const GREGORIAN_ARABIC_MONTHS: { [key: number]: string } = {
  1: 'يناير',
  2: 'فبراير',
  3: 'مارس',
  4: 'أبريل',
  5: 'مايو',
  6: 'يونيو',
  7: 'يوليو',
  8: 'أغسطس',
  9: 'سبتمبر',
  10: 'أكتوبر',
  11: 'نوفمبر',
  12: 'ديسمبر'
};

export const getSyriacMonthName = (monthNumber: number): string => {
  return SYRIAC_MONTHS[monthNumber] || '';
};

export const getGregorianMonthWithSyriac = (monthNumber: number): string => {
  const gregName = GREGORIAN_ARABIC_MONTHS[monthNumber] || '';
  const syriacName = SYRIAC_MONTHS[monthNumber] || '';
  return `${gregName} (${syriacName})`;
};

export const formatGregorianDateWithSyriac = (date: Date): string => {
  const day = date.getDate();
  const monthNum = date.getMonth() + 1;
  const year = date.getFullYear();
  const syriac = getSyriacMonthName(monthNum);
  const gregName = GREGORIAN_ARABIC_MONTHS[monthNum];
  return `${day} ${gregName} (${syriac}) ${year}`;
};

export interface Marker {
  manzil: string;
  marker: string;
  startMonth: number;
  startDay: number;
  type: 'spring' | 'autumn' | 'winter' | 'summer';
  proverb?: string;
  desc?: string;
  recommendations?: string[];
  solarDegrees?: string;
  windPattern?: string;
}

export const HIMYARITE_MONTHS: HimyariteMonth[] = [
  { 
    name: 'ذو شرف', 
    startMonth: 1, 
    startDay: 14, 
    duration: 31, 
    qiran: 'قران الحادي عشر', 
    season: 'الشتاء', 
    desc: 'تشتد فيه برودة الجو وتكثر الرياح الباردة والجافة.',
    meaning: 'شهر الارتفاع والذروة الشتوية',
    agriculturalImportance: 'موسم ري وحماية المزروعات القائمة من أثر الصقيع، وتجهيز حقول الذرة الشامية والبطاطا.'
  },
  { 
    name: 'ذو النجم', 
    startMonth: 2, 
    startDay: 14, 
    duration: 28, 
    qiran: 'قران التاسع', 
    season: 'الربيع', 
    desc: 'بداية موسم الدثأ الأول، يبذر فيه البر والشعير في المرتفعات الجبلية.',
    meaning: 'شهر ظهور النجم وبداية الدفء',
    agriculturalImportance: 'يبذر فيه القمح (البلدي) والشعير والعتر والعدس في قيعان المرتفعات، وهو باكورة ربيع اليمن الزراعي.'
  },
  { 
    name: 'ذو الدثأ', 
    startMonth: 3, 
    startDay: 14, 
    duration: 31, 
    qiran: 'قران السابع', 
    season: 'الربيع', 
    desc: 'موسم الدثأ الثاني، وفيه تبذر الذرة الرفيعة في المناطق المتوسطة والمنخفضة.',
    meaning: 'شهر الخصوبة وعودة رطوبة الأرض',
    agriculturalImportance: 'موسم رئيسي لبذر أنواع متعددة من الحبوب والبقوليات، والبدء بتقليم أشجار العنب والرمان.'
  },
  { 
    name: 'ذو الثابة', 
    startMonth: 4, 
    startDay: 14, 
    duration: 30, 
    qiran: 'قران الخمس', 
    season: 'الصيف', 
    desc: 'موسم بذار أنواع الذرة المختلفة في المناطق المعتدلة كالمرتفعات الشمالية والوسطى.',
    meaning: 'شهر الثبات والاستقرار الزراعي',
    agriculturalImportance: 'بذار المحاصيل الصيفية الهامة كالغرب والذرة الحمراء والبيضاء والذرة الشامية.'
  },
  { 
    name: 'ذو مبكر', 
    startMonth: 5, 
    startDay: 14, 
    duration: 31, 
    qiran: 'قران الثلاث', 
    season: 'الصيف', 
    desc: 'استمرار موسم بذار الصيف المكثف مع هطول أمطار الصيف المبكرة.',
    meaning: 'شهر التبكير في العمل والأمطار الصيفية',
    agriculturalImportance: 'متابعة ري المحاصيل الصيفية وتطهير قنوات المياه مع ترقب الأمطار الغزيرة.'
  },
  { 
    name: 'ذو القياظ', 
    startMonth: 6, 
    startDay: 14, 
    duration: 30, 
    qiran: 'قران الحادي', 
    season: 'الصيف', 
    desc: 'اشتداد درجة الحرارة، وبداية نضج بعض الثمار كاللوز والمشمش والخوخ.',
    meaning: 'شهر شدة الحر وقيظ الصيف',
    agriculturalImportance: 'جني الفواكه الصيفية، وحراثة الأرض الخالية لإعدادها للخريف، ومكافحة الآفات الزراعية.'
  },
  { 
    name: 'ذو المذراء', 
    startMonth: 7, 
    startDay: 14, 
    duration: 31, 
    qiran: 'قران الخامس والعشرين', 
    season: 'الخريف', 
    desc: 'بداية الخريف المبكر، وتهب فيه رياح مبشرة بهطول أمطار الخريف الغزيرة.',
    meaning: 'شهر ذروة تذرية وحراثة التربة',
    agriculturalImportance: 'حراثة وتذرية الأتربة لتهوية الحقول قبل هطول أمطار الخريف، وبذر السمسم في السهول.'
  },
  { 
    name: 'ذو الخريف', 
    startMonth: 8, 
    startDay: 14, 
    duration: 31, 
    qiran: 'قران الثالث والعشرين', 
    season: 'الخريف', 
    desc: 'موسم علان وبداية نضج الغلال الصيفية وهطول الأمطار الموسمية بغزارة.',
    meaning: 'شهر ذروة نضج وتجمع ثمار الخريف',
    agriculturalImportance: 'موسم نضج الذرة الشامية وحصاد بعض الحبوب المبكرة، والاهتمام بالحواجز المائية لحفظ السيول.'
  },
  { 
    name: 'ذو علان', 
    startMonth: 9, 
    startDay: 14, 
    duration: 30, 
    qiran: 'قران التاسع عشر', 
    season: 'الخريف', 
    desc: 'موسم بذار الخامس للقمح والشعير، وتستمر فيه زراعة الغلال الشتوية.',
    meaning: 'شهر نضج سنابل الذرة واعلان الحصاد',
    agriculturalImportance: 'بذر القمح (الواهب) وتجهيز السواقي، وبدء حصاد المحاصيل الصيفية المتأخرة.'
  },
  { 
    name: 'ذو الصراب', 
    startMonth: 10, 
    startDay: 14, 
    duration: 31, 
    qiran: 'قران السابع عشر', 
    season: 'الشتاء', 
    desc: 'موسم الحصاد الأكبر (الصراب) للذرة والحبوب في معظم أرجاء اليمن.',
    meaning: 'شهر جني وحصاد الغلال وتجفيفها',
    agriculturalImportance: 'حصاد وصراب الذرة الرفيعة والبيضاء، ودراسة السنابل في المخابئ وتخزين الحبوب بأمان.'
  },
  { 
    name: 'ذو المهلة', 
    startMonth: 11, 
    startDay: 14, 
    duration: 30, 
    qiran: 'قران الخامس عشر', 
    season: 'الشتاء', 
    desc: 'فترة لإراحة الأرض وتهويتها وتحضيرها للموسم الزراعي القادم.',
    meaning: 'شهر الإمهال والراحة للأرض والمزارع',
    agriculturalImportance: 'قلب التربة لتعريض الحشرات لأشعة الشمس، وإضافة الأسمدة الطبيعية للأرض، وتقليم الأشجار.'
  },
  { 
    name: 'ذو الآل', 
    startMonth: 12, 
    startDay: 14, 
    duration: 31, 
    qiran: 'قران الثالث عشر', 
    season: 'الشتاء', 
    desc: 'دخول البرد القارس وهبوط الصقيع الجليدي (الضريب) على المرتفعات.',
    meaning: 'شهر شدة البرد والجليد والضريب',
    agriculturalImportance: 'حماية الخضروات بالغطاء، والري السطحي مساءً لتقليل أثر الصقيع، والاعتناء ببيوت النحل.'
  }
];

export interface SimplifiedMonthPackage {
  name: string;
  simpleMeaning: string;       // المعنى ببساطة
  simpleClimate: string;       // الجو والأجواء ببساطة
  keyActions: string[];        // أهم 3 أعمال بطريقة مبسطة جداً
  famousProverb: string;       // أشهر الأمثال والحكم الشعبية المرتبطة
  easyTip: string;             // نصيحة ذهبية سهلة ومباشرة
}

export const SIMPLIFIED_MONTH_PACKAGES: SimplifiedMonthPackage[] = [
  {
    name: 'ذو شرف',
    simpleMeaning: 'شهر الارتفاع وبلوغ ذروة البرد الشتوي',
    simpleClimate: 'برد قارس وجاف جداً في الليل والصباح الباكر، مع هبوب رياح شمالية باردة وجافة.',
    keyActions: [
      'ري المزروعات ليلاً لحمايتها من الصقيع السطحي (الضريب).',
      'تجهيز الحقول وحرثها لزراعة الذرة الشامية والبطاطا.',
      'تدفئة خلايا النحل ورعايتها لصد هجمات البرد الشديد.'
    ],
    famousProverb: 'بين ذو شرف وذو الآل، يشتد البرد على الجبال ويجف الطين في التلال.',
    easyTip: 'اسقِ نباتات منزلك أو حديقتك الصغيرة رياً خفيفاً في المساء لحماية الجذور من التجمد فجراً.'
  },
  {
    name: 'ذو النجم',
    simpleMeaning: 'ظهور النجم الحار وبداية انصراف البرد وتسلل الدفء',
    simpleClimate: 'يبدأ الجو بالاعتدال التدريجي نهاراً، وتنشط حركة الطبيعة مع ليل معتدل البرودة.',
    keyActions: [
      'بذر محاصيل القمح والشعير والعدس والعتر في قيعان المرتفعات.',
      'غرس شتلات الفاكهة الجديدة وعقل العنب والرمان والتين.',
      'تسميد التربة وتجهيزها بمقويات طبيعية لتنشيط نمو الجذور.'
    ],
    famousProverb: 'في ذو النجم، يصحو الجو ويبشر الغيم بانتهاء الضريب وبدء النماء.',
    easyTip: 'هذا هو الوقت الذهبي لبدء غرس شتلات أشجار الزينة والمثمرة في فناء منزلك لتنمو بقوة الربيع.'
  },
  {
    name: 'ذو الدثأ',
    simpleMeaning: 'عودة رطوبة الأرض والخصوبة الكاملة للتربة',
    simpleClimate: 'أجواء ربيعية دافئة ومثالية للغاية، مع نسائم عليلة وهطول أمطار ربيعية خفيفة منعشة.',
    keyActions: [
      'بذر أنواع الحبوب المختلفة والبقوليات والبدء بتقليم العنب والرمان.',
      'تطعيم أشجار اللوز والفاكهة وتلقيح أزهار الحمضيات.',
      'زراعة الخضار الصيفية المتنوعة كالكوسة والخيار والطماطم.'
    ],
    famousProverb: 'دثأ الربيع، يكسو الوديان والجبال بالغطاء الأخضر البديع.',
    easyTip: 'قم بتقليم وتهذيب أشجارك المنزلية ونباتات الزينة الآن لتشجيعها على التفرع والازدهار.'
  },
  {
    name: 'ذو الثابة',
    simpleMeaning: 'ثبات واستقرار مواسم الزراعة الصيفية الكبرى',
    simpleClimate: 'أجواء صيفية دافئة مشمسة وصافية، تبدأ فيها درجات الحرارة بالصعود نهاراً.',
    keyActions: [
      'بذر الأنواع الرئيسية من الذرة الرفيعة (الحمراء والبيضاء والشامية).',
      'الاهتمام التام بتطهير ونظافة قنوات ومساقي المياه.',
      'مكافحة الآفات الزراعية والحشرات مبكراً قبل انتشارها.'
    ],
    famousProverb: 'إذا دخلت الثابة، زالت عن الفلاح الكآبة واستعدت الأرض للغلال المنسابة.',
    easyTip: 'راقب نباتاتك يومياً؛ في حال ظهور حشرات صغيرة كالمَن، امسح الأوراق بماء وصابون طبيعي مخفف.'
  },
  {
    name: 'ذو مبكر',
    simpleMeaning: 'التبكير والجدية في العمل مع بدء هطول أمطار الصيف',
    simpleClimate: 'أجواء حارة نسبياً نهاراً مع رطوبة مرتفعة، وتتخللها أمطار صيفية رعدية مباركة.',
    keyActions: [
      'متابعة ري المحاصيل الصيفية وتنظيف مجاري السيول وتوجيهها.',
      'زراعة الدخن والسمسم في السهول الساحلية والوديان الدافئة.',
      'تهيئة الحقول وربط الحواجز الترابية لمنع انجراف التربة.'
    ],
    famousProverb: 'بذار مبكر كنز فلاحٍ ذكي، يبني السدود ويستغني عن الشكوى والتأفّف.',
    easyTip: 'تأكد من تنظيف مصارف السطح ومزاريب منزلك قبل بدء موسم أمطار الصيف الغزيرة والسيول.'
  },
  {
    name: 'ذو القياظ',
    simpleMeaning: 'شدة حرارة الصيف وقيظه ونضج الفاكهة الطازجة',
    simpleClimate: 'أجواء شديدة السخونة والحرارة والجفاف، وهو الشهر الأكثر حرارة على الإطلاق.',
    keyActions: [
      'جني ثمار الفواكه اللذيذة كاللوز والمشمش والخوخ والتين البري.',
      'حراثة الأرض الخالية وتقليبها لتعقيمها بأشعة الشمس المحرقة.',
      'زيادة كمية الري للمحاصيل القائمة لتعويض التبخر السريع للمياه.'
    ],
    famousProverb: 'في قيظ الصيف، ينضج اللوز ويحلو الظل والماء للضيف.',
    easyTip: 'اسقِ نباتات حديقتك في الصباح الباكر جداً أو بعد غروب الشمس لتقليل تبخر مياه الري.'
  },
  {
    name: 'ذو المذراء',
    simpleMeaning: 'حراثة وتذرية الأتربة استعداداً لأمطار الخريف الغزيرة',
    simpleClimate: 'أجواء حارة ورطبة مع نشاط واضح للسحب الركامية والرياح المبشرة بالخريف.',
    keyActions: [
      'تذرية وحرث الأتربة لتهويتها وتجديدها قبل هطول سيول الخريف.',
      'بذر السمسم في السهول الدافئة وزراعة الخضار الخريفية.',
      'إصلاح السواقي والحواجز الحجرية لحفظ مياه السيول القادمة.'
    ],
    famousProverb: 'ذري ذرا المذراء، واحرث الأرض البيضاء، يأتيك الخير مع قطرات السماء.',
    easyTip: 'قم بتقليب سطح التربة في حديقتك بعمق 10 سم لتشميسها وتخليصها من بكتيريا الجذور.'
  },
  {
    name: 'ذو الخريف',
    simpleMeaning: 'تجمع ثمار الخريف المباركة وهطول السيول والخيرات الغزيرة',
    simpleClimate: 'أجواء دافئة ورطبة نهاراً ومعتدلة ليلاً، مع غزارة في الأمطار الرعدية والسيول القوية.',
    keyActions: [
      'حصاد محاصيل الذرة الشامية المبكرة والغلال الصيفية الناضجة.',
      'توجيه مياه السيول بعناية لري الأراضي البعيدة وحقن المياه الجوفية.',
      'جني ثمار الرمان والعنب والفاكهة الخريفية الطازجة.'
    ],
    famousProverb: 'سيل الخريف ينظف الوديان، ويسعد الفلاح والراعي في كل ريف.',
    easyTip: 'احصد حبات الرمان الناضجة فوراً وتجنب تركها على الأشجار أثناء هطول المطر لئلا تتشقق وتتلف.'
  },
  {
    name: 'ذو علان',
    simpleMeaning: 'نضج سنابل الذرة الفاخرة وإعلان مواسم الحصاد الأكبر',
    simpleClimate: 'أجواء معتدلة ومنعشة نهاراً، مع نسائم خريفية باردة وممتعة تهب خلال الليل.',
    keyActions: [
      'بذر محاصيل القمح الشتوي (الواهب) وتجهيز السواقي لامتصاص الندى.',
      'متابعة نضج السنابل وبدء قطع أوراق الذرة السفلى لتدخلها الشمس.',
      'الاستعداد الكامل وتجهيز أدوات وساحات دراسة الحبوب (المخابئ).'
    ],
    famousProverb: 'إذا هل ذو علان، نضج حب السنابل في الوديان وبان، وامتلأ الميزان.',
    easyTip: 'اجمع الأوراق الجافة المتساقطة بكثرة في هذا الفصل واخلطها بتربة حديقتك لصناعة سماد طبيعي غني.'
  },
  {
    name: 'ذو الصراب',
    simpleMeaning: 'الحصاد الأكبر والأشمل للغلال والحبوب في ربوع اليمن',
    simpleClimate: 'أجواء خريفية جافة وصافية تماماً نهاراً، مع ليل بارد وسماء مرصعة بالنجوم اللامعة.',
    keyActions: [
      'حصاد وصراب الذرة بجميع أنواعها ونقل السنابل بحذر لساحات التجفيف.',
      'تجفيف الحبوب تحت أشعة الشمس الذهبية لحمايتها من التسوس والرطوبة.',
      'إخلاء الأراضي الزراعية وتهيئتها لفترة الراحة الشتوية الهامة.'
    ],
    famousProverb: 'الصراب يسرّ الفؤاد، ويهون معه التعب والجهاد، ويمتد الخير للبلاد.',
    easyTip: 'احرص على تجفيف البذور والحبوب جيداً تحت الشمس لعدة أيام قبل تعبئتها في أكياس القماش لحفظها.'
  },
  {
    name: 'ذو المهلة',
    simpleMeaning: 'إعطاء مهلة وراحة للأرض الفلاحية والمزارع لتجديد قوتها',
    simpleClimate: 'أجواء شتوية باردة وجافة، مع انخفاض واضح وملحوظ في درجات الحرارة ليلاً.',
    keyActions: [
      'قلب وحراثة التربة الخالية لتعريضها للشمس والبرد لتطهيرها الطبيعي.',
      'تجميع وتخمير الأسمدة الطبيعية البلدية وتوزيعها على الأراضي الخالية.',
      'تقليم أشجار الفواكه متساقطة الأوراق كاللوز والمشمش والتفاح.'
    ],
    famousProverb: 'من أراح أرضه في المهلة، نال غلتها في الصيف بالسهلة دون غصة ولا حيلة.',
    easyTip: 'قم بتقليم أشجار الحمضيات والفاكهة المنزلية الآن لكونها في مرحلة سكون العصارة والراحة.'
  },
  {
    name: 'ذو الآل',
    simpleMeaning: 'ذروة شدة البرد الشتوي وهبوط الصقيع الجليدي (الضريب)',
    simpleClimate: 'شديد البرودة والجفاف التام، وتحدث فيه ظاهرة الضريب فجراً في المرتفعات الجبلية.',
    keyActions: [
      'حماية الخضروات والنباتات الحساسة بالتغطية البلاستيكية أو القش.',
      'الري الخفيف السطحي للمزروعات والقات مساءً لمنع تجمد رطوبة التربة.',
      'تدفئة خلايا النحل وتزويدها بالغذاء الكافي لضمان سلامتها.'
    ],
    famousProverb: 'في ذو الآل، التفت الشيلان على الرجال، وتجمد الماء في الأواني والتلال.',
    easyTip: 'غطِّ نباتات الزينة الخارجية الحساسة بقطع من البلاستيك أو القماش الخفيف لحمايتها من صقيع الفجر القاتل.'
  }
];

export const MARKERS: Marker[] = [
  { 
    manzil: 'الهقعة', 
    marker: 'رابع عشر الخريف', 
    startMonth: 1, 
    startDay: 12, 
    type: 'winter',
    proverb: 'إذا دخلت الهقعة، برد العشاء بقعة.',
    desc: 'يشتد فيه البرد في الليل والصباح الباكر، وتهب رياح شمالية باردة وجافة.',
    recommendations: ['الري المتقارب في المساء لصد الضريب', 'حراثة الأراضي البيضاء لتهويتها', 'تغطية شتلات الفاكهة الحساسة.'],
    solarDegrees: 'ميل الشمس جنوباً بأقصى زاوية فلكية',
    windPattern: 'رياح شمالية جافة نشطة'
  },
  { 
    manzil: 'الهنعة', 
    marker: 'خامس عشر الخريف', 
    startMonth: 1, 
    startDay: 25, 
    type: 'winter',
    proverb: 'الهنعة ربيعة الشمس ولكن البرد رابض.',
    desc: 'تعتدل درجات الحرارة نهاراً مع بقاء الليالي شديدة البرودة والصقيع الجليدي.',
    recommendations: ['البدء بتقليم أشجار اللوزيات', 'حماية خلايا النحل من الرياح الشمالية الباردة', 'تسميد حقول الثوم والبصل.'],
    solarDegrees: 'بداية تحرك الشمس تدريجياً نحو الشمال',
    windPattern: 'رياح متقلبة الاتجاه خفيفة'
  },
  { 
    manzil: 'الذراع', 
    marker: 'سادس عشر الخريف', 
    startMonth: 2, 
    startDay: 7, 
    type: 'winter',
    proverb: 'الذراع برد قاطع أو مطر دافق.',
    desc: 'فترة انتقالية هامة؛ قد تشهد هطول أمطار خفيفة مفاجئة أو موجة برد مفاجئة تجفف النباتات.',
    recommendations: ['زراعة أصناف البطاطا الشتوية', 'الاهتمام بالتسميد العضوي المتخمّر لتدفئة الجذور', 'رش الكبريت الزراعي الوقائي.'],
    solarDegrees: 'ارتفاع زاوية مطلع الشمس صباحاً',
    windPattern: 'رياح شمالية شرقية رطبة أحياناً'
  },
  { 
    manzil: 'النثرة', 
    marker: 'سابع عشر الخريف', 
    startMonth: 2, 
    startDay: 20, 
    type: 'winter',
    proverb: 'النثرة طباخ البرد وبداية انصرافه.',
    desc: 'ذروة شدة البرودة وبداية الصعود الحراري التدريجي، وهو وقت انصراف برد الشتاء الفعلي.',
    recommendations: ['استكمال غرس عقل العنب والتين والرمان', 'الري السطحي الوفير لشتلات الفواكه المطعمة حديثاً', 'تجهيز بذور الدثأ.'],
    solarDegrees: 'اعتدال طفيف في درجات حرارة الصباح الباكر',
    windPattern: 'رياح هادئة رطبة'
  },
  { 
    manzil: 'الطرف', 
    marker: 'ثامن عشر الخريف', 
    startMonth: 3, 
    startDay: 5, 
    type: 'spring',
    proverb: 'الطرف ربيعة الخريف المبكر وبداية الدفء.',
    desc: 'بدء اعتدال الجو وظهور أولى علامات الربيع، وهو من أحب المعالم للمزارعين الجبليين.',
    recommendations: ['بذر محاصيل الدثأ الأول (القمح والشعير والعدس والعتر)', 'تقليم الحمضيات وتنظيف السواقي', 'تسميد أشجار القات.'],
    solarDegrees: 'تعامد تقريبي للشمس على خط الاستواء الزراعي',
    windPattern: 'رياح جنوبية دافئة محملة بالرطوبة'
  },
  { 
    manzil: 'الجبهة', 
    marker: 'الصلم الثاني (تاسع عشر)', 
    startMonth: 3, 
    startDay: 18, 
    type: 'spring',
    proverb: 'الجبهة تحيي كل جبهة وتجلب الخير الوفير.',
    desc: 'تتميز بارتفاع درجات الحرارة ونشاط العصارة في الأشجار، وبداية تفتح البراعم والأزهار.',
    recommendations: ['بذر الذرة الشامية في المناطق المعتدلة والساحلية', 'تطعيم أشجار اللوز والدرّاق والمانجو', 'البدء بتنظيم ري بساتين الرمان.'],
    solarDegrees: 'ارتفاع واضح لقرص الشمس وزيادة طول النهار',
    windPattern: 'رياح جنوبية غربية رطبة'
  },
  { 
    manzil: 'الزبرة', 
    marker: 'العشرين / ظلام', 
    startMonth: 4, 
    startDay: 1, 
    type: 'spring',
    proverb: 'الزبرة ثلث البرد الحقيقي ولا تأمن غدرها.',
    desc: 'فترة قد تشهد تقلبات جوية مفاجئة وهطول أمطار الربيع الغزيرة المصحوبة بالبرد أحياناً.',
    recommendations: ['الاهتمام بحماية المشاتل من حبات البرد الشديدة', 'مراقبة حقول القمح ضد الصدأ الأصفر', 'رش العناصر الصغرى للأشجار المثمرة.'],
    solarDegrees: 'ارتفاع زاوية الإشعاع الشمسي نهاراً',
    windPattern: 'رياح شمالية غربية نشطة مسببة للسحب الركامية'
  },
  { 
    manzil: 'الصرفة', 
    marker: 'عواد', 
    startMonth: 4, 
    startDay: 14, 
    type: 'spring',
    proverb: 'الصرفة تصرف البرد والعلل والأمراض.',
    desc: 'انصراف البرد كلياً وارتفاع درجات الحرارة بوضوح، مع هبوب نسمات دافئة نهاراً وليلاً.',
    recommendations: ['بذار الذرة الرفيعة في الجبال والأودية المعتدلة', 'تسميد محاصيل الخضروات بالنيتروجين لتعزيز النمو الخضري', 'البدء بجني الخضروات الورقية الشتوية.'],
    solarDegrees: 'ميل الشمس شمالاً نحو مدار السرطان',
    windPattern: 'رياح جنوبية شرقية دافئة وجافة'
  },
  { 
    manzil: 'العواء', 
    marker: 'روابع أول', 
    startMonth: 4, 
    startDay: 27, 
    type: 'spring',
    proverb: 'العواء تفتح الأبواب لرياح الصيف وأمطاره.',
    desc: 'بداية هطول أمطار الصيف الخفيفة وتجمع السحب الرعدية على المرتفعات الغربية والجنوبية.',
    recommendations: ['الاستعداد للموسم الصيفي الأول لبذار الذرة الرفيعة', 'عزق الحقول وتنظيف الأعشاب الضارة', 'ري بساتين الفاكهة رياً خفيفاً.'],
    solarDegrees: 'اقتراب تعامد الشمس على المرتفعات اليمنية',
    windPattern: 'رياح غربية رطبة نشطة عصراً'
  },
  { 
    manzil: 'السماك', 
    marker: 'روابع ثاني', 
    startMonth: 5, 
    startDay: 10, 
    type: 'summer',
    proverb: 'السماك سماك الخير والبركة والأمطار الغزيرة.',
    desc: 'فترة مطيرة وهامة جداً، تشهد هطول أمطار الصيف الغزيرة التي تروي الأراضي والقيعان.',
    recommendations: ['توجيه السيول نحو الحقول الزراعية ومدرجات الجبال', 'زراعة الحبوب الشامية والبلدية', 'تطعيم الحمضيات.'],
    solarDegrees: 'تعامد الشمس الفلكي شبه الكامل على أرياف صنعاء وعمران',
    windPattern: 'رياح جنوبية غربية محملة بسحب ممطرة كثيفة'
  },
  { 
    manzil: 'الغفر', 
    marker: 'خامس', 
    startMonth: 5, 
    startDay: 23, 
    type: 'summer',
    proverb: 'الغفر يغفر الذنوب ويسقي الحروث.',
    desc: 'استمرار هطول الأمطار الصيفية وامتلاء الآبار وتدفق الشلالات الطبيعية بالأودية.',
    recommendations: ['صيانة مصارف المياه في المدرجات لمنع انجراف التربة', 'إزالة الأعشاب الضارة من حقول الحبوب الصيفية', 'متابعة تلقيح النخيل في السهول.'],
    solarDegrees: 'الشمس تبلغ أقصى ارتفاع لها في سماء اليمن نهاراً',
    windPattern: 'رياح متقلبة مصحوبة بعواصف رعدية'
  },
  { 
    manzil: 'الزبانا', 
    marker: 'سادس', 
    startMonth: 6, 
    startDay: 5, 
    type: 'summer',
    proverb: 'الزبانا لفح الهجير ووهج الصيف.',
    desc: 'اشتداد وهج الشمس وجفاف الهواء مؤقتاً في فترات انقطاع المطر، مع رطوبة عالية في السواحل.',
    recommendations: ['تكثيف الري للمحاصيل الورقية والخضروات الفاكهية', 'مكافحة حشرة صانعة الأنفاق', 'حماية بساتين المانجو من ذبابة الفاكهة.'],
    solarDegrees: 'التعامد الشمسي المباشر فوق مدار السرطان',
    windPattern: 'رياح شمالية شرقية حارة وجافة (رياح السموم)'
  },
  { 
    manzil: 'الإكليل', 
    marker: 'سابع', 
    startMonth: 6, 
    startDay: 18, 
    type: 'summer',
    proverb: 'الإكليل أول نجوم القيظ الحارة.',
    desc: 'دخول القيظ، حيث تشتد درجات الحرارة نهاراً، ويزداد نضج الفواكه كالمشمش والخوخ واللوز.',
    recommendations: ['جني اللوزيات والبدء بتسويقها', 'ري حقول الذرة الرفيعة التي شاركت في طرد السنابل', 'تسميد بساتين الحمضيات بالبوتاسيوم.'],
    solarDegrees: 'بدء هبوط الشمس التراجعي تدريجياً نحو الجنوب',
    windPattern: 'رياح شمالية حارة نشطة مثيرة للأتربة'
  },
  { 
    manzil: 'القلب', 
    marker: 'ثامن', 
    startMonth: 7, 
    startDay: 1, 
    type: 'summer',
    proverb: 'القلب قلب القيظ وقلب ماء الغمام.',
    desc: 'ذروة القيظ الصيفي، يرافقه هبوب عواصف ترابية مع بداية عودة تجمع الغيوم الركامية الممطرة.',
    recommendations: ['الري الغزير للأشجار المثمرة والقات لتعويض التبخر الشديد', 'تغطية عذوق النخيل في السهول الساحلية', 'حرث الأرض البيضاء حراثة صيفية عميقة.'],
    solarDegrees: 'انخفاض طفيف في زاوية ارتفاع الشمس نهاراً',
    windPattern: 'رياح شمالية شرقية مغبرة وحارة نهاراً'
  },
  { 
    manzil: 'الشولة', 
    marker: 'الظلم الأول (تاسع)', 
    startMonth: 7, 
    startDay: 14, 
    type: 'autumn',
    proverb: 'الشولة تشول المطر شولاً وتطفي لهيب القيظ.',
    desc: 'بدء انكسار موجة الحر وتهب رياح رطبة تبشر بأمطار الخريف الموسمية الوفيرة.',
    recommendations: ['تجهيز السواقي والمنافذ لاستقبال أمطار الخريف الغزيرة', 'زراعة محاصيل العلف كالقضب (البرسيم) والذرة البلدية', 'حماية البساتين من الغرق بالسيول.'],
    solarDegrees: 'عودة الشمس تدريجياً للتعامد على وسط اليمن',
    windPattern: 'رياح جنوبية غربية نشطة ورطبة جداً'
  },
  { 
    manzil: 'النعائم', 
    marker: 'الظلم الثاني (عاشر)', 
    startMonth: 7, 
    startDay: 27, 
    type: 'autumn',
    proverb: 'النعائم تنعم فيه الرياح بالندى والبركة.',
    desc: 'اعتدال ملحوظ في درجات الحرارة نهاراً مع رطوبة عالية وهطول أمطار الخريف بشكل يومي تقريباً.',
    recommendations: ['بذار السمسم والفاصوليا في سهول تهامة والوديان الدافئة', 'مراقبة حقول الطماطم والبطاطا لتجنب اللفحة المتأخرة', 'مكافحة العناكب على الحمضيات.'],
    solarDegrees: 'هبوط مستمر لقرص الشمس باتجاه خط الاستواء',
    windPattern: 'رياح غربية رطبة وممطرة'
  },
  { 
    manzil: 'البلدة', 
    marker: 'سهيل (حادي عشر)', 
    startMonth: 8, 
    startDay: 9, 
    type: 'autumn',
    proverb: 'البلدة بلدة السحاب والخير ورؤية سهيل اليماني.',
    desc: 'دخول نجم سهيل اليماني الشهير، وتتميز هذه الفترة بأمطارها الغزيرة وجوها اللطيف المعتدل.',
    recommendations: ['بذار محاصيل الحبوب الشتوية كالقمح والبر في المرتفعات', 'جني ثمار التين والرمان والعنب الفاخر', 'تخزين الأعلاف والمراعي الطبيعية.'],
    solarDegrees: 'ظهور نجم سهيل في الأفق الجنوبي لليمن فجراً',
    windPattern: 'رياح جنوبية شرقية خفيفة دافئة ورطبة'
  },
  { 
    manzil: 'سعد الذابح', 
    marker: 'روابع اول الخريف', 
    startMonth: 8, 
    startDay: 22, 
    type: 'autumn',
    proverb: 'سعد الذابح يذبح البرد مؤقتاً بالدفء.',
    desc: 'جو معتدل دافئ يميل للبرودة قليلاً في الليالي الصافية، وتستمر أمطار الخريف الخفيفة.',
    recommendations: ['بدء حراثة الأراضي بعد حصاد بعض الغلال الصيفية', 'زراعة الثوم والبصل في المرتفعات', 'تطعيم الحمضيات الخريفية.'],
    solarDegrees: 'تعامد الشمس على خط الاستواء الخريفي فلكياً',
    windPattern: 'رياح شمالية شرقية باردة ليلاً'
  },
  { 
    manzil: 'سعد بلع', 
    marker: 'روابع ثاني الخريف', 
    startMonth: 9, 
    startDay: 4, 
    type: 'autumn',
    proverb: 'سعد بلع يبلع المياه والسيول بلعاً.',
    desc: 'بداية تراجع كميات الأمطار وتشرب الأرض السريع للمياه، والجو لطيف دافئ نهاراً.',
    recommendations: ['إعداد الحقول وتسميدها استعداداً للموسم الشتوي', 'جني محاصيل البطاطا والذرة الصفراء والخضروات', 'تنظيف بساتين العنب بعد قطافها.'],
    solarDegrees: 'استمرار تراجع زاوية مطلع الشمس جنوباً',
    windPattern: 'رياح خفيفة متقلبة الاتجاه'
  },
  { 
    manzil: 'سعد السعود', 
    marker: 'خامس الخريف', 
    startMonth: 9, 
    startDay: 17, 
    type: 'autumn',
    proverb: 'سعد السعود تخضر العود وتجري فيه المياه.',
    desc: 'نمو خضري ممتاز للأشجار، والجو دافئ نهاراً وبارد نسبياً ليلاً، وهو موسم زراعي خصب ومميز.',
    recommendations: ['بذار القمح الشتوي الملقب بـ "الواهب" في المناطق المعتدلة والباردة', 'رش بساتين التفاح بالمركبات النحاسية الوقائية', 'جني الرمان البلدي وتخزينه.'],
    solarDegrees: 'ميل واضح لارتفاع قرص الشمس باتجاه الجنوب الكلي',
    windPattern: 'رياح شمالية شرقية باردة وجافة نسبياً ليلاً'
  },
  { 
    manzil: 'سعد الأخبية', 
    marker: 'سادس الخريف', 
    startMonth: 9, 
    startDay: 30, 
    type: 'autumn',
    proverb: 'سعد الأخبية تخرج الأفاعي وتدفأ الخبايا.',
    desc: 'فترة خريفية دافئة وهادئة، تمهد لدخول فصل الشتاء وبدء جفاف أوراق بعض الأشجار متساقطة الأوراق.',
    recommendations: ['تلقيح النخيل المتأخر وحصاد التمور في الأودية الدافئة', 'عزق وتفريد الخضروات المزروعة حديثاً', 'إضافة الكبريت الزراعي للمزروعات.'],
    solarDegrees: 'انخفاض واضح لدرجات الحرارة الصغرى فجراً',
    windPattern: 'رياح شمالية غربية جافة'
  },
  { 
    manzil: 'الفرع المقدم', 
    marker: 'سابع الخريف', 
    startMonth: 10, 
    startDay: 13, 
    type: 'autumn',
    proverb: 'الفرع المقدم برد شديد ورياح عاتية تمهد للصراب.',
    desc: 'دخول رياح الصراب الباردة والجافة، والبدء الفعلي بجفاف سنابل الذرة واصفرار الحقول استعداداً للحصاد الكبير.',
    recommendations: ['الاستعداد لعملية الصراب (حصاد الذرة الرفيعة والبيضاء الشامل)', 'الامتناع عن الري الزائد للذرة في مرحلة اصفرار الأوراق', 'تجهيز المفارش لتجفيف السنابل.'],
    solarDegrees: 'تناقص مستمر في طول النهار وزيادة طول الليل وبداية قوية للشتاء الكوني',
    windPattern: 'رياح شمالية شرقية جافة وباردة ونشطة جداً (رياح الصراب)'
  },
  { 
    manzil: 'الفرع المؤخر', 
    marker: 'ثامن الخريف', 
    startMonth: 10, 
    startDay: 26, 
    type: 'winter',
    proverb: 'الفرع المؤخر برد مقبل وحصاد مكتمل.',
    desc: 'بلوغ ذروة موسم صراب وحصاد الحبوب وتجميعها، والجو بارد وجاف مع سطوع شمس قوية نهاراً.',
    recommendations: ['حصاد المحاصيل وتجفيفها تحت أشعة الشمس المباشرة لتجنب العفن', 'تخزين الحبوب في المخابئ التقليدية (المدافن) أو مخازن حديثة معقمة', 'تقليم بعض أشجار الفاكهة.'],
    solarDegrees: 'قرص الشمس يميل بأكبر زاوية جنوباً في سماء اليمن',
    windPattern: 'رياح شمالية شرقية باردة وجافة'
  },
  { 
    manzil: 'بطن الحوت / الرشا', 
    marker: 'تاسع الخريف', 
    startMonth: 11, 
    startDay: 8, 
    type: 'winter',
    proverb: 'بطن الحوت يرطب الحوت ويهبط الندى الوفير.',
    desc: 'انخفاض حاد في درجات الحرارة ليلاً مع هبوط ندى خريفي كثيف وبارد جداً فجراً.',
    recommendations: ['ري الخضروات القائمة رياً منتظماً في الصباح الباكر فقط لدرء الصقيع فجراً', 'رش بساتين القات والفاكهة بالسماد الورقي والأحماض الأمينية للتدفئة', 'تدفئة خلايا النحل.'],
    solarDegrees: 'انخفاض ملموس لزاوية سقوط أشعة الشمس نهاراً',
    windPattern: 'رياح هادئة رطبة ليلاً وباردة جداً فجراً'
  },
  { 
    manzil: 'الشرطين', 
    marker: 'عاشر الخريف', 
    startMonth: 11, 
    startDay: 21, 
    type: 'winter',
    proverb: 'الشرطين برد البساتين ويباس الطين.',
    desc: 'برد شتوي قارس وجاف، تيبس فيه أوراق الأشجار غير مستديمة الخضرة وتبدأ السكون الشتوي.',
    recommendations: ['البدء بعمليات قلب التربة للأراضي الخالية لتهويتها وتعريضها للشمس والبرد لتطهيرها', 'حماية الخضروات بالغطاء البلاستيكي إن أمكن', 'تقليل ري الحمضيات.'],
    solarDegrees: 'اقتراب الشمس من نقطة الانقلاب الشتوي الكلي',
    windPattern: 'رياح شمالية شرقية جافة وشديدة البرودة'
  },
  { 
    manzil: 'البطين', 
    marker: 'حادي عشر الخريف', 
    startMonth: 12, 
    startDay: 4, 
    type: 'winter',
    proverb: 'البطين يبطن الأرض بالصقيع ويجمد الماء فجراً.',
    desc: 'يشتد البرد ويحدث الصقيع الجليدي (الضريب) في المرتفعات الجبلية العالية كذمار وصنعاء وعمران ويضر بالقات والخضروات.',
    recommendations: ['الري الغزير للأشجار المهددة بالضريب مساءً لحماية جذورها', 'رش الكبريت الميكروني لتدفئة النباتات', 'تدفئة الحقول بحرق المخلفات الزراعية بحذر.'],
    solarDegrees: 'أقصر نهار في السنة في اليمن وبلوغ الشتاء الفلكي ذروته العظمى',
    windPattern: 'رياح شمالية هادئة وشديدة البرودة وتوقف تام لحركة الهواء الدافئ'
  },
  { 
    manzil: 'الثريا', 
    marker: 'ثاني عشر الخريف', 
    startMonth: 12, 
    startDay: 17, 
    type: 'winter',
    proverb: 'الثريا رأس البرد الفعلي وعمود الضريب القاتل.',
    desc: 'أخطر فترات الشتاء على الإطلاق على محاصيل الخضروات والقات، حيث تسجل درجات حرارة قريبة من الصفر المئوي.',
    recommendations: ['حماية مشاتل الطماطم والبطاطا والقات بغطاء محكم', 'ري المحاصيل رياً سطحياً خفيفاً ليلاً لمنع تجمد رطوبة التربة فجراً', 'البدء بتجميع عقل الفاكهة.'],
    solarDegrees: 'تعامد الشمس على مدار الجدي بأقصى زاوية ميل جنوبي',
    windPattern: 'سكون كلي للهواء ليلاً مما يسهل تشكل الصقيع السطحي القاتل'
  },
  { 
    manzil: 'الدبران', 
    marker: 'ثالث عشر الخريف', 
    startMonth: 12, 
    startDay: 30, 
    type: 'winter',
    proverb: 'الدبران ييبس الأوراق في الأغصان ويجفف الوديان.',
    desc: 'تستمر البرودة القارسة مع هبوب رياح جافة تسبب تشققات في جذوع الأشجار وجفافاً للأراضي.',
    recommendations: ['دهان جذوع الأشجار بالجير والجنزار لحمايتها من الفطريات وتشقق البرد', 'تقليم أشجار اللوزيات والتفاح والرمان لكونها في مرحلة السكون التام', 'تحضير السماد البلدي.'],
    solarDegrees: 'بداية الارتداد الطفيف جداً للشمس نحو الشمال ودخول العام الميلادي الجديد',
    windPattern: 'رياح شمالية شرقية جافة وباردة جداً ومستمرة طوال اليوم'
  }
];

export const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

export const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

export const getAgriculturalDetails = (date: Date) => {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // Find Himyarite Month
  let currentHimyariteMonth = HIMYARITE_MONTHS[HIMYARITE_MONTHS.length - 1]; // Default to last one (ذو الآل)
  let currentMonthIndex = -1;
  
  for (let i = 0; i < HIMYARITE_MONTHS.length; i++) {
    const m = HIMYARITE_MONTHS[i];
    if (month > m.startMonth || (month === m.startMonth && day >= m.startDay)) {
       currentHimyariteMonth = m;
       currentMonthIndex = i;
    } else {
       break;
    }
  }

  // Calculate Agricultural Day in the Himyarite Month
  let agriculturalDay = 1;
  const startHimMonth = new Date(date.getFullYear(), currentHimyariteMonth.startMonth - 1, currentHimyariteMonth.startDay);
  
  if (date.getTime() >= startHimMonth.getTime()) {
      const diffTime = Math.abs(date.getTime() - startHimMonth.getTime());
      agriculturalDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  } else {
      const prevYearStart = new Date(date.getFullYear() - 1, currentHimyariteMonth.startMonth - 1, currentHimyariteMonth.startDay);
      const diffTime = Math.abs(date.getTime() - prevYearStart.getTime());
      agriculturalDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  // Find Marker/Manzil
  let currentMarker = MARKERS[MARKERS.length - 1];
  let currentMarkerIndex = -1;
  for (let i = 0; i < MARKERS.length; i++) {
    const m = MARKERS[i];
    if (month > m.startMonth || (month === m.startMonth && day >= m.startDay)) {
      currentMarker = m;
      currentMarkerIndex = i;
    } else {
      break;
    }
  }

  // Calculate days passed in marker
  let markerDay = 1;
  const startMarker = new Date(date.getFullYear(), currentMarker.startMonth - 1, currentMarker.startDay);
  
  if (date.getTime() >= startMarker.getTime()) {
      const diffTime = Math.abs(date.getTime() - startMarker.getTime());
      markerDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  } else {
      const prevYearStart = new Date(date.getFullYear() - 1, currentMarker.startMonth - 1, currentMarker.startDay);
      const diffTime = Math.abs(date.getTime() - prevYearStart.getTime());
      markerDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  // Season logic based on equinoxes/solstices roughly
  let seasonName: 'الشتاء' | 'الربيع' | 'الصيف' | 'الخريف' = 'الشتاء';
  if ((month === 3 && day >= 21) || month === 4 || month === 5 || (month === 6 && day < 22)) {
      seasonName = 'الربيع';
  } else if ((month === 6 && day >= 22) || month === 7 || month === 8 || (month === 9 && day < 22)) {
      seasonName = 'الصيف';
  } else if ((month === 9 && day >= 22) || month === 10 || month === 11 || (month === 12 && day < 22)) {
      seasonName = 'الخريف';
  }

  return {
    gregorian: date,
    himyariteMonth: currentHimyariteMonth,
    himyariteDay: agriculturalDay,
    marker: currentMarker,
    markerIndex: currentMarkerIndex,
    monthIndex: currentMonthIndex,
    markerDay: markerDay,
    season: seasonName,
  };
};

/**
 * Returns a list of all active markers for a given Himyarite month.
 */
export const getMarkersForHimyariteMonth = (himyariteMonth: HimyariteMonth): Marker[] => {
  // Since Himyarite months are 30-31 days starting on the 14th of Gregorian months, 
  // we can map which markers overlap with this interval.
  const active: Marker[] = [];
  const tempDate = new Date(2026, himyariteMonth.startMonth - 1, himyariteMonth.startDay + 2); // somewhere in early month
  
  // Let's sweep day by day for the duration of the month and collect unique markers
  for (let d = 0; d < himyariteMonth.duration; d++) {
    const sweepDate = new Date(2026, himyariteMonth.startMonth - 1, himyariteMonth.startDay + d);
    const details = getAgriculturalDetails(sweepDate);
    if (!active.some(m => m.manzil === details.marker.manzil)) {
      active.push(details.marker);
    }
  }
  return active;
};

/**
 * Generates an array of all days for the current Himyarite Month.
 * Useful for rendering the monthly grid.
 */
export interface HimyariteMonthDayInfo {
  himyariteDayNumber: number;
  gregorianDate: Date;
  marker: Marker;
  markerDayNumber: number;
  isToday: boolean;
  isSelected: boolean;
}

export const getDaysForHimyariteMonth = (
  selectedDate: Date, 
  himyariteMonth: HimyariteMonth
): HimyariteMonthDayInfo[] => {
  const days: HimyariteMonthDayInfo[] = [];
  const year = selectedDate.getFullYear();
  const today = new Date();
  
  // Determine start year of this Himyarite month (could be previous year if wrapping)
  let startYear = year;
  const currentDetails = getAgriculturalDetails(selectedDate);
  
  // If the selectedDate is in January/February but the Himyarite month started in December of previous year:
  if (himyariteMonth.name === 'ذو الآل' && selectedDate.getMonth() < 3) {
    startYear = year - 1;
  } else if (himyariteMonth.name === 'ذو شرف' && selectedDate.getMonth() === 0 && selectedDate.getDate() < 14) {
    startYear = year - 1;
  }
  
  for (let d = 0; d < himyariteMonth.duration; d++) {
    // Generate the exact Gregorian date for this day of the month
    const gDate = new Date(startYear, himyariteMonth.startMonth - 1, himyariteMonth.startDay + d);
    const details = getAgriculturalDetails(gDate);
    
    days.push({
      himyariteDayNumber: d + 1,
      gregorianDate: gDate,
      marker: details.marker,
      markerDayNumber: details.markerDay,
      isToday: gDate.toDateString() === today.toDateString(),
      isSelected: gDate.toDateString() === selectedDate.toDateString()
    });
  }
  
  return days;
};
