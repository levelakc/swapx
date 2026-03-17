const fs = require('fs');
const content = fs.readFileSync('frontend/src/contexts/LanguageContext.jsx', 'utf8');

// This is a bit risky but we can try to parse it as JS if we wrap it
// Or just do it with regex and string manipulation to be safer with the file structure.

function deduplicate(lang) {
    const startMarker = `${lang}: {`;
    const startIndex = content.indexOf(startMarker);
    if (startIndex === -1) return;

    let depth = 0;
    let sectionStart = startIndex + startMarker.length - 1;
    let sectionEnd = -1;
    
    const stack = [{ keys: new Map(), start: sectionStart }];

    let result = content.substring(0, startIndex + startMarker.length);
    
    // We need to find the end of the section while respecting nesting.
    // Actually, it's better to extract the whole object, then deduplicate it, then put it back.
}

// Plan B: Use a script to extract the objects, deduplicate them in memory, and then print the new objects.
// Since it's a JSX file, we can't easily require it.
// Let's use a regex to match the objects.

const enMatch = content.match(/en: \{([\s\S]*?)\s{2}\},\s+he: \{/);
const heMatch = content.match(/he: \{([\s\S]*?)\n\s{2}\},\n\s{4}\};/);

function processObjectLiteral(str) {
    const lines = str.split('\n');
    const seen = new Map(); // key -> { value, lineIndex }
    const resultLines = [];
    
    // This is still hard because of nested objects like howItWorks.
    // Let's just find top level keys.
}

// Let's try another approach: Use the line numbers and keys we found and just remove the duplicates.

const enToRemove = [
    { key: 'sendOffer', line: 90, content: "    sendOffer: 'Send Offer'," },
    { key: 'iRequestCash', line: 185, content: '    iRequestCash: "I request cash",' },
    { key: 'searchServices', line: 36, content: "    searchServices: 'Search services...'," }
];

// Wait, I need to verify the exact content and line numbers.
