import { motion } from 'framer-motion';
import { ArrowLeftRight, Coins, Package, Repeat, Zap, ShieldCheck, TrendingUp, Search, Sparkles, HeartHandshake } from 'lucide-react';

const icons = [
  { Icon: ArrowLeftRight, color: "text-blue-500", top: '15%', left: '10%', size: 60, delay: 0 },
  { Icon: Coins, color: "text-yellow-500", top: '25%', left: '85%', size: 80, delay: 1 },
  { Icon: Package, color: "text-green-500", top: '75%', left: '12%', size: 70, delay: 2 },
  { Icon: Repeat, color: "text-purple-500", top: '85%', left: '80%', size: 65, delay: 0.5 },
  { Icon: Zap, color: "text-orange-500", top: '45%', left: '5%', size: 40, delay: 1.5 },
  { Icon: ShieldCheck, color: "text-indigo-500", top: '10%', left: '50%', size: 55, delay: 3 },
  { Icon: TrendingUp, color: "text-red-500", top: '65%', left: '92%', size: 50, delay: 0.8 },
  { Icon: Search, color: "text-cyan-500", top: '55%', left: '48%', size: 90, delay: 2.2 },
  { Icon: Sparkles, color: "text-pink-500", top: '35%', left: '20%', size: 45, delay: 1.2 },
  { Icon: HeartHandshake, color: "text-rose-500", top: '80%', left: '40%', size: 55, delay: 2.5 },
];

export default function FloatingBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-[0.04] dark:opacity-[0.07]">
      {icons.map((item, index) => (
        <motion.div
          key={index}
          className={`absolute ${item.color} hidden md:block`}
          style={{ top: item.top, left: item.left }}
          animate={{
            y: [0, -40, 0],
            x: [0, 30, 0],
            rotate: [0, 20, -20, 0],
            scale: [1, 1.15, 0.85, 1]
          }}
          transition={{
            duration: 12 + Math.random() * 8,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut"
          }}
        >
          <item.Icon size={item.size} strokeWidth={1.5} />
        </motion.div>
      ))}
    </div>
  );
}
