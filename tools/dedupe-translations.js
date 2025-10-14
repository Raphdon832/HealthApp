const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'language.jsx');
let src = fs.readFileSync(filePath, 'utf8');

function dedupeLanguageBlocks(input) {
  const out = [];
  const len = input.length;
  let i = 0;
  while (i < len) {
    const langMatch = input.slice(i).match(/^(\s*)([a-z]{2,5})\s*:\s*\{/m);
    if (!langMatch) {
      // append the rest
      out.push(input.slice(i));
      break;
    }
    const matchIndex = i + langMatch.index;
    // push content up to match
    out.push(input.slice(i, matchIndex));
    const indent = langMatch[1];
    const langKey = langMatch[2];
    // find block start
    let j = matchIndex + langMatch[0].length - 1; // points at '{'
    let braceCount = 1;
    j++;
    while (j < len && braceCount > 0) {
      const ch = input[j];
      if (ch === '{') braceCount++;
      else if (ch === '}') braceCount--;
      j++;
    }
    const block = input.slice(matchIndex, j); // includes closing }
    // now dedupe keys inside block
    const lines = block.split(/\r?\n/);
    const seen = new Set();
    const outLines = [];
    for (let line of lines) {
      const keyMatch = line.match(/^\s*['\"]([^'\"]+)['\"]\s*:\s*/);
      if (keyMatch) {
        const key = keyMatch[1];
        if (seen.has(key)) {
          // skip this line (duplicate key). But to be safe, if line contains comment or is complex, skip only the key:value line
          // We'll just skip this line entirely to avoid duplicate literal key.
          continue;
        }
        seen.add(key);
      }
      outLines.push(line);
    }
    out.push(outLines.join('\n'));
    i = j;
  }
  return out.join('');
}

const cleaned = dedupeLanguageBlocks(src);
fs.writeFileSync(filePath, cleaned, 'utf8');
console.log('dedupe complete');
