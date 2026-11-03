const assert = require('assert');
const { slugify, isValidSlug } = require('../utils/slug');
const { normalizeMoroccanPhone, isValidPersonName } = require('../utils/phone');

assert.strictEqual(slugify('Vacu Flask'), 'vacu-flask');
assert.strictEqual(slugify('V-Comb!'), 'v-comb');
assert.strictEqual(slugify('   '), 'product');
assert.strictEqual(isValidSlug('vacu-flask'), true);
assert.strictEqual(isValidSlug('Vacu Flask'), false);

assert.strictEqual(normalizeMoroccanPhone('+212 6 12 34 56 78'), '0612345678');
assert.strictEqual(normalizeMoroccanPhone('06-12-34-56-78'), '0612345678');
assert.strictEqual(normalizeMoroccanPhone('212712345678'), '0712345678');
assert.strictEqual(normalizeMoroccanPhone('00212512345678'), '0512345678');
assert.strictEqual(normalizeMoroccanPhone('12345'), null);
assert.strictEqual(normalizeMoroccanPhone('+33 6 12 34 56 78'), null);
assert.strictEqual(isValidPersonName('Sara Bennani'), true);
assert.strictEqual(isValidPersonName('A'), false);

console.log('verifyUpgrade: ok');
