import React, { useState, useMemo } from 'react';
import { X, History, MessageSquare, Trash2, ChevronLeft, Calendar, Search, Sparkles, AlertCircle } from 'lucide-react';
import { ChatSession } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
}

const toArabicNumbers = (str: string): string => {
  const map: Record<string, string> = {
    '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
    '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
  };
  return str.replace(/[0-9]/g, w => map[w] || w);
};

const normalizeText = (text: string): string => {
  if (!text) return '';
  let normalized = text.toLowerCase();
  // Remove Arabic diacritics (Tashkeel)
  normalized = normalized.replace(/[\u064B-\u065F]/g, "");
  // Normalize Alef shapes
  normalized = normalized.replace(/[أإآا]/g, "ا");
  // Normalize Taa Marbutah
  normalized = normalized.replace(/ة/g, "ه");
  // Normalize Yaa shapes
  normalized = normalized.replace(/[ىي]/g, "ي");
  return normalized;
};

const getNormalizedMapping = (text: string): { normalized: string; map: number[] } => {
  let normalized = '';
  const map: number[] = [];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isDiacritic = /[\u064B-\u065F]/.test(char);
    if (isDiacritic) {
      continue;
    }
    
    let normalizedChar = char.toLowerCase();
    if (/[أإآا]/.test(normalizedChar)) {
      normalizedChar = 'ا';
    } else if (normalizedChar === 'ة') {
      normalizedChar = 'ه';
    } else if (/[ىي]/.test(normalizedChar)) {
      normalizedChar = 'ي';
    }
    
    normalized += normalizedChar;
    map.push(i);
  }
  
  return { normalized, map };
};

const highlightText = (text: string, query: string): React.ReactNode => {
  if (!query.trim() || !text) return text;
  
  const { normalized: normalizedText, map } = getNormalizedMapping(text);
  const normalizedQuery = normalizeText(query);
  
  if (!normalizedQuery || !normalizedText.includes(normalizedQuery)) {
    return text;
  }
  
  const queryLen = normalizedQuery.length;
  const elements: React.ReactNode[] = [];
  let currentIndex = 0;
  let textIndex = 0;
  
  while (currentIndex < normalizedText.length) {
    const remainingNormalized = normalizedText.slice(currentIndex);
    const matchIndex = remainingNormalized.indexOf(normalizedQuery);
    
    if (matchIndex === -1) {
      elements.push(text.slice(textIndex));
      break;
    }
    
    const matchStartInNormalized = currentIndex + matchIndex;
    const matchEndInNormalized = matchStartInNormalized + queryLen;
    
    const origStart = map[matchStartInNormalized];
    const origEnd = matchEndInNormalized < map.length ? map[matchEndInNormalized] : text.length;
    
    if (origStart > textIndex) {
      elements.push(text.slice(textIndex, origStart));
    }
    
    elements.push(
      <mark key={origStart} className="bg-amber-100 text-[#043d2e] rounded px-1 font-bold border-b border-amber-300">
        {text.slice(origStart, origEnd)}
      </mark>
    );
    
    currentIndex = matchEndInNormalized;
    textIndex = origEnd;
  }
  
  return <>{elements}</>;
};

interface MessageSnippet {
  text: string;
  role: 'user' | 'assistant';
}

const getMessageSnippet = (messages: any[], query: string): MessageSnippet | null => {
  if (!query.trim() || !messages || messages.length === 0) return null;
  
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return null;
  
  for (const msg of messages) {
    const content = msg.content || '';
    const { normalized: normalizedContent, map } = getNormalizedMapping(content);
    
    const matchIndex = normalizedContent.indexOf(normalizedQuery);
    if (matchIndex !== -1) {
      const origStart = map[matchIndex];
      
      const startPos = Math.max(0, origStart - 45);
      const endPos = Math.min(content.length, origStart + normalizedQuery.length + 55);
      
      let snippet = content.slice(startPos, endPos);
      if (startPos > 0) {
        snippet = '...' + snippet;
      }
      if (endPos < content.length) {
        snippet = snippet + '...';
      }
      
      return {
        text: snippet,
        role: msg.role || 'user'
      };
    }
  }
  
  return null;
};

export const HistoryModal: React.FC<HistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  sessions, 
  onSelectSession, 
  onDeleteSession,
  onClearAll
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const formatDate = (timestamp: number | string | undefined) => {
    if (!timestamp) return '';
    try {
      const dateVal = new Date(typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp);
      const formatted = new Intl.DateTimeFormat('ar-SA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(dateVal);
      return toArabicNumbers(formatted);
    } catch (e) {
      return '';
    }
  };

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return sessions;
    
    const normalizedQuery = normalizeText(q);
    if (!normalizedQuery) return sessions;

    return sessions.filter(session => {
      const title = normalizeText(session.title || session.preview || '');
      const messagesText = session.messages?.map(m => normalizeText(m.content || '')).join(' ') || '';
      return title.includes(normalizedQuery) || messagesText.includes(normalizedQuery);
    });
  }, [sessions, searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-backdrop flex items-center justify-center p-4 z-50 overflow-hidden" 
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
            className="bg-[#fcfaf4] w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-[#f0ebd8]" 
            onClick={e => e.stopPropagation()}
          >
            {/* Header with Islamic Geometric Subtle Decoration */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#033125] to-[#054b39] p-6 text-white shrink-0 shadow-md">
              {/* Decorative radial glows */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-[#d4af37] border border-white/15 shadow-inner">
                    <History size={22} className="animate-pulse-subtle" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                      سجل المحادثات
                      <span className="text-[10px] bg-[#d4af37]/20 border border-[#d4af37]/30 text-[#f1e5ac] px-2 py-0.5 rounded-full font-bold">
                        {toArabicNumbers(sessions.length.toString())} {sessions.length === 1 ? 'محادثة' : sessions.length >= 3 && sessions.length <= 10 ? 'محادثات' : 'محادثة'}
                      </span>
                    </h2>
                    <p className="text-xs text-[#f1e5ac]/70 mt-0.5 font-medium">استعرض وتأمّل نقاشاتك السابقة وتدبراتك في كتاب الله</p>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/15 text-white/80 hover:text-white rounded-full transition-all border border-white/10 shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Search Bar Block */}
            {sessions.length > 0 && (
              <div className="px-6 py-3.5 bg-white border-b border-[#f0ebd8] shrink-0 flex items-center gap-2.5">
                <div className="relative flex-1">
                  <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث في عناوين ونصوص المحادثات السابقة..."
                    className="w-full pl-10 pr-9 py-2 bg-slate-50/50 border border-slate-200 focus:border-[#043d2e] focus:bg-white rounded-xl text-sm text-[var(--color-text)] placeholder-gray-400 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 px-1"
                    >
                      مسح
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Scrollable list content */}
            <div className="p-6 overflow-y-auto space-y-3.5 flex-1 custom-scrollbar bg-slate-50/30">
              {sessions.length === 0 ? (
                <div className="text-center py-16 text-text-muted space-y-4">
                  <div className="w-20 h-20 bg-[#043d2e]/5 border border-[#043d2e]/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <History size={32} className="opacity-30 text-[#043d2e]" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-700">سجل المحادثات فارغ</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">ابدأ حوارًا أو تدبر ديني مع المساعد القرآني وسوف يتم حفظه هنا تلقائيًا.</p>
                  </div>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-16 text-text-muted space-y-3">
                  <div className="w-14 h-14 bg-amber-500/5 border border-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle size={24} className="text-amber-500 opacity-80" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700">لم يتم العثور على نتائج تطابق "{searchQuery}"</p>
                    <p className="text-xs text-gray-400 mt-1">تأكد من كتابة الكلمات المفتاحية بشكل صحيح أو امسح البحث.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSessions.map((session, index) => {
                    const messageCount = session.messages?.length || 0;
                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.04, 0.4) }}
                        className="group relative bg-white hover:bg-gradient-to-l hover:from-[#043d2e]/[0.02] hover:to-white border border-[#f0ebd8] hover:border-[#043d2e]/30 rounded-2xl p-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-[0_4px_20px_rgba(4,61,46,0.05)] flex items-center gap-4.5"
                        onClick={() => {
                          onSelectSession(session);
                          onClose();
                        }}
                      >
                        {/* Interactive glow border lines */}
                        <div className="absolute top-0 right-0 h-full w-1 rounded-l-2xl bg-transparent group-hover:bg-[#d4af37] transition-all duration-300"></div>

                        <div className="w-12 h-12 bg-[#043d2e]/5 group-hover:bg-[#043d2e]/10 border border-[#043d2e]/10 rounded-2xl flex items-center justify-center text-[#043d2e] shrink-0 shadow-inner relative transition-colors duration-300">
                          <MessageSquare size={20} className="group-hover:scale-105 transition-transform duration-300" />
                          {/* Inner tiny count badge */}
                          <span className="absolute -top-1.5 -left-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-[#043d2e] text-[#f1e5ac] text-[10px] font-black border border-white flex items-center justify-center shadow-sm">
                            {toArabicNumbers(messageCount.toString())}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-gray-800 mb-1 leading-relaxed line-clamp-2 group-hover:text-[#043d2e] transition-colors duration-300">
                            {highlightText(session.title || session.preview || "حوار وتأمل قرآني", searchQuery)}
                          </h4>
                          
                          {/* Intelligent matched snippet preview if query is entered */}
                          {searchQuery && getMessageSnippet(session.messages || [], searchQuery) && (
                            <div className="mt-1.5 p-2 bg-emerald-50/40 hover:bg-emerald-50/60 border border-emerald-100/50 rounded-xl text-[11px] text-gray-650 font-medium leading-normal transition-colors">
                              <span className="text-[#043d2e] font-bold">
                                {getMessageSnippet(session.messages || [], searchQuery)?.role === 'user' ? 'سؤالك: ' : 'المساعد: '}
                              </span>
                              <span className="text-gray-700">
                                {highlightText(getMessageSnippet(session.messages || [], searchQuery)?.text || '', searchQuery)}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-[11px] text-gray-500 font-bold flex-wrap mt-2">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-[#d4af37]" />
                              {formatDate(session.date)}
                            </span>
                            <span className="opacity-30">•</span>
                            <span className="text-[#043d2e] bg-[#043d2e]/5 px-2 py-0.5 rounded font-bold text-[10px]">
                              {messageCount === 1 ? 'سؤال واحد' : messageCount === 2 ? 'سؤال وجواب' : `${toArabicNumbers(messageCount.toString())} ردود`}
                            </span>
                            {searchQuery && (
                              <>
                                <span className="opacity-30">•</span>
                                <span className="text-[#d4af37] bg-[#d4af37]/5 border border-[#d4af37]/15 px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1">
                                  <Sparkles size={10} />
                                  {normalizeText(session.title || session.preview || '').includes(normalizeText(searchQuery)) ? 'تطابق في العنوان' : 'تطابق في الرسائل'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 transition-all">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id, e);
                            }}
                            className="p-2 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all shadow-sm group-hover:opacity-100 opacity-60 md:opacity-0 focus:opacity-100 border border-transparent hover:border-red-100"
                            title="حذف الجلسة"
                          >
                            <Trash2 size={16} />
                          </button>
                          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-[#043d2e] group-hover:bg-white group-hover:border-[#043d2e]/20 flex items-center justify-center transition-all">
                            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform duration-300 mt-0.5" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer with elegant controls & brand */}
            <div className="p-4 border-t border-[#f0ebd8] bg-white flex justify-between items-center shrink-0">
              <span className="text-[10px] text-gray-400 font-black tracking-wider flex items-center gap-1">
                <Sparkles size={11} className="text-[#d4af37]" />
                يتم حفظ كل الحوارات والتأملات محلياً بمتصفحك بشكل آمن
              </span>
              {sessions.length > 0 && (
                <button 
                  onClick={() => {
                    if (window.confirm("هل أنت متأكد من رغبتك في حذف جميع المحادثات السابقة؟ لا يمكن التراجع عن هذا الإجراء.")) {
                      onClearAll();
                    }
                  }}
                  className="text-xs font-black text-red-500 hover:text-red-650 hover:bg-red-50/50 border border-transparent hover:border-red-100 px-3.5 py-1.5 rounded-xl transition-all"
                >
                  مسح السجل بالكامل
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
