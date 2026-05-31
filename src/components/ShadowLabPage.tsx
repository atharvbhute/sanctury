import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';
import { useMediaPlayer } from '../MediaPlayerContext';
import { 
  Play, 
  Pause, 
  Flame, 
  Sparkles, 
  Wind, 
  Activity, 
  Heart, 
  Brain, 
  Save, 
  History, 
  Clock, 
  Search, 
  Pencil, 
  CheckCircle,
  Music
} from 'lucide-react';

interface Entry {
  id: string;
  title: string;
  textContent: string;
  stateBefore?: string;
  stateAfter?: string;
  createdAt: any;
  updatedAt?: any;
}

const SHADOW_AUDIOS = [
  {
    title: "Belly or Dan Tian Breathing",
    url: "https://pub-4175063e065d455e8dfeafa58c6df57b.r2.dev/drive-download-20260528T080122Z-3-001/Belly_Or_Dan_Tian_Breathing.mp3",
    icon: "Wind",
    duration: "Somatic Breathwork",
    tag: "Breathwork"
  },
  {
    title: "Body Scan Meditation",
    url: "https://pub-4175063e065d455e8dfeafa58c6df57b.r2.dev/drive-download-20260528T080122Z-3-001/Body_Scan_Anapana_Vipassana_Meditation.mp3",
    icon: "Activity",
    duration: "Vipassana Somatic",
    tag: "Meditation"
  },
  {
    title: "Inner Child Release",
    url: "https://pub-4175063e065d455e8dfeafa58c6df57b.r2.dev/drive-download-20260528T080122Z-3-001/Inner_Child_Shadow_Self_Release_Meditation.mp3",
    icon: "Heart",
    duration: "Shadow Self Integration",
    tag: "Shadow Self"
  },
  {
    title: "Inner Critic Release",
    url: "https://pub-4175063e065d455e8dfeafa58c6df57b.r2.dev/drive-download-20260528T080122Z-3-001/Inner_Critic_Shadow_Self_Release.mp3",
    icon: "Brain",
    duration: "Mind & Body Mastery",
    tag: "Shadow Self"
  },
  {
    title: "5-Step Shadow Mastery I",
    url: "https://pub-4175063e065d455e8dfeafa58c6df57b.r2.dev/drive-download-20260528T080122Z-3-001/The_5_Step_Shadow_Mastery_Self_Inquiry.mp3",
    icon: "Sunset",
    duration: "Self-Inquiry Protocol",
    tag: "Inquiry"
  },
  {
    title: "5-Step Shadow Mastery II",
    url: "https://pub-4175063e065d455e8dfeafa58c6df57b.r2.dev/drive-download-20260528T080122Z-3-001/The_5_Step_Shadow_Mastery_Self_Inquiry2.mp3",
    icon: "Sunset",
    duration: "Self-Inquiry Advanced",
    tag: "Inquiry"
  },
  {
    title: "5-Step Shadow Mastery III",
    url: "https://pub-4175063e065d455e8dfeafa58c6df57b.r2.dev/drive-download-20260528T080122Z-3-001/The_5_Step_Shadow_Mastery_Self_Inquiry_1731999298977.mp3",
    icon: "Sunset",
    duration: "Self-Inquiry Recalibration",
    tag: "Inquiry"
  },
  {
    title: "Emotional Awareness Scan",
    url: "https://pub-4175063e065d455e8dfeafa58c6df57b.r2.dev/somatic%20body%20%26%20breathwork/Body_Scan_Anapana_Vipassana_Meditation%20(2).mp3",
    icon: "Activity",
    duration: "Somatic Body Scan",
    tag: "Meditation"
  },
  {
    title: "Cleansing & Detox Breath",
    url: "https://pub-4175063e065d455e8dfeafa58c6df57b.r2.dev/somatic%20body%20%26%20breathwork/Cleansing_Or_Detoxifying_Breath.mp3",
    icon: "Wind",
    duration: "Neurobreath Detox",
    tag: "Breathwork"
  },
  {
    title: "Tree Visualization",
    url: "https://pub-4175063e065d455e8dfeafa58c6df57b.r2.dev/somatic%20body%20%26%20breathwork/Grounding_Technique_2__Tree_Visualisation.mp3",
    icon: "Flame",
    duration: "Deep Grounding Tech",
    tag: "Grounding"
  },
  {
    title: "5-4-3-2-1 Grounding",
    url: "https://pub-4175063e065d455e8dfeafa58c6df57b.r2.dev/somatic%20body%20%26%20breathwork/Grounding_Technique_5_4_3_2_1_Grounding_Exercise.mp3",
    icon: "Zap",
    duration: "5-Step Sensory Focus",
    tag: "Grounding"
  },
  {
    title: "Emotional Awareness Focus",
    url: "https://pub-4175063e065d455e8dfeafa58c6df57b.r2.dev/somatic%20body%20%26%20breathwork/Process_1__Body_Scan_For_Emotional_Awareness.mp3",
    icon: "Brain",
    duration: "Emotional Body Mapping",
    tag: "Somatic Mapping"
  },
  {
    title: "Grounding & Release",
    url: "https://pub-4175063e065d455e8dfeafa58c6df57b.r2.dev/somatic%20body%20%26%20breathwork/Process_2__Grounding_And_Release_Technique.mp3",
    icon: "Wind",
    duration: "Dynamic Somatic Release",
    tag: "Grounding"
  }
];

const IconMap: { [key: string]: any } = {
  Wind: Wind,
  Activity: Activity,
  Heart: Heart,
  Brain: Brain,
  Flame: Flame,
  Sunset: Sparkles,
  Sparkles: Sparkles
};

export const ShadowLabPage = ({ 
  onDirtyChange,
  onAuthTrigger,
  onOpenPlayer
}: { 
  onDirtyChange: (isDirty: boolean) => void;
  onAuthTrigger: () => void;
  onOpenPlayer: (trackName: string, trackUrl: string) => void;
}) => {
  const { userEmail, activeTheme } = useAuth();
  const { currentTrack, isPlaying } = useMediaPlayer();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [stateBefore, setStateBefore] = useState('');
  const [stateAfter, setStateAfter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Track unsaved changes
  useEffect(() => {
    const isDirty = title.trim() !== '' || text.trim() !== '' || stateBefore !== '' || stateAfter !== '';
    onDirtyChange(isDirty);
  }, [title, text, stateBefore, stateAfter, onDirtyChange]);

  const fetchJournals = async () => {
    if (!userEmail) {
      setEntries([]);
      return;
    }
    try {
      const token = localStorage.getItem('sanctuary-lms-token');
      if (!token) return;

      const res = await fetch('/api/journals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const resData = await res.json();
        setEntries(resData.data);
      }
    } catch (err) {
      console.error('Failed to fetch journals via API:', err);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, [userEmail]);

  const parseDate = (dateStr: string): Date | null => {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    
    // Try 'Jan 24'
    const parts = dateStr.split(' ');
    if (parts.length === 2) {
      const d2 = new Date(`${parts[0]} 1, ${parts[1]}`);
      if (!isNaN(d2.getTime())) return d2;
    }
    
    // Try '24-01' (assuming current year)
    const parts2 = dateStr.split('-');
    if (parts2.length === 2) {
      const d3 = new Date(`${parts2[1]}/01/${parts2[0]}`);
      if (!isNaN(d3.getTime())) return d3;
    }
    
    return null;
  };

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    
    const dateQuery = parseDate(query);
    
    return entries.filter(e => {
      const titleMatch = e.title?.toLowerCase().includes(query);
      const textMatch = e.textContent?.toLowerCase().includes(query);
      
      let dateMatch = false;
      if (dateQuery && e.createdAt) {
        const entryDate = new Date(e.createdAt);
        dateMatch = entryDate.toDateString() === dateQuery.toDateString();
      }
      
      return titleMatch || textMatch || dateMatch;
    });
  }, [entries, searchQuery]);

  const handleSave = async () => {
    if (!userEmail) {
      onAuthTrigger();
      return;
    }
    if (!text.trim() || !title.trim()) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('sanctuary-lms-token');
      if (!token) return;

      let res;
      if (editId) {
        res = await fetch(`/api/journals/${editId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            textContent: text,
            stateBefore,
            stateAfter
          })
        });
      } else {
        res = await fetch('/api/journals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            textContent: text,
            stateBefore,
            stateAfter
          })
        });
      }

      if (!res.ok) {
        throw new Error('Failed to save journal entry');
      }

      await fetchJournals();
      
      setTitle('');
      setText('');
      setStateBefore('');
      setStateAfter('');
      setEditId(null);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      console.error('Error saving journal entry:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (entry: Entry) => {
    if (!userEmail) {
      onAuthTrigger();
      return;
    }
    setEditId(entry.id);
    setTitle(entry.title || '');
    setText(entry.textContent || '');
    setStateBefore(entry.stateBefore || '');
    setStateAfter(entry.stateAfter || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-12 pb-20 relative">
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[250] bg-primary text-on-primary px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-label text-sm font-bold uppercase tracking-widest"
          >
            <CheckCircle size={20} />
            Saved Successfully
          </motion.div>
        )}
      </AnimatePresence>

      <section className="space-y-4">
        <div>
          <span className="font-label text-[10px] uppercase tracking-[0.3em] text-primary/60 mb-2 block">Shadow Lab</span>
          <h2 className="font-headline text-4xl text-on-surface font-light">Self-Inquiry</h2>
        </div>
        <p className="font-body text-sm text-on-surface-variant italic leading-relaxed max-w-md">
          "Observe the trigger without judgment. Note the shift in your body, the tightening of the chest, or the racing of the mind. This is your nervous system speaking."
        </p>
      </section>

      {/* Somatic Audio Guides Carousel */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-outline">
          <Music size={18} className="text-primary" />
          <h3 className="font-label text-xs uppercase tracking-[0.2em] font-semibold text-gray-700">Somatic Guides & Breathwork</h3>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none snap-x" style={{ WebkitOverflowScrolling: 'touch' }}>
          {SHADOW_AUDIOS.map((audio, index) => {
            const IconComponent = IconMap[audio.icon] || Music;
            const isPlayingThis = currentTrack === audio.title && isPlaying;
            
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenPlayer(audio.title, audio.url)}
                className="w-64 shrink-0 rounded-2xl border border-outline-variant/10 p-5 bg-white shadow-md hover:shadow-xl transition-all snap-start relative overflow-hidden flex flex-col justify-between h-44 cursor-pointer group"
              >
                {/* Glowing Overlay Hover Effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none"
                  style={{ backgroundColor: activeTheme.hex }}
                />
                
                <div className="flex justify-between items-start z-10">
                  <span 
                    className="text-[9px] font-label uppercase tracking-wider px-2.5 py-1 rounded-full border"
                    style={{ 
                      color: activeTheme.hex, 
                      borderColor: `${activeTheme.hex}22`,
                      backgroundColor: `${activeTheme.hex}08`
                    }}
                  >
                    {audio.tag}
                  </span>
                  
                  {/* Icon with Glowing background */}
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                    style={{ 
                      backgroundColor: isPlayingThis ? activeTheme.hex : `${activeTheme.hex}15`,
                      color: isPlayingThis ? '#fff' : activeTheme.hex,
                      boxShadow: isPlayingThis ? `0 0 15px ${activeTheme.hex}44` : undefined
                    }}
                  >
                    {isPlayingThis ? (
                      <Pause size={18} className="stroke-[2]" />
                    ) : (
                      <IconComponent size={18} className="stroke-[2]" />
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 z-10">
                  <h4 className="font-headline text-lg font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-2 h-12 flex items-center">
                    {audio.title}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-sans tracking-wide">
                      {audio.duration}
                    </span>
                    
                    {/* Tiny visual dynamic cue for playing state */}
                    {isPlayingThis && (
                      <div className="flex gap-0.5 items-end h-3">
                        <span className="w-0.5 bg-primary rounded-full animate-[pulse_0.8s_infinite_alternate]" style={{ height: '100%', backgroundColor: activeTheme.hex }} />
                        <span className="w-0.5 bg-primary rounded-full animate-[pulse_0.8s_infinite_alternate_0.2s]" style={{ height: '60%', backgroundColor: activeTheme.hex }} />
                        <span className="w-0.5 bg-primary rounded-full animate-[pulse_0.8s_infinite_alternate_0.4s]" style={{ height: '80%', backgroundColor: activeTheme.hex }} />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <div className="bg-white rounded-3xl p-6 border border-outline-variant/10 space-y-6 shadow-2xl">
        <div className="space-y-5">
          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-label uppercase tracking-widest text-outline">Journal Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your self-inquiry a name..."
              className="w-full bg-surface-container-high/40 border border-outline-variant/20 rounded-xl p-4 text-base font-body text-gray-900 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-sans placeholder:text-gray-400"
            />
          </div>
          
          {/* Somatic States */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-label uppercase tracking-widest text-outline">State Before</label>
              <input 
                type="text"
                value={stateBefore}
                onChange={(e) => setStateBefore(e.target.value)}
                placeholder="e.g. Fight, Anxious..."
                className="w-full bg-surface-container-high/40 border border-outline-variant/20 rounded-xl p-4 text-sm font-body text-gray-900 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-sans placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-label uppercase tracking-widest text-outline">State After</label>
              <input 
                type="text"
                value={stateAfter}
                onChange={(e) => setStateAfter(e.target.value)}
                placeholder="e.g. Calm, Grounded..."
                className="w-full bg-surface-container-high/40 border border-outline-variant/20 rounded-xl p-4 text-sm font-body text-gray-900 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-sans placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Somatic Inquiry Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-label uppercase tracking-widest text-outline">Physiological Shift & Notes</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Observe the sensation. Note where in your body you feel tension, expansion, warmth, or cold..."
              className="w-full bg-surface-container-high/40 border border-outline-variant/20 rounded-xl p-4 text-sm font-body text-gray-800 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-sans min-h-[160px] resize-none placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Validation Info Tip */}
        {(!title.trim() || !text.trim()) && (
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-start gap-3">
            <Brain className="text-primary mt-0.5 shrink-0" size={16} />
            <p className="text-xs text-gray-600 leading-relaxed font-sans">
              To activate your somatic record, please fill out both the <strong className="text-gray-950 font-semibold">Journal Title</strong> and the <strong className="text-gray-950 font-semibold">Physiological Notes</strong>.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-outline-variant/10">
          <div className="flex items-center gap-2 text-on-surface-variant/40 text-[10px] uppercase tracking-widest font-bold">
            <Brain size={14} className="text-primary animate-pulse" />
            <span>Monitoring Sensation</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {editId && (
              <button
                onClick={() => {
                  setEditId(null);
                  setTitle('');
                  setText('');
                  setStateBefore('');
                  setStateAfter('');
                }}
                className="flex-1 sm:flex-none px-6 py-3 text-outline font-label text-xs uppercase tracking-widest hover:text-on-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !text.trim() || !title.trim()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 text-white rounded-full font-label text-xs font-bold uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-black/5"
              style={{ 
                backgroundColor: activeTheme.hex,
                boxShadow: (!title.trim() || !text.trim()) ? undefined : `0 8px 24px ${activeTheme.hex}44`
              }}
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : editId ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-outline">
            <History size={20} />
            <h3 className="font-label text-xs uppercase tracking-[0.2em]">History</h3>
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline/40" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Title or Content..."
              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-full py-2 pl-10 pr-4 text-xs font-body text-on-surface focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredEntries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface-container-low/30 border border-outline-variant/5 p-6 rounded-2xl space-y-4 group relative"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 
                      className="font-headline text-xl text-primary cursor-pointer hover:text-primary/80 transition-colors underline decoration-1"
                      onClick={() => handleEdit(entry)}
                    >{entry.title}</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-[10px] text-outline uppercase tracking-widest">
                        <Clock size={12} />
                        <span>{formatDate(entry.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-3 rounded-full bg-surface-container/60 transition-opacity hover:opacity-100 hover:bg-primary/20 hover:text-primary active:scale-95"
                  >
                    <Pencil size={18} />
                  </button>
                </div>

                <div className="flex gap-4">
                  {entry.stateBefore && (
                    <div className="bg-surface-container px-3 py-1 rounded-full flex items-center gap-2">
                      <span className="text-[8px] font-label uppercase text-outline">Before:</span>
                      <span className="text-[10px] font-body text-on-surface">{entry.stateBefore}</span>
                    </div>
                  )}
                  {entry.stateAfter && (
                    <div className="bg-surface-container px-3 py-1 rounded-full flex items-center gap-2">
                      <span className="text-[8px] font-label uppercase text-outline">After:</span>
                      <span className="text-[10px] font-body text-on-surface">{entry.stateAfter}</span>
                    </div>
                  )}
                </div>

                <p className="text-on-surface/80 text-sm leading-relaxed overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {entry.textContent}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredEntries.length === 0 && (
            <p className="text-center py-12 text-outline/40 font-body italic">No entries found.</p>
          )}
        </div>
      </section>
    </div>
  );
};
