const fs = require('fs');

const content = fs.readFileSync('frontend/src/contexts/LanguageContext.jsx', 'utf8');

function findDuplicateKeys(lang) {
  const startMarker = `${lang}: {`;
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) return [];
  
  let depth = 1;
  let endIndex = -1;
  for (let i = startIndex + startMarker.length; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') depth--;
    if (depth === 0) {
      endIndex = i;
      break;
    }
  }
  
  const section = content.substring(startIndex, endIndex + 1);
  const keys = [];
  const lines = section.split('\n');
  const duplicates = [];
  const seen = new Set();
  
  // Very naive key extraction - might fail on complex objects but for simple keys it's fine.
  lines.forEach((line, index) => {
    const match = line.match(/^\s+(['"]?[\w-]+['"]?):\s*/);
    if (match) {
      const key = match[1].replace(/['"]/g, '');
      if (seen.has(key)) {
        duplicates.push({ key, lineNum: index, value: line.trim() });
      }
      seen.add(key);
    }
  });
  
  return duplicates;
}

console.log('Duplicate keys in EN:');
console.log(findDuplicateKeys('en'));
console.log('\nDuplicate keys in HE:');
console.log(findDuplicateKeys('he'));
