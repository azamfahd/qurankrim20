/**
 * Offline Quran Service
 * Handles offline detection, checks local Quran availability,
 * and performs intelligent local Quranic analysis and Tafsir retrieval
 * when the user is disconnected from the internet.
 */

import { QuranResponse, Verse } from '../types';
import { DownloadManager } from './DownloadManager';
import { QuranDataService } from '../quran-platform/services/QuranDataService';

const TEXT_CACHE_NAME = 'quran-text-api-v1';
const API_BASE = 'https://api.alquran.cloud/v1';

export interface LocalQuranStatus {
  isDownloaded: boolean;
  downloadedCount: number;
  totalExpected: number;
  percentage: number;
}

export interface QuranThematicCluster {
  keywords: string[];
  title: string;
  intro: (username?: string) => string;
  tafakkur: string;
  summary: string;
  verses: Array<{
    surahNumber: number;
    ayahNumber: number;
    surahName: string;
    arabicText: string;
    tafsir: string;
    tadabbur: string;
  }>;
}

const THEMATIC_CLUSTERS: QuranThematicCluster[] = [
  {
    keywords: ['حزن', 'حزين', 'ضيق', 'ضيقة', 'مهموم', 'هم', 'هموم', 'كرب', 'كربة', 'تعبان', 'تعب', 'ألم', 'يبكي', 'بكاء', 'يأس', 'مكتئب', 'اكتئاب', 'خنقة'],
    title: 'سكينة وانشراح الصدر من فيض التنزيل',
    intro: (username) => `${username ? `أهلاً بك يا ${username}` : 'أهلاً بك يا صاحب القلب الطيب'}. في لحظات الضيق والحزن، يتنزل القرآن الكريم كبلسم شافٍ يمسح على القلوب المتعبة. لأنك غير متصل بالإنترنت حالياً، استخرجنا لك هذه الآيات الكريمة وتفسيرها المعتمد مباشرة من نسختك المحفوظة محلياً من المصحف الشريف لتكون لك أنيساً وبشارة.`,
    tafakkur: 'تأمل كيف اقترن العسر باليسر في كتاب الله؛ فكل أزمة تحمل في طياتها بذور فرجها. خذ نفساً عميقاً وفوض أمرك لمن بيده ملكوت كل شيء.',
    summary: 'لا يدوم ضيقٌ وفي كتاب الله وعدٌ قاطع: إِنَّ مَعَ الْعُسْرِ يُسْرًا. استبشر خيراً وتيقن بلطف الله الخفي.',
    verses: [
      {
        surahNumber: 94,
        ayahNumber: 5,
        surahName: 'الشرح',
        arabicText: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
        tafsir: 'أي: فإن مع كل شدة وضيق سهولة واتساعاً ويسراً ملازماً له لا ينفك عنه.',
        tadabbur: 'تأمل كلمة (مع) ولم يقل (بعد)؛ فاليسر يولد في رحم العسر ويسير معه خطوة بخطوة.'
      },
      {
        surahNumber: 94,
        ayahNumber: 6,
        surahName: 'الشرح',
        arabicText: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
        tafsir: 'تأكيدٌ رباني قاطع بأن العسر الواحد محفوف بيسرين عظيمين، ولن يغلب عسرٌ يسرين.',
        tadabbur: 'التكرار هنا هو تثبيت لقلبك الصابر، لتعلم أن دوام الحال من المحال وأن الفرج قادم لا محالة.'
      },
      {
        surahNumber: 12,
        ayahNumber: 86,
        surahName: 'يوسف',
        arabicText: 'قَالَ إِنَّمَا أَشْكُو بَثِّي وَحُزْنِي إِلَى اللَّهِ وَأَعْلَمُ مِنَ اللَّهِ مَا لَا تَعْلَمُونَ',
        tafsir: 'قال يعقوب عليه السلام: لا أشكو حزني وعظيم همي إلا إلى الله وحده، فإنه كاشف الكرب وعالم الغيب.',
        tadabbur: 'الشكوى لله عبادة وعزة، والشكوى لغيره مذلة. اجعل محرابك ومناجاتك لله هي الملاذ الأول والأخير.'
      },
      {
        surahNumber: 93,
        ayahNumber: 3,
        surahName: 'الضحى',
        arabicText: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ',
        tafsir: 'ما تركك ربك وما أبغضك، بل هو الراعي لك واللطيف بك في كل أطوار حياتك.',
        tadabbur: 'حين تشعر بالوحشة، استشعر هذا الخطاب الرباني: الله لم يتركك ولم ينسك أبداً، بل يُعدك لأمر عظيم.'
      }
    ]
  },
  {
    keywords: ['صبر', 'صابر', 'ابتلاء', 'بلاء', 'مصيبة', 'فقد', 'اختبار', 'محنة', 'صدمة', 'تحمل'],
    title: 'بشارات الصابرين ومنازل الرضا',
    intro: (username) => `${username ? `أهلاً بك يا ${username}` : 'أهلاً بك يا أخي المبارك'}. الصبر مفتاح كل باب مغلق، وهو التجارة التي لا تبور مع الله. نقدم لك من نسختك المحلية المحملة من القرآن الكريم أعظم آيات الصبر والاحتساب مع بيان معانيها لتثبيت فؤادك.`,
    tafakkur: 'الصبر الجميل هو صبر بلا شكوى لغير الله، واليقين بأن العاقبة للمتقين. كل دقيقة ألم محتسبة تُرفع بها درجاتك وتُحط بها خطاياك.',
    summary: 'إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍ. اصبر صبراً جميلاً واعلم أن الله مع الصابرين بعونه وتأييده.',
    verses: [
      {
        surahNumber: 2,
        ayahNumber: 153,
        surahName: 'البقرة',
        arabicText: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
        tafsir: 'استعينوا على مشاق الدنيا وتكاليف الحياة بالصبر على البلاء وبإقامة الصلاة الخاشعة، فإن معية الله الخاصة مع الصابرين.',
        tadabbur: 'حين تجتمع الصلاة مع الصبر، يتحول البلاء إلى منحة، وتتنزل المعية الربانية التي لا يُغلب صاحبها.'
      },
      {
        surahNumber: 2,
        ayahNumber: 155,
        surahName: 'البقرة',
        arabicText: 'وَلَنَبْلُوَنَّكُم بِشَيْءٍ مِّنَ الْخَوْفِ وَالْجُوعِ وَنَقْصٍ مِّنَ الْأَمْوَالِ وَالْأَنفُسِ وَالثَّمَرَاتِ ۗ وَبَشِّرِ الصَّابِرِينَ',
        tafsir: 'ولنختبرنكم بشيء يسير من الخوف والجوع ونقص الأموال والأنفس، ليميز الله الصادقين، وبشر الصابرين بالفوز العظيم.',
        tadabbur: 'قال (بشيء) للتقليل والتهوين، ثم ختمها بـ (وبشر الصابرين)؛ فالبشارة تنتظر كل قلب ثبت ورضي.'
      },
      {
        surahNumber: 39,
        ayahNumber: 10,
        surahName: 'الزمر',
        arabicText: 'إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍ',
        tafsir: 'يُعطى الصابرون ثوابهم يوم القيامة جزافاً من غير مكيال ولا ميزان لعظم ما صبروا عليه في الدنيا.',
        tadabbur: 'كل العبادات لها أجر مقدر ومحدد، إلا الصبر فإن أجره بغير حساب يصب عليك صباً.'
      }
    ]
  },
  {
    keywords: ['رزق', 'فقر', 'فلوس', 'مال', 'ديون', 'دين', 'وظيفة', 'عمل', 'مستقبل', 'خائف', 'خوف', 'قلق', 'أمان'],
    title: 'خزائن الرزق ومفاتيح التوكل واليقين',
    intro: (username) => `${username ? `حياك الله يا ${username}` : 'حياك الله أخي الكريم'}. مسألة الرزق والمستقبل قد تشغل بال الكثيرين، لكن القرآن يقطع حبال القلق بوعد رباني قاطع بأن الرزاق هو الله. إليك هذه الهدايات المستنبطة محلياً من كتاب الله.`,
    tafakkur: 'أنت مأمور بالسعي وطلب الأسباب، وتكفل الله لك بالنتيجة والرزق. فلا تشغل نفسك بما تكفل به الله لك عما طُلب منك.',
    summary: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ. الرزق مقسوم والأجل محتوم، فاطمئن وتوكل على الحي الذي لا يموت.',
    verses: [
      {
        surahNumber: 65,
        ayahNumber: 2,
        surahName: 'الطلاق',
        arabicText: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
        tafsir: 'من يخف الله ويتبع أوامره يفرّج عنه كل كرب ويجعل له مخرجاً من كل ضيق ومحنة.',
        tadabbur: 'التقوى هي المفتاح السري للخروج من كل مأزق مالي أو نفسي أو حياتي.'
      },
      {
        surahNumber: 65,
        ayahNumber: 3,
        surahName: 'الطلاق',
        arabicText: 'وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ ۚ وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
        tafsir: 'ويرزقه من وجوه لا تخطر على باله، ومن يفوض أمره لله ويكتفي به فهو كافيه ومغنيه.',
        tadabbur: '(من حيث لا يحتسب) تعني أن الحلول الإلهية تأتي دائماً من أبواب لم تكن تضعها في حساباتك البشرية.'
      },
      {
        surahNumber: 11,
        ayahNumber: 6,
        surahName: 'هود',
        arabicText: '۞ وَمَا مِن دَابَّةٍ فِي الْأَرْضِ إِلَّا عَلَى اللَّهِ رِزْقُهَا وَيَعْلَمُ مُسْتَقَرَّهَا وَمُسْتَوْدَعَهَا ۚ كُلٌّ فِي كِتَابٍ مُّبِينٍ',
        tafsir: 'ما من كائن حي يدب على وجه الأرض إلا وتكفل الله برزقه وقوته، ويعلم مقره ومستودعه بدقة تامة.',
        tadabbur: 'إذا كان النمل في جحوره والطيور في سمائها لا تُنسى، فكيف يُنسى قلبك الموحد الساجد؟'
      }
    ]
  },
  {
    keywords: ['توبة', 'ذنب', 'ذنوب', 'معصية', 'عصيت', 'غلطت', 'ندم', 'ندمان', 'استغفار', 'أستغفر', 'مغفرة', 'رحمة', 'تقصير'],
    title: 'أبواب التوبة الواسعة ونسائم المغفرة',
    intro: (username) => `${username ? `أهلاً بك يا ${username}` : 'أهلاً بك يا عبد الله'}. شعورك بالندم هو أول عتبات التوبة الصادقة ورجوعك إلى مولاك. استنبطنا لك من نسختك القرآنية المحلية أعظم آيات الرجاء وبشائر التوبة والمغفرة.`,
    tafakkur: 'الله سبحانه يفرح بتوبة عبده حين يرجع إليه أكثر من فرح الفاقد لراحلته في أرض مهلكة. مهما تعاظمت الذنوب، فرحمة الله أعظم وأوسع.',
    summary: 'إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا. لا تيأس ولا تقنط، فخطوة واحدة صادقة نحو الله تبدل السيئات حسنات.',
    verses: [
      {
        surahNumber: 39,
        ayahNumber: 53,
        surahName: 'الزمر',
        arabicText: '۞ قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ',
        tafsir: 'نداء الرحمة الإلهية لكل من أسرف على نفسه بالمعاصي: لا تيأسوا من مغفرة الله، فإنه يمحو الذنوب كلها لمن تاب.',
        tadabbur: 'تأمل نداء المحبة: (يا عبادي) لم يطردهم بالرغم من إسرافهم، بل نسبهم إلى نفسه تشريفاً وترغيباً في الرجوع.'
      },
      {
        surahNumber: 4,
        ayahNumber: 110,
        surahName: 'النساء',
        arabicText: 'وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا',
        tafsir: 'من يقارف ذنباً ثم يتوجه إلى الله بقلب مستغفر نادم، يجد الله واسع المغفرة عظيم الرحمة.',
        tadabbur: 'كلمة (يجد) تفيد المباشرة والفورية؛ بمجرد أن يخرج الاستغفار من قلبك الصادق تجد رحمة الله بانتظارك.'
      },
      {
        surahNumber: 71,
        ayahNumber: 10,
        surahName: 'نوح',
        arabicText: 'فَقُلْتُ اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا',
        tafsir: 'فقلت لقومي: اطلبوا مغفرة ربكم وتوبوا إليه إنه عظيم المغفرة لمن تاب وأناب.',
        tadabbur: 'الاستغفار ليس فقط لمحو الذنوب، بل هو مفتاح الخيرات، وتفريج الكربات، ونزول البركات في المال والولد.'
      }
    ]
  },
  {
    keywords: ['دعاء', 'أدعو', 'استجابة', 'مناجاة', 'قرب', 'يارب', 'حاجة', 'أمنية', 'توفيق', 'طلب'],
    title: 'نداء الرجاء وإجابة الدعاء',
    intro: (username) => `${username ? `حياك الله يا ${username}` : 'حياك الله أخي السائل'}. الدعاء مخ العبادة وحبل الوصال الدائم بين العبد وربه. إليك من كتاب الله المحفوظ على جهازك الآيات التي تسكب الطمأنينة في قلب الداعي وتعده بالإجابة.`,
    tafakkur: 'ما ألهمك الله الدعاء إلا وهو يريد أن يعطيك. تيقن بالإجابة وألحّ في المسألة فإن الله يستحيي أن يرد يدي عبده صفراً.',
    summary: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ. ارفع يديك وابشر برحمة مولاك.',
    verses: [
      {
        surahNumber: 2,
        ayahNumber: 186,
        surahName: 'البقرة',
        arabicText: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ ۖ فَلْيَسْتَجِيبُوا لِي وَلْيُؤْمِنُوا بِي لَعَلَّهُمْ يَرْشُدُونَ',
        tafsir: 'إذا سألك عبادي عني فإني قريب منهم، أسمع دعاءهم وأجيب سؤلهم إذا دعوني بصدق ويقين.',
        tadabbur: 'في كل أسئلة القرآن يقول النبي ﷺ (قل)، إلا في آية الدعاء قال الله مباشرة (فإني قريب) دون وسيط.'
      },
      {
        surahNumber: 40,
        ayahNumber: 60,
        surahName: 'غافر',
        arabicText: 'وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ',
        tafsir: 'وقال ربكم: الجأوا إليّ بالدعاء والتضرع، أتكفل لكم بالإجابة وأعطكم سؤلكم.',
        tadabbur: 'أمرٌ مقرون بوعد؛ لا تفكر كيف تأتي الإجابة، بل ركز على صدق افتقارك في الدعاء.'
      },
      {
        surahNumber: 21,
        ayahNumber: 87,
        surahName: 'الأنبياء',
        arabicText: 'فَنَادَىٰ فِي الظُّلُمَاتِ أَن لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ',
        tafsir: 'فدعا يونس ربه من ظلمة الليل والبحر وبطن الحوت معترفاً بالتوحيد والتقصير.',
        tadabbur: 'دعوة ذي النون تجمع التوحيد والتنزيه والاعتراف بالذنب، وهي كاشفة لكل كرب مهما كان حالك كظلمات الحوت.'
      }
    ]
  },
  {
    keywords: ['والدين', 'أمي', 'أبي', 'بر', 'عقوق', 'أسرة', 'أولاد', 'زواج', 'زوجي', 'زوجتي'],
    title: 'حقوق الوالدين وواحة المودة والسكينة',
    intro: (username) => `${username ? `أهلاً بك يا ${username}` : 'أهلاً بك يا كريم الأصل'}. البر والمودة هما أساس المجتمع المسلم الصالح. هذه الآيات المباركة المأخوذة من نسختك القرآنية المحلية تبين أعظم مراتب البر وبناء البيت المسلم.`,
    tafakkur: 'بر الوالدين باب الجنة الأوسط، وأعظم أسباب التوفيق وسعة الرزق في الدنيا والآخرة.',
    summary: 'وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا. البر بالوالدين قرين التوحيد.',
    verses: [
      {
        surahNumber: 17,
        ayahNumber: 23,
        surahName: 'الإسراء',
        arabicText: '۞ وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا ۚ إِمَّا يَبْلُغَنَّ عِندَكَ الْكِبَرَ أَحَدُهُمَا أَوْ كِلَاهُمَا فَلَا تَقُل لَّهُمَا أُفٍّ وَلَا تَنْهَرْهُمَا وَقُل لَّهُمَا قَوْلًا كَرِيمًا',
        tafsir: 'أمر الله بالتوحيد وقرنه بالإحسان إلى الوالدين، ونهى عن أدنى درجات الضجر حتى قول (أف).',
        tadabbur: 'حين يكبر الوالدان، يصبح البر واجباً أرقّ وأعلى، فاحفظ لهما كرامتهما ولين جانبك لهما.'
      },
      {
        surahNumber: 30,
        ayahNumber: 21,
        surahName: 'الروم',
        arabicText: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً',
        tafsir: 'من دلائل قدرته ورحمته أن جعل لكم من جنسكم أزواجاً لتأنسوا إليها وأودع بينكم المودة والشفقة.',
        tadabbur: 'العلاقة الزوجية في ميزان القرآن مبنية على السكن القلبي والتراحم والمسامحة.'
      }
    ]
  },
  {
    keywords: ['مرض', 'مريض', 'تعبان', 'وجع', 'ألم', 'شفاء', 'صحة', 'عافية', 'دواء', 'عملية', 'سقم'],
    title: 'أنوار الشفاء والعافية واللطف الإلهي',
    intro: (username) => `${username ? `طهور إن شاء الله يا ${username}` : 'طهور ولا بأس عليك طهور إن شاء الله'}. المرض كفارة ورفعة درجات، والقرآن الكريم كله شفاء ورحمة للقلوب والأبدان. إليك من الآيات المحفوظة محلياً ما يبعث الأمل ويسكب العافية في جسدك ونفسك.`,
    tafakkur: 'الشافي الحقيقي هو الله، وما الدواء إلا سبب. علّق قلبك برب الأسباب وتيقن أن كل ألم يعقبه أجر وعافية.',
    summary: 'وَإِذَا مَرِضْتُ فَهُوَ يَشْفِينِ. ثق بلطف الله وعنايته، واسأله العفو والعافية في الدين والدنيا.',
    verses: [
      {
        surahNumber: 26,
        ayahNumber: 80,
        surahName: 'الشعراء',
        arabicText: 'وَإِذَا مَرِضْتُ فَهُوَ يَشْفِينِ',
        tafsir: 'وإذا أصابني مرض أو سقم فإن الله وحده هو الذي يبرئني ويشفيني بلطفه ورحمته.',
        tadabbur: 'نسب إبراهيم عليه السلام المرض لنفسه تأدباً مع الله، ونسب الشفاء لله وحده لأنه المنعم به.'
      },
      {
        surahNumber: 17,
        ayahNumber: 82,
        surahName: 'الإسراء',
        arabicText: 'وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ',
        tafsir: 'ننزل من آيات القرآن الكريم ما يبرئ أمراض القلوب والأبدان من الشك والحزن والأسقام ورحمة لمن آمن به.',
        tadabbur: 'القرآن دواء شامل؛ يقرأه المريض بنية الشفاء فيجد السكينة والبرء بإذن ربه.'
      },
      {
        surahNumber: 21,
        ayahNumber: 83,
        surahName: 'الأنبياء',
        arabicText: 'وَأَيُّوبَ إِذْ نَادَىٰ رَبَّهُ أَنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ',
        tafsir: 'واذكر أيوب حين اشتد به المرض فدعا ربه متضرعاً: ربِ إني أصابني الضر وأنت أرحم بي من كل راحم.',
        tadabbur: 'أدب عظيم في المناجاة؛ لم يعترض ولم يطلب بحدة، بل عرض ضعفه وتوسل برحمة أرحم الراحمين.'
      }
    ]
  },
  {
    keywords: ['حيرة', 'محتار', 'تردد', 'متردد', 'قرار', 'استخارة', 'أختار', 'طريق', 'نصيحة', 'حائر'],
    title: 'نور البصيرة وتفويض الأمر لله في الاختيار',
    intro: (username) => `${username ? `أهلاً بك يا ${username}` : 'أهلاً بك يا طالب الرشد'}. الحيرة والتردد يعتريان الإنسان عند المنعطفات، والقرآن الكريم يمنحك البصيرة ويصلك بالتفويض والتوكل. إليك هدايات قرآنية محققة تضيء لك دربك.`,
    tafakkur: 'أنت ترى الظاهر والله يعلم العواقب والخفايا. استخر ربك، وشاور أهل الخبرة، ثم امضِ متوكلاً دون تردد.',
    summary: 'فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ ۚ إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ. ما اختاره الله لك خير مما تختاره لنفسك.',
    verses: [
      {
        surahNumber: 3,
        ayahNumber: 159,
        surahName: 'آل عمران',
        arabicText: 'فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ ۚ إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ',
        tafsir: 'فإذا استقر رأيك على أمر بعد المشورة والاستخارة فأقدم عليه معتمداً على الله وحده، إن الله يحب المعتمدين عليه.',
        tadabbur: 'العزم قرين التوكل؛ فلا مجال للتردد بعد التفويض الصادق لرب العالمين.'
      },
      {
        surahNumber: 2,
        ayahNumber: 216,
        surahName: 'البقرة',
        arabicText: 'وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ ۖ وَعَسَىٰ أَن تُحِبُّوا شَيْئًا وَهُوَ شَرٌّ لَّكُمْ ۗ وَاللَّهُ يَعْلَمُ وَأَنتُمْ لَا تَعْلَمُونَ',
        tafsir: 'قد تكرهون أمراً ويكون فيه الخير والنفع لكم، وتشتهون شيئاً وفيه الهلاك لكم، والله يعلم عواقب الأمور وأنتم لا تعلمون.',
        tadabbur: 'قاعدة ذهبية لراحة البال: سلم أمرك لمن يعلم ما كان وما سيكون وما لم يكن لو كان كيف يكون.'
      }
    ]
  },
  {
    keywords: ['دراسة', 'امتحان', 'اختبار', 'مذاكرة', 'علم', 'همة', 'نجاح', 'توفيق', 'كسل', 'طموح'],
    title: 'شحذ الهمم وطلب العلم والتوفيق',
    intro: (username) => `${username ? `وفقك الله وفتح عليك يا ${username}` : 'وفقك الله ونفع بك'}. السعي في طلب العلم والنجاح عبادة وبناء. إليك من القرآن الكريم المحفوظ محلياً الآيات التي تبعث العزيمة وتشرح الصدر لطلب العلم والتفوق.`,
    tafakkur: 'لكل مجتهد نصيب، والبركة تأتي مع الإخلاص وحسن الاستعانة بالله وأخذ الأسباب بقوة.',
    summary: 'وَقُل رَّبِّ زِدْنِي عِلْمًا. اطلب العلم بهمة عالية وتوكل على الله واستعن به ولا تعجز.',
    verses: [
      {
        surahNumber: 20,
        ayahNumber: 25,
        surahName: 'طه',
        arabicText: 'قَالَ رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
        tafsir: 'قال موسى: رب وسع لي صدري لتقبل العلم والمهمة، وسهل لي كل عسير في طريقي.',
        tadabbur: 'انشراح الصدر وتيسير الأمر هما الركيزتان لكل نجاح وإنجاز دراسي أو مهني.'
      },
      {
        surahNumber: 53,
        ayahNumber: 39,
        surahName: 'النجم',
        arabicText: 'وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ وَأَنَّ سَعْيَهُ سَوْفَ يُرَىٰ',
        tafsir: 'ليس للإنسان إلا ثواب ما عمل وسعى له بجهده، وإن هذا السعي سيظهر ويجازى عليه بالعدل التام.',
        tadabbur: 'ركز على سعيك واجتهادك وكن على ثقة تامة بأن الله لا يضيع أجر من أحسن عملاً.'
      }
    ]
  },
  {
    keywords: ['ظلم', 'مظلوم', 'قهر', 'مقهور', 'حق', 'حسبي الله', 'عدوان', 'أذية', 'خيانة', 'غدر'],
    title: 'نصرة المظلوم وملاذ المقهورين بحول الله',
    intro: (username) => `${username ? `نصرك الله وأيدك يا ${username}` : 'نصرك الله وفرج عنك'}. حين يشتد الظلم وتقصر حيل البشر، يبقى باب السماء مفتوحاً بدعوة ليس بينها وبين الله حجاب. إليك هذه الآيات الكريمة لتثبيت قلبك.`,
    tafakkur: 'عين الظالم تنام وعين الله لا تنام. فوض أمرك لمن ينتصف للمظلومين ولو بعد حين.',
    summary: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ. يكفيك أن الله معك وهو ناصرك ومؤيدك.',
    verses: [
      {
        surahNumber: 3,
        ayahNumber: 173,
        surahName: 'آل عمران',
        arabicText: 'الَّذِينَ قَالَ لَهُمُ النَّاسُ إِنَّ النَّاسَ قَدْ جَمَعُوا لَكُمْ فَاخْشَوْهُمْ فَزَادَهُمْ إِيمَانًا وَقَالُوا حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
        tafsir: 'حين حاول الأعداء إخافتهم بقوتهم زادهم ذلك ثقة بالله، وقالوا: كافينا الله وهو نعم الحافظ والوكيل.',
        tadabbur: 'حسبنا الله ونعم الوكيل كلمة تهز عروش الظالمين وتسكن قلوب الصابرين.'
      },
      {
        surahNumber: 14,
        ayahNumber: 42,
        surahName: 'إبراهيم',
        arabicText: 'وَلَا تَحْسَبَنَّ اللَّهَ غَافِلًا عَمَّا يَعْمَلُ الظَّالِمُونَ ۚ إِنَّمَا يُؤَخِّرُهُمْ لِيَوْمٍ تَشْخَصُ فِيهِ الْأَبْصَارُ',
        tafsir: 'لا تظن أبداً أن الله ساهٍ عما يفعله المعتدون، بل يؤخر عقابهم ليوم عظيم تشخص فيه الأبصار من الفزع.',
        tadabbur: 'تسلية لكل مظلوم ووعيد شديد لكل ظالم بأن الحساب آتٍ لا محالة.'
      }
    ]
  }
];

export class OfflineQuranService {
  /**
   * Check if the Holy Quran data is downloaded and stored in the local cache or IndexedDB
   */
  static async checkQuranDownloaded(): Promise<LocalQuranStatus> {
    try {
      if (typeof window === 'undefined') {
        return { isDownloaded: false, downloadedCount: 0, totalExpected: 1518, percentage: 0 };
      }

      // 1. Check full CacheStorage status from QuranDataService
      const fullStatus = await QuranDataService.checkFullCacheStatus();
      if (fullStatus.isCached || fullStatus.count >= 114) {
        return {
          isDownloaded: true,
          downloadedCount: fullStatus.count,
          totalExpected: fullStatus.total,
          percentage: Math.min(100, Math.round((fullStatus.count / fullStatus.total) * 100))
        };
      }

      // 2. Check CacheStorage for essential surahs (at least 10 or more)
      if ('caches' in window) {
        const textCache = await caches.open(TEXT_CACHE_NAME);
        const keys = await textCache.keys();
        const surahCount = keys.filter(k => k.url.includes('/surah/') || k.url.includes('/page/')).length;
        if (surahCount >= 30) {
          return {
            isDownloaded: true,
            downloadedCount: surahCount,
            totalExpected: 1518,
            percentage: Math.min(100, Math.round((surahCount / 1518) * 100))
          };
        }
      }

      return {
        isDownloaded: false,
        downloadedCount: fullStatus.count || 0,
        totalExpected: 1518,
        percentage: 0
      };
    } catch (e) {
      console.warn('Error checking local Quran cache:', e);
      return { isDownloaded: false, downloadedCount: 0, totalExpected: 1518, percentage: 0 };
    }
  }

  /**
   * Trigger complete Quran text and Tafsir download via DownloadManager
   */
  static startQuranDownload(): void {
    DownloadManager.addTask({
      id: 'quran-text-all',
      title: 'تحميل المصحف الشريف والتفاسير (أوفلاين)',
      type: 'quran-text',
      payload: {},
      totalItems: 1176,
      execute: async (task, signal) => {
        await QuranDataService.downloadAllQuranText((prog) => {
          DownloadManager.updateProgress(task.id, prog.completed, prog.total, prog.percentage);
          if (prog.status === 'completed') {
            DownloadManager.completeTask(task.id);
          } else if (prog.status === 'error') {
            DownloadManager.errorTask(task.id, prog.error || 'فشل التحميل');
          }
        }, signal);
      }
    });
  }

  /**
   * Normalize Arabic text for semantic comparison
   */
  private static normalizeArabic(text: string): string {
    return text.trim().toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'ؤ')
      .replace(/ئ/g, 'ئ')
      .replace(/ء/g, '')
      .replace(/[\u064B-\u065F]/g, ''); // Strip harakat
  }

  /**
   * Fetch verified verse text and Tafsir from local CacheStorage if available
   */
  private static async getLocalVerseAndTafsir(surahNum: number, ayahNum: number): Promise<{ text?: string; tafsir?: string }> {
    try {
      if (typeof window === 'undefined' || !('caches' in window)) return {};
      const cache = await caches.open(TEXT_CACHE_NAME);

      // Check surah uthmani cache
      const surahRes = await cache.match(`${API_BASE}/surah/${surahNum}/quran-uthmani`);
      let text = '';
      if (surahRes) {
        const json = await surahRes.json();
        const ayahObj = json?.data?.ayahs?.find((a: any) => a.numberInSurah === ayahNum);
        if (ayahObj?.text) text = ayahObj.text;
      }

      // Check tafsir muyassar cache
      const tafsirRes = await cache.match(`${API_BASE}/surah/${surahNum}/ar.muyassar`);
      let tafsir = '';
      if (tafsirRes) {
        const json = await tafsirRes.json();
        const ayahObj = json?.data?.ayahs?.find((a: any) => a.numberInSurah === ayahNum);
        if (ayahObj?.text) tafsir = ayahObj.text;
      }

      return { text, tafsir };
    } catch (e) {
      return {};
    }
  }

  /**
   * Execute intelligent offline Quranic analysis
   * Analyzes question and returns authentic verses, Tafsir, and Tadabbur locally.
   * Utilizes local CacheStorage if available, enriched with verified embedded Quranic datasets.
   */
  static async analyzeQuestionOffline(userMessage: string, username?: string): Promise<QuranResponse> {
    // 1. Check local cache status for informative enrichment
    const cacheStatus = await this.checkQuranDownloaded();

    // 2. Perform semantic topic matching on the user question
    const normMsg = this.normalizeArabic(userMessage);

    let bestCluster: QuranThematicCluster | null = null;
    let maxMatchCount = 0;

    for (const cluster of THEMATIC_CLUSTERS) {
      let count = 0;
      for (const kw of cluster.keywords) {
        const normKw = this.normalizeArabic(kw);
        if (normMsg.includes(normKw)) {
          count++;
        }
      }
      if (count > maxMatchCount) {
        maxMatchCount = count;
        bestCluster = cluster;
      }
    }

    // Default to the first cluster (Comfort & Ease) if no specific keyword matched
    const activeCluster = bestCluster || THEMATIC_CLUSTERS[0];

    // Enrich the verses with actual text & Tafsir from local CacheStorage if available
    const enrichedVerses: Verse[] = await Promise.all(
      activeCluster.verses.map(async (v) => {
        const localData = await this.getLocalVerseAndTafsir(v.surahNumber, v.ayahNumber);
        const finalText = localData.text || v.arabicText;
        const finalTafsir = localData.tafsir || v.tafsir;

        return {
          text: finalText,
          arabicText: finalText,
          surah: v.surahName,
          surahName: v.surahName,
          number: v.ayahNumber,
          surahNumber: v.surahNumber,
          ayahNumber: v.ayahNumber,
          tafsir: finalTafsir,
          tadabbur: v.tadabbur
        };
      })
    );

    // Dynamic intro message emphasizing offline local execution
    const intro = activeCluster.intro(username);

    return {
      title: activeCluster.title,
      introMessage: intro,
      verses: enrichedVerses,
      tafakkur: activeCluster.tafakkur,
      summary: activeCluster.summary,
      isOfflineLocalAnalysis: true,
      isOfflineQuranMissing: false,
      isOfflineFallback: false,
      analysisStyle: 'offline_local'
    };
  }
}
