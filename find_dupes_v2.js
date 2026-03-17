const fs = require('fs');
const content = fs.readFileSync('frontend/src/contexts/LanguageContext.jsx', 'utf8');

function findActualDuplicates(lang) {
  const startMarker = `${lang}: {`;
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) return;

  let depth = 0;
  let sectionStart = startIndex + startMarker.length - 1;
  let sectionEnd = -1;
  
  const stack = [];
  const duplicates = [];

  for (let i = sectionStart; i < content.length; i++) {
    if (content[i] === '{') {
      stack.push(new Set());
    } else if (content[i] === '}') {
      stack.pop();
      if (stack.length === 0) {
        sectionEnd = i;
        break;
      }
    } else if (content[i] === ':' && stack.length > 0) {
      // Try to find the key before this colon
      let j = i - 1;
      while (j >= 0 && /\s/.test(content[j])) j--;
      let keyEnd = j + 1;
      while (j >= 0 && /[\w"'-]/.test(content[j])) j--;
      let keyStart = j + 1;
      let key = content.substring(keyStart, keyEnd).replace(/['"]/g, '');
      
      if (key && !/^\d+$/.test(key)) { // ignore array-like indices if any
         const currentSet = stack[stack.length - 1];
         if (currentSet.has(key)) {
           duplicates.push({ key, pos: i });
         }
         currentSet.add(key);
      }
    }
  }
  return duplicates;
}

console.log('EN Duplicates:', findActualDuplicates('en'));
console.log('HE Duplicates:', findActualDuplicates('he'));
