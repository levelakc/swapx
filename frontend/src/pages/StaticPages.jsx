import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const content = {
  en: {
    about: { 
        title: "About SwapX", 
        text: "SwapX is redefining the way we exchange value. We've built more than just a marketplace; we've created a dynamic ecosystem where items and professional services find new life through seamless trading. \n\nOur mission is to empower individuals and businesses to leverage their unused assets and specialized skills, fostering a sustainable circular economy. By blending cutting-edge technology with the age-old practice of bartering, SwapX makes high-value exchanges accessible, secure, and intuitive for everyone, everywhere." 
    },
    careers: { 
        title: "Build the Future with Us", 
        text: "At SwapX, we're looking for visionaries, problem-solvers, and builders who are passionate about transforming the global economy. We believe that everyone has something of value to offer, and we're building the tools to prove it.\n\nJoin a remote-first team of innovators dedicated to sustainability and economic empowerment. Whether you're an engineer, a designer, or a growth specialist, your work at SwapX will directly impact how millions of people trade and connect. \n\nExplore our open roles or reach out to us at careers@swapx.com." 
    },
    press: { 
        title: "Press & Media", 
        text: "SwapX is consistently making headlines for its innovative approach to modern commerce and the circular economy. From being featured in top tech journals to leading discussions on sustainable trading, we are at the forefront of the new barter era.\n\nFor media assets, interview requests, or data-driven stories about the future of trading, please contact our communications team at press@swapx.com." 
    },
    terms: { 
        title: "Terms of Service", 
        text: "Your trust is our priority. By engaging with the SwapX platform, you join a community built on mutual respect and fair exchange. Our terms are designed to ensure a safe, transparent, and legal environment for all users.\n\nWe facilitate connections, but the integrity of each trade rests with our community. We require all users to be of legal age and strictly prohibit the exchange of regulated or illegal goods. For a detailed breakdown of our user agreements and dispute resolution processes, please review the full document below." 
    },
    privacy: { 
        title: "Privacy & Data Security", 
        text: "At SwapX, your data belongs to you. We employ industry-leading encryption and security protocols to ensure that your personal information and trade history remain confidential.\n\nWe collect minimal data—only what is necessary to facilitate secure transactions and improve your experience. We never sell your data to third parties. Our commitment to privacy is absolute, allowing you to trade with peace of mind." 
    },
    company: { 
        title: "The Company", 
        text: "SwapX Inc. is a technology leader dedicated to democratizing commerce. Founded in 2024 with a vision of a waste-free world, we operate at the intersection of fintech and sustainability. \n\nOur platform supports thousands of users across the globe, helping them turn idle resources into meaningful value. We are committed to long-term growth, ethical business practices, and building a more connected world." 
    }
  },
  he: {
    about: { 
        title: "אודות SwapX", 
        text: "סוואפ-אקס (SwapX) מגדירה מחדש את הדרך שבה אנו מחליפים ערך. בנינו הרבה יותר מסתם זירת מסחר; יצרנו אקו-סיסטם דינמי שבו פריטים ושירותים מקצועיים מוצאים חיים חדשים דרך מסחר חכם ונטול מאמץ.\n\nהמשימה שלנו היא להעניק לאנשים ועסקים את הכלים למנף את הנכסים והכישורים שלהם, תוך קידום כלכלה מעגלית ובת-קיימא. על ידי שילוב של טכנולוגיה מתקדמת עם הפרקטיקה העתיקה של סחר חליפין, SwapX הופכת עסקאות בעלות ערך גבוה לנגישות, מאובטחות ואינטואיטיביות עבור כולם, בכל מקום." 
    },
    careers: { 
        title: "בנו איתנו את העתיד", 
        text: "ב-SwapX, אנו מחפשים חזונאים, פותרי בעיות ובונים שמרגישים תשוקה לשינוי הכלכלה העולמית. אנו מאמינים שלכל אחד יש משהו בעל ערך להציע, ואנחנו בונים את הכלים להוכיח זאת.\n\nהצטרפו לצוות גלובלי של חדשנים המוקדשים לקיימות והעצמה כלכלית. בין אם אתם מהנדסים, מעצבים או מומחי צמיחה, לעבודה שלכם ב-SwapX תהיה השפעה ישירה על הדרך שבה מיליוני אנשים סוחרים ומתחברים.\n\nבדקו את המשרות הפתוחות שלנו או צרו קשר בכתובת careers@swapx.com." 
    },
    press: { 
        title: "עיתונות ומדיה", 
        text: "SwapX עולה לכותרות באופן עקבי בזכות הגישה החדשנית שלה למסחר מודרני וכלכלה מעגלית. החל מכתבות בכתבי עת טכנולוגיים מובילים ועד להובלת דיונים על מסחר בר-קיימא, אנו נמצאים בחזית של עידן הבארטר החדש.\n\nלקבלת חומרי מדיה, בקשות לראיונות או סיפורים מבוססי נתונים על עתיד המסחר, אנא צרו קשר עם צוות התקשורת שלנו ב-press@swapx.com." 
    },
    terms: { 
        title: "תנאי שימוש", 
        text: "האמון שלכם הוא בראש סדר העדיפויות שלנו. על ידי שימוש בפלטפורמת SwapX, אתם מצטרפים לקהילה שנבנתה על כבוד הדדי והחלפה הוגנת. התנאים שלנו נועדו להבטיח סביבה בטוחה, שקופה וחוקית לכל המשתמשים.\n\nאנו מקשרים בין אנשים, אך היושרה של כל עסקה נשענת על הקהילה שלנו. אנו דורשים מכל המשתמשים להיות בגיל החוקי ואוסרים בהחלט על החלפת סחורות מפוקחות או לא חוקיות. לפירוט מלא של הסכמי המשתמש ותהליכי יישוב המחלוקות שלנו, אנא עיינו במסמך המלא להלן." 
    },
    privacy: { 
        title: "פרטיות ואבטחת נתונים", 
        text: "ב-SwapX, הנתונים שלכם שייכים לכם. אנו משתמשים בפרוטוקולי הצפנה ואבטחה המובילים בתעשייה כדי להבטיח שהמידע האישי והיסטוריית העסקאות שלכם יישארו חסויים.\n\nאנו אוספים נתונים מינימליים בלבד – רק את מה שנחוץ כדי לאפשר עסקאות מאובטחות ולשפר את החוויה שלכם. לעולם לא נמכור את הנתונים שלכם לצדדים שלישיים. המחויבות שלנו לפרטיות היא מוחלטת, ומאפשרת לכם לסחור בראש שקט." 
    },
    company: { 
        title: "החברה", 
        text: "סוואפ-אקס בע\"מ (SwapX Inc) היא מובילה טכנולוגית המוקדשת לדמוקרטיזציה של המסחר. נוסדנו בשנת 2024 עם חזון לעולם ללא פסולת, ואנו פועלים בצומת שבין פינטק לקיימות.\n\nהפלטפורמה שלנו משרתת אלפי משתמשים ברחבי העולם, ועוזרת להם להפוך משאבים לא מנוצלים לערך משמעותי. אנו מחויבים לצמיחה ארוכת טווח, לשיטות עסקיות אתיות ולבניית עולם מחובר יותר." 
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
