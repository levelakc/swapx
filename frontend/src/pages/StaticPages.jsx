import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const content = {
  en: {
    about: { title: "About Us", text: "SwapX is the future of trading. We believe in a world where value is exchanged freely." },
    careers: { title: "Careers", text: "Join our team! We are looking for passionate individuals." },
    press: { title: "Press", text: "Latest news and updates about SwapX." },
    terms: { title: "Terms of Service", text: "By using SwapX, you agree to these terms..." },
    privacy: { title: "Privacy Policy", text: "We respect your privacy. Here is how we handle your data..." },
    company: { title: "Company", text: "SwapX Inc." }
  },
  he: {
    about: { title: "אודותינו", text: "SwapX היא עתיד המסחר. אנו מאמינים בעולם שבו ערך מוחלף בחופשיות." },
    careers: { title: "קריירה", text: "הצטרפו לצוות שלנו! אנו מחפשים אנשים מלאי תשוקה." },
    press: { title: "עיתונות", text: "חדשות ועדכונים אחרונים על SwapX." },
    terms: { title: "תנאי שימוש", text: "בשימוש ב-SwapX, אתה מסכים לתנאים אלה..." },
    privacy: { title: "מדיניות פרטיות", text: "אנו מכבדים את פרטיותך. כך אנו מטפלים בנתונים שלך..." },
    company: { title: "חברה", text: "SwapX בע״מ" }
  }
};

export default function StaticPage() {
  const location = useLocation();
  const { t, language } = useLanguage();
  
  // Extract slug from path (e.g., /about -> about)
  const slug = location.pathname.substring(1); 
  const pageData = content[language][slug] || content.en[slug] || { title: "Page Not Found", text: "" };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="bg-background rounded-2xl shadow-lg p-10 border border-border">
        <h1 className="text-4xl font-bold mb-6 text-primary">{pageData.title}</h1>
        <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed">{pageData.text}</p>
            <p className="mt-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
        </div>
      </div>
    </div>
  );
}
