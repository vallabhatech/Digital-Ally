import fs from 'fs';

const content = fs.readFileSync('src/shared/constants.ts', 'utf8');

// Simple regex to extract TRANSLATIONS object keys
const enUS_matches = content.match(/'en-US':\s*{([^}]+)}/);
const hiIN_matches = content.match(/'hi-IN':\s*{([^}]+)}/);
const teIN_matches = content.match(/'te-IN':\s*{([^}]+)}/);

function getKeys(matchString) {
  if (!matchString) return [];
  const keys = [];
  const regex = /^\s*([a-zA-Z0-9_]+):/gm;
  let match;
  while ((match = regex.exec(matchString)) !== null) {
    keys.push(match[1]);
  }
  return keys;
}

const en = new Set(getKeys(enUS_matches[1]));
const hi = new Set(getKeys(hiIN_matches[1]));
const te = new Set(getKeys(teIN_matches[1]));

console.log('en keys count:', en.size);
console.log('hi keys count:', hi.size);
console.log('te keys count:', te.size);

const allKeys = new Set([...en, ...hi, ...te]);

console.log('Missing in en:');
for (let key of allKeys) {
  if (!en.has(key)) console.log(key);
}

console.log('Missing in hi:');
for (let key of allKeys) {
  if (!hi.has(key)) console.log(key);
}

console.log('Missing in te:');
for (let key of allKeys) {
  if (!te.has(key)) console.log(key);
}
