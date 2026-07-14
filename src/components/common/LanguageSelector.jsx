import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'es';

  const toggleLanguage = () => {
    const next = currentLang === 'es' ? 'en' : 'es';
    i18n.changeLanguage(next);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`inline-flex items-center justify-center space-x-1 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 ${className}`}
      aria-label={currentLang === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish'}
      title={currentLang === 'es' ? 'English' : 'Español'}
    >
      <Globe size={20} />
      <span className="uppercase text-sm font-semibold">{currentLang === 'es' ? 'ES' : 'EN'}</span>
    </button>
  );
};

export default LanguageSelector;
