import { motion } from 'motion/react';
import { useMediaPlayer } from '../MediaPlayerContext';
import { Wind, Heart, Zap, Cloud, Droplets } from 'lucide-react';

const ORGANS = [
  { name: 'Liver', element: 'Wood', sound: 'SHHHH', icon: Wind, color: '#F2CA50' },
  { name: 'Heart', element: 'Fire', sound: 'HAWWW', icon: Heart, color: '#ef4444' },
  { name: 'Spleen', element: 'Earth', sound: 'WHOOO', icon: Zap, color: '#fbbf24' },
  { name: 'Lungs', element: 'Metal', sound: 'SSSSS', icon: Cloud, color: '#94a3b8' },
  { name: 'Kidneys', element: 'Water', sound: 'CHOOO', icon: Droplets, color: '#3b82f6' },
];

export const SoundsPage = ({ onOpenPlayer }: { onOpenPlayer: (track: string) => void }) => {
  return (
    <div className="space-y-12 pb-20">
      <section className="bg-white/50 backdrop-blur-sm p-8 rounded-3xl border border-outline-variant/5">
        <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl text-on-surface mb-6 leading-tight">
          Healing <span className="italic text-primary">Frequencies</span>
        </h2>
        <p className="font-body text-on-surface-variant max-w-md text-lg leading-relaxed">
          Connect with your internal landscape through somatic resonance. Each sound is a vessel for restoration.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ORGANS.map((organ) => (
          <motion.button
            key={organ.name}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onOpenPlayer(organ.name)}
            className="bg-white rounded-3xl p-8 flex flex-col justify-between group cursor-pointer border border-outline-variant/10 text-left shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-primary font-label text-xs uppercase tracking-[0.2em] mb-2 block">{organ.element} Element</span>
                <h3 className="font-headline text-3xl mb-1">{organ.name}</h3>
                <p className="text-on-surface-variant font-label italic text-xl">{organ.sound}</p>
              </div>
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center clay-shadow"
                style={{ backgroundColor: '#353534' }}
              >
                <organ.icon className="text-primary" size={32} />
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
