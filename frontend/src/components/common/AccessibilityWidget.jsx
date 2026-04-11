import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Accessibility, X, Sun, Moon, Type, Eye, MousePointer, Link as LinkIcon, RefreshCcw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { t, dir } = useLanguage();
  const [settings, setSettings] = useState({
    highContrast: false,
    largeText: false,
    grayscale: false,
    dyslexicFont: false,
    bigCursor: false,
    highlightLinks: false,
  });

  useEffect(() => {
    const root = document.documentElement;
    if (settings.highContrast) root.classList.add('high-contrast');
    else root.classList.remove('high-contrast');

    if (settings.largeText) root.classList.add('large-text');
    else root.classList.remove('large-text');

    if (settings.grayscale) root.style.filter = 'grayscale(100%)';
    else root.style.filter = 'none';

    if (settings.dyslexicFont) root.classList.add('dyslexic-font');
    else root.classList.remove('dyslexic-font');

    if (settings.bigCursor) root.classList.add('big-cursor');
    else root.classList.remove('big-cursor');

    if (settings.highlightLinks) root.classList.add('highlight-links');
    else root.classList.remove('highlight-links');
  }, [settings]);

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const resetSettings = () => {
    setSettings({
      highContrast: false,
      largeText: false,
      grayscale: false,
      dyslexicFont: false,
      bigCursor: false,
      highlightLinks: false,
    });
  };

  return (
    <div className={`fixed bottom-24 ${dir === 'rtl' ? 'left-6' : 'right-6'} z-[999]`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-primary text-primary-content shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        title="Accessibility"
      >
        {isOpen ? <X size={24} /> : <Accessibility size={24} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`absolute bottom-16 ${dir === 'rtl' ? 'left-0' : 'right-0'} w-72 bg-card border border-white/10 rounded-3xl shadow-2xl p-6 backdrop-blur-xl`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-lg uppercase tracking-tight">{t('accessibility', 'Accessibility')}</h3>
              <button onClick={resetSettings} className="p-2 hover:bg-secondary rounded-xl transition-colors text-muted-foreground" title="Reset">
                <RefreshCcw size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <AccessButton 
                active={settings.highContrast} 
                onClick={() => toggleSetting('highContrast')}
                icon={<Sun size={18} />}
                label={t('highContrast', 'High Contrast')}
              />
              <AccessButton 
                active={settings.largeText} 
                onClick={() => toggleSetting('largeText')}
                icon={<Type size={18} />}
                label={t('largeText', 'Large Text')}
              />
              <AccessButton 
                active={settings.grayscale} 
                onClick={() => toggleSetting('grayscale')}
                icon={<Eye size={18} />}
                label={t('grayscale', 'Grayscale')}
              />
              <AccessButton 
                active={settings.dyslexicFont} 
                onClick={() => toggleSetting('dyslexicFont')}
                icon={<Type size={18} />}
                label={t('dyslexicFont', 'Dyslexic Font')}
              />
              <AccessButton 
                active={settings.bigCursor} 
                onClick={() => toggleSetting('bigCursor')}
                icon={<MousePointer size={18} />}
                label={t('bigCursor', 'Big Cursor')}
              />
              <AccessButton 
                active={settings.highlightLinks} 
                onClick={() => toggleSetting('highlightLinks')}
                icon={<LinkIcon size={18} />}
                label={t('highlightLinks', 'Highlight Links')}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AccessButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-3 rounded-2xl border transition-all ${
        active 
          ? 'bg-primary text-primary-content border-primary shadow-lg shadow-primary/20' 
          : 'bg-secondary/50 border-white/5 text-muted-foreground hover:border-primary/30 hover:bg-secondary'
      }`}
    >
      <div className={`${active ? 'text-primary-content' : 'text-primary'}`}>
        {icon}
      </div>
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}
