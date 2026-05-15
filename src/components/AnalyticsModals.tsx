import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, ShieldCheck, Calendar } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export const AnalyticsModals = ({ 
  type, 
  onClose 
}: { 
  type: 'daily' | 'vagal' | null, 
  onClose: () => void 
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any[]>([]);
  const [safetyScore, setSafetyScore] = useState(0);

  useEffect(() => {
    if (!user || !type) return;

    const fetchData = async () => {
      if (type === 'daily') {
        const q = query(
          collection(db, 'user_progress'),
          where('uid', '==', user.uid),
          orderBy('completedAt', 'desc'),
          limit(50)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => d.data());
        
        // Group by day for last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const counts = last7Days.map(day => {
          return data.filter(entry => {
            const entryDate = entry.completedAt?.toDate().toISOString().split('T')[0];
            return entryDate === day;
          }).length;
        });

        setStats(counts.map((count, i) => ({ day: last7Days[i].split('-')[2], count })));
      } else {
        // Vagal Tone / Safety Score
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0,0,0,0);

        const q = query(
          collection(db, 'user_progress'),
          where('uid', '==', user.uid),
          where('completedAt', '>=', startOfMonth)
        );
        const snap = await getDocs(q);
        const count = snap.size;
        // Score logic: 10 resets = 100% safety
        setSafetyScore(Math.min(100, count * 10));
      }
    };

    fetchData();
  }, [user, type]);

  return (
    <AnimatePresence>
      {type && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-xl flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="global-modal-center bg-surface-container-high border border-outline-variant/20 p-8 rounded-3xl shadow-2xl space-y-8"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {type === 'daily' ? <TrendingUp className="text-primary" /> : <ShieldCheck className="text-primary" />}
                <h3 className="font-headline text-xl text-on-surface">
                  {type === 'daily' ? 'Daily Flow' : 'Vagal Tone'}
                </h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container transition-colors">
                <X size={20} className="text-outline" />
              </button>
            </div>

            {type === 'daily' ? (
              <div className="space-y-6">
                <p className="text-sm text-on-surface-variant font-body">Consistency over the last 7 days.</p>
                <div className="flex items-end justify-between h-32 gap-2">
                  {stats.map((s, i) => (
                    <div key={i} className="flex flex-col items-center flex-1 gap-2">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.min(100, s.count * 20)}%` }}
                        className="w-full bg-primary/20 rounded-t-lg border-t border-primary/40 relative group"
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          {s.count}
                        </div>
                      </motion.div>
                      <span className="text-[8px] font-label text-outline uppercase">{s.day}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-outline italic">
                  <Calendar size={14} />
                  <span>Keep the rhythm to recalibrate.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-8 py-4">
                <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-surface-container"
                    />
                    <motion.circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={502.4}
                      initial={{ strokeDashoffset: 502.4 }}
                      animate={{ strokeDashoffset: 502.4 - (502.4 * safetyScore) / 100 }}
                      className="text-primary"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-headline font-bold text-primary">{safetyScore}%</span>
                    <span className="text-[10px] font-label uppercase tracking-widest text-outline">Safety Score</span>
                  </div>
                </div>
                <p className="text-center text-sm text-on-surface-variant font-body leading-relaxed">
                  Your score is based on {safetyScore / 10} Resets this month. 10 sessions creates a neurological baseline.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
