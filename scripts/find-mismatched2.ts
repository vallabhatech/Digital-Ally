import { TRANSLATIONS } from '../src/shared/constants';

const en = new Set(Object.keys(TRANSLATIONS['en-US']));
const hi = new Set(Object.keys(TRANSLATIONS['hi-IN']));
const te = new Set(Object.keys(TRANSLATIONS['te-IN']));

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
