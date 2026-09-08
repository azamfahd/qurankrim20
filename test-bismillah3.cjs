const text = "بِّسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ وَٱلتِّينِ وَٱلزَّيْتُونِ";
const bismillahRegex = /^ب\p{M}*س\p{M}*م\p{M}*\s+[ٱا]\p{M}*ل\p{M}*ل\p{M}*ه\p{M}*\s+[ٱا]\p{M}*ل\p{M}*ر\p{M}*ح\p{M}*م\p{M}*ٰ?\p{M}*ن\p{M}*\s+[ٱا]\p{M}*ل\p{M}*ر\p{M}*ح\p{M}*ي\p{M}*م\p{M}*\s*/u;
console.log(text.replace(bismillahRegex, ''));

const text2 = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ الم";
console.log(text2.replace(bismillahRegex, ''));
