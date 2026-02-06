import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const content = {
  en: {
    about: { 
        title: "About Us", 
        text: "SwapX is the future of trading. We believe in a world where value is exchanged freely. Our mission is to connect people and empower them to trade items and services seamlessly. Whether you're decluttering your home or offering your professional skills, SwapX provides a secure and intuitive platform to make it happen." 
    },
    careers: { 
        title: "Careers", 
        text: "Join our team! We are looking for passionate individuals who want to reshape the digital economy. If you love innovation, trading, and building great products, check out our open positions on LinkedIn or send your CV to careers@swapx.com." 
    },
    press: { 
        title: "Press", 
        text: "Latest news and updates about SwapX. We've been featured in major tech publications for our unique approach to bartering and service exchange. For media inquiries, please contact press@swapx.com." 
    },
    terms: { 
        title: "Terms of Service", 
        text: "By using SwapX, you agree to these terms. Users must be 18 years or older. All trades are final unless otherwise specified. We strictly prohibit the trading of illegal items. SwapX is not responsible for the quality of items or services exchanged, but we provide a dispute resolution center for our community." 
    },
    privacy: { 
        title: "Privacy Policy", 
        text: "We respect your privacy. We collect only the data necessary to facilitate trades and services. Your personal information is encrypted and never sold to third parties. We use cookies to enhance your experience. You can request data deletion at any time by contacting support." 
    },
    company: { 
        title: "Company", 
        text: "SwapX Inc. is a registered company dedicated to sustainable commerce. Founded in 2024, we operate globally with a focus on local communities." 
    }
  },
  he: {
    about: { 
        title: "אודותינו", 
        text: "SwapX היא עתיד המסחר. אנו מאמינים בעולם שבו ערך מוחלף בחופשיות. המשימה שלנו היא לחבר בין אנשים ולאפשר להם לסחור בפריטים ושירותים בצורה חלקה. בין אם אתם עושים סדר בבית או מציעים את הכישורים המקצועיים שלכם, SwapX מספקת פלטפורמה מאובטחת ואינטואיטיבית לכך." 
    },
    careers: { 
        title: "קריירה", 
        text: "הצטרפו לצוות שלנו! אנו מחפשים אנשים מלאי תשוקה שרוצים לעצב מחדש את הכלכלה הדיגיטלית. אם אתם אוהבים חדשנות, מסחר ובניית מוצרים מעולים, בדקו את המשרות הפתוחות שלנו בלינקדאין או שלחו קורות חיים ל-careers@swapx.com." 
    },
    press: { 
        title: "עיתונות", 
        text: "חדשות ועדכונים אחרונים על SwapX. הופענו בפרסומי טכנולוגיה מובילים בזכות הגישה הייחודית שלנו לסחר חליפין והחלפת שירותים. לפניות תקשורת, אנא צרו קשר עם press@swapx.com." 
    },
    terms: { 
        title: "תנאי שימוש", 
        text: "בשימוש ב-SwapX, אתה מסכים לתנאים אלה. המשתמשים חייבים להיות בני 18 ומעלה. כל העסקאות הן סופיות אלא אם צוין אחרת. אנו אוסרים בהחלט על סחר בפריטים לא חוקיים. SwapX אינה אחראית לאיכות הפריטים או השירותים המוחלפים, אך אנו מספקים מרכז יישוב מחלוקות לקהילה שלנו." 
    },
    privacy: { 
        title: "מדיניות פרטיות", 
        text: "אנו מכבדים את פרטיותך. אנו אוספים רק את הנתונים הדרושים לביצוע עסקאות ושירותים. המידע האישי שלך מוצפן ולעולם אינו נמכר לצדדים שלישיים. אנו משתמשים בעוגיות כדי לשפר את החוויה שלך. ניתן לבקש מחיקת נתונים בכל עת על ידי פנייה לתמיכה." 
    },
    company: { 
        title: "חברה", 
        text: "SwapX בע״מ היא חברה רשומה המוקדשת למסחר בר קיימא. נוסדה בשנת 2024, אנו פועלים גלובלית עם התמקדות בקהילות מקומיות." 
    }
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
            <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">{pageData.text}</p>
        </div>
      </div>
    </div>
  );
}
