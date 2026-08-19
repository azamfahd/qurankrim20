export interface LevelTheme {
  level: number;
  title: string;
  subtitle: string;
  badgeTitle: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentGradient: string;
  glowTopRight: string;
  glowBottomLeft: string;
  cardBg: string;
  cardBorder: string;
  cardBorderHover: string;
  cardGlow: string;
  stageBadgeBg: string;
  stageBadgeText: string;
  stageBadgeBorder: string;
  startButtonBg: string;
  startButtonHover: string;
  iconBg: string;
  questionCardBg: string;
  questionCardBorder: string;
  mapHeaderBg: string;
  mapHeaderBorder: string;
  progressBarColor: string;
  levelIcon: string;
  themeBannerTag: string;
  themeGlowRing: string;
}

export function getLevelTheme(level: number = 1): LevelTheme {
  if (level === 1) {
    return {
      level: 1,
      title: "المستوى 1: فجر العلوم القرآنية 🌱",
      subtitle: "بداية إيمانية مباركة مع أساسيات السور وأركان الدين وألغاز الأنبياء",
      badgeTitle: "فجر الفروسية 🌱",
      badgeBg: "bg-emerald-500/20",
      badgeText: "text-emerald-300",
      badgeBorder: "border-emerald-500/40",
      accentGradient: "from-emerald-400 via-teal-300 to-amber-300",
      glowTopRight: "bg-emerald-600/20",
      glowBottomLeft: "bg-teal-600/20",
      cardBg: "bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-emerald-950/60",
      cardBorder: "border-emerald-500/35",
      cardBorderHover: "hover:border-emerald-400",
      cardGlow: "hover:shadow-emerald-500/15",
      stageBadgeBg: "bg-emerald-950/80",
      stageBadgeText: "text-emerald-400",
      stageBadgeBorder: "border-emerald-500/40",
      startButtonBg: "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
      startButtonHover: "hover:bg-emerald-400",
      iconBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      questionCardBg: "bg-gradient-to-b from-slate-800/95 via-slate-800/90 to-emerald-950/70",
      questionCardBorder: "border-emerald-500/40",
      mapHeaderBg: "bg-gradient-to-r from-emerald-950/70 via-teal-900/50 to-slate-900/90",
      mapHeaderBorder: "border-emerald-500/40",
      progressBarColor: "from-emerald-500 to-teal-300",
      levelIcon: "🌱",
      themeBannerTag: "وسام الزمرد الأخضر 💚",
      themeGlowRing: "ring-emerald-500/30"
    };
  } else if (level === 2) {
    return {
      level: 2,
      title: "المستوى 2: وسام الياقوت الأزرق السماوي 💎",
      subtitle: "تحدي فرسان القرآن المتقدم في أسرار الآيات والرموز والمعجزات المتقاربة",
      badgeTitle: "فارس الياقوت الأزرق 💎",
      badgeBg: "bg-cyan-500/20",
      badgeText: "text-cyan-300",
      badgeBorder: "border-cyan-500/40",
      accentGradient: "from-cyan-300 via-blue-400 to-amber-300",
      glowTopRight: "bg-cyan-600/25",
      glowBottomLeft: "bg-blue-600/25",
      cardBg: "bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-blue-950/70",
      cardBorder: "border-cyan-500/40",
      cardBorderHover: "hover:border-cyan-300",
      cardGlow: "hover:shadow-cyan-500/20",
      stageBadgeBg: "bg-cyan-950/80",
      stageBadgeText: "text-cyan-300",
      stageBadgeBorder: "border-cyan-500/40",
      startButtonBg: "bg-cyan-500 hover:bg-cyan-400 text-slate-950",
      startButtonHover: "hover:bg-cyan-400",
      iconBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      questionCardBg: "bg-gradient-to-b from-slate-800/95 via-slate-800/90 to-blue-950/80",
      questionCardBorder: "border-cyan-500/50",
      mapHeaderBg: "bg-gradient-to-r from-cyan-950/80 via-blue-950/70 to-slate-900/90",
      mapHeaderBorder: "border-cyan-500/50",
      progressBarColor: "from-cyan-400 to-blue-500",
      levelIcon: "💎",
      themeBannerTag: "وسام الأزرق السماوي 💙",
      themeGlowRing: "ring-cyan-500/40"
    };
  } else if (level === 3) {
    return {
      level: 3,
      title: "المستوى 3: صرح الأرجوان الملكي 🔮",
      subtitle: "تحديات حصرية في أسرار البلاغة ولطائف التفسير والبدائع الفقهية المتقدمة",
      badgeTitle: "الحكيم الأرجواني الملكي 🔮",
      badgeBg: "bg-purple-500/20",
      badgeText: "text-purple-300",
      badgeBorder: "border-purple-500/40",
      accentGradient: "from-purple-300 via-fuchsia-400 to-amber-300",
      glowTopRight: "bg-purple-600/30",
      glowBottomLeft: "bg-fuchsia-600/25",
      cardBg: "bg-gradient-to-br from-slate-800/95 via-purple-950/50 to-slate-900",
      cardBorder: "border-purple-500/45",
      cardBorderHover: "hover:border-purple-300",
      cardGlow: "hover:shadow-purple-500/25",
      stageBadgeBg: "bg-purple-950/80",
      stageBadgeText: "text-purple-300",
      stageBadgeBorder: "border-purple-500/40",
      startButtonBg: "bg-purple-500 hover:bg-purple-400 text-slate-950",
      startButtonHover: "hover:bg-purple-400",
      iconBg: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      questionCardBg: "bg-gradient-to-b from-slate-800/95 via-slate-800/90 to-purple-950/80",
      questionCardBorder: "border-purple-500/50",
      mapHeaderBg: "bg-gradient-to-r from-purple-950/80 via-fuchsia-950/70 to-slate-900/90",
      mapHeaderBorder: "border-purple-500/50",
      progressBarColor: "from-purple-500 to-fuchsia-400",
      levelIcon: "🔮",
      themeBannerTag: "وسام الأرجوان الفاخر 💜",
      themeGlowRing: "ring-purple-500/40"
    };
  } else if (level === 4) {
    return {
      level: 4,
      title: "المستوى 4: التاج الياقوتي الفاخر 👑",
      subtitle: "تنافس النخبة والعلماء في دقائق التفسير وأسباب النزول ومقاصد الشريعة",
      badgeTitle: "العالم الياقوتي الإمبراطوري 👑",
      badgeBg: "bg-rose-500/20",
      badgeText: "text-rose-300",
      badgeBorder: "border-rose-500/40",
      accentGradient: "from-rose-400 via-amber-300 to-yellow-300",
      glowTopRight: "bg-rose-600/30",
      glowBottomLeft: "bg-amber-600/25",
      cardBg: "bg-gradient-to-br from-slate-800/95 via-rose-950/50 to-slate-900",
      cardBorder: "border-rose-500/45",
      cardBorderHover: "hover:border-rose-300",
      cardGlow: "hover:shadow-rose-500/25",
      stageBadgeBg: "bg-rose-950/80",
      stageBadgeText: "text-rose-300",
      stageBadgeBorder: "border-rose-500/40",
      startButtonBg: "bg-rose-500 hover:bg-rose-400 text-slate-950",
      startButtonHover: "hover:bg-rose-400",
      iconBg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      questionCardBg: "bg-gradient-to-b from-slate-800/95 via-slate-800/90 to-rose-950/80",
      questionCardBorder: "border-rose-500/50",
      mapHeaderBg: "bg-gradient-to-r from-rose-950/80 via-red-950/70 to-slate-900/90",
      mapHeaderBorder: "border-rose-500/50",
      progressBarColor: "from-rose-500 to-amber-400",
      levelIcon: "👑",
      themeBannerTag: "وسام التاج الياقوتي ❤️",
      themeGlowRing: "ring-rose-500/40"
    };
  } else {
    // Level 5 and beyond
    return {
      level: level,
      title: `المستوى ${level}: العرش الماسي الكوني 🌌`,
      subtitle: "قمة الإعجاز والتدبر القرآني - مستوى النخبة وعمداء العلم القرآني",
      badgeTitle: `عميد القراء والعلماء (مستوى ${level}) 🌌`,
      badgeBg: "bg-gradient-to-r from-amber-500/30 via-purple-500/30 to-cyan-500/30",
      badgeText: "text-amber-200",
      badgeBorder: "border-amber-400/50",
      accentGradient: "from-amber-300 via-yellow-200 via-purple-300 to-cyan-300",
      glowTopRight: "bg-amber-500/35",
      glowBottomLeft: "bg-purple-600/35",
      cardBg: "bg-gradient-to-br from-slate-900/95 via-purple-950/70 to-amber-950/50",
      cardBorder: "border-amber-400/60",
      cardBorderHover: "hover:border-yellow-200",
      cardGlow: "hover:shadow-amber-500/30",
      stageBadgeBg: "bg-gradient-to-r from-amber-950/90 to-purple-950/90",
      stageBadgeText: "text-amber-300",
      stageBadgeBorder: "border-amber-400/50",
      startButtonBg: "bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black",
      startButtonHover: "hover:from-amber-300 hover:to-yellow-200",
      iconBg: "bg-amber-500/20 text-amber-300 border-amber-400/40",
      questionCardBg: "bg-gradient-to-b from-slate-900/95 via-purple-950/85 to-amber-950/60",
      questionCardBorder: "border-amber-400/60",
      mapHeaderBg: "bg-gradient-to-r from-purple-950/80 via-amber-950/70 to-slate-900/90",
      mapHeaderBorder: "border-amber-400/60",
      progressBarColor: "from-amber-400 via-purple-400 to-cyan-400",
      levelIcon: "🌌",
      themeBannerTag: "وسام العرش الماسي 💛",
      themeGlowRing: "ring-amber-400/50"
    };
  }
}
