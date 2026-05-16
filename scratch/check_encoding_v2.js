const fs = require('fs');
const path = require('path');

const suspiciousPatterns = [
  'Ä‘', 'Ă ', 'Ă¡', 'Ă¢', 'Ă£', 'Ă¨', 'Ă©', 'Ăª', 'Ă¬', 'Ă­', 'Ă²', 'Ă³', 'Ă´', 'Ăµ', 'Ă¹', 'Ăº', 'Ă½',
  'áº', 'á»'
];

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walk(filePath, callback);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.json')) {
      callback(filePath);
    }
  }
}

const results = [];

walk('e:/TZOSHOP/src', (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const pattern of suspiciousPatterns) {
    if (content.includes(pattern)) {
      // Basic check to see if it's really mojibake or just a coincidental sequence
      // In UTF-8 Vietnamese, áº and á» are very common prefixes, so we need to be careful.
      // However, Ä‘ is almost certainly đ mojibake.
      results.push({ filePath, pattern });
      break;
    }
  }
});

console.log(JSON.stringify(results, null, 2));
