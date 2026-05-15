import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { Save, History, Clock, Brain, Search, Pencil, CheckCircle, AlertCircle } from 'lucide-react';

interface Entry {
  id: string;
  title: string;
  textContent: string;
  stateBefore?: string;
  stateAfter?: string;
  createdAt: any;
  updatedAt?: any;
}

const SOMATIC_STATES = ['Fight', 'Flight', 'Freeze', 'Fawn'];

export const ShadowLabPage = ({ 
  onDirtyChange,
  onAuthTrigger
}: { 
  onDirtyChange: (isDirty: boolean) => void;
  onAuthTrigger: () => void;
}) => {
  const { userEmail } = useAuth();
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

  useEffect(() => {
    if (!userEmail) {
      setEntries([]);
      return;
    }

    const q = query(
      collection(db, 'journals'),
      where('uid', '==', userEmail),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newEntries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Entry[];
      setEntries(newEntries);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'journals');
    });

    return () => unsubscribe();
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
        const entryDate = e.createdAt.toDate();
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
      if (editId) {
        await updateDoc(doc(db, 'journals', editId), {
          title,
          textContent: text,
          stateBefore,
          stateAfter,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'journals'), {
          uid: userEmail,
          title,
          textContent: text,
          stateBefore,
          stateAfter,
          createdAt: serverTimestamp(),
        });
      }
      
      setTitle('');
      setText('');
      setStateBefore('');
      setStateAfter('');
      setEditId(null);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      handleFirestoreError(e, editId ? OperationType.UPDATE : OperationType.CREATE, 'journals');
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
    const date = timestamp.toDate();
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

      <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 space-y-6 shadow-xl">
        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entry Title..."
            className="w-full bg-transparent border-none focus:ring-0 text-2xl font-headline text-primary placeholder:text-primary/30 p-0"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-label uppercase tracking-widest text-outline">State Before</label>
              <input 
                type="text"
                value={stateBefore}
                onChange={(e) => setStateBefore(e.target.value)}
                placeholder="e.g. Fight, Anxious..."
                className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg p-3 text-sm font-body text-on-surface focus:ring-1 focus:ring-primary outline-none placeholder:text-on-surface-variant/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-label uppercase tracking-widest text-outline">State After</label>
              <input 
                type="text"
                value={stateAfter}
                onChange={(e) => setStateAfter(e.target.value)}
                placeholder="e.g. Calm, Grounded..."
                className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg p-3 text-sm font-body text-on-surface focus:ring-1 focus:ring-primary outline-none placeholder:text-on-surface-variant/30"
              />
            </div>
          </div>

          <div className="w-full h-[1px] bg-outline-variant/20" />

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Note the physiological shift..."
            className="w-full bg-transparent border-none focus:ring-0 text-lg font-body text-on-surface placeholder:text-on-surface-variant/30 resize-none p-0 min-h-[200px]"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-outline-variant/10">
          <div className="flex items-center gap-2 text-on-surface-variant/40 text-[10px] uppercase tracking-widest">
            <Brain size={14} />
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
                className="flex-1 sm:flex-none px-6 py-3 text-outline font-label text-xs uppercase tracking-widest hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !text.trim() || !title.trim()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-primary text-on-primary rounded-full font-label text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
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
