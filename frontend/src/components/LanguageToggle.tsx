import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { useEffect } from 'react';

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    // Set initial direction
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition-colors"
      title="Toggle English / Arabic"
    >
      <Languages size={20} />
      <span className="font-semibold">
        {i18n.language === 'en' ? 'العربية' : 'English'}
      </span>
    </button>
  );
}