'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const cat = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'catalog', 'tweaks.json'), 'utf8'));
const TYPES = new Set(['registry', 'service', 'process', 'power']);
const RISKS = new Set(['safe', 'moderate', 'advanced']);
const CATS = new Set(['performance', 'gaming', 'focus', 'privacy']);

test('ids are unique and well formed', () => {
  const ids = cat.tweaks.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  ids.forEach((i) => assert.match(i, /^[a-z0-9-]+$/));
});

test('every tweak is bilingual and categorised', () => {
  for (const t of cat.tweaks) {
    assert.ok(CATS.has(t.category), `${t.id}: category`);
    assert.ok(RISKS.has(t.risk), `${t.id}: risk`);
    for (const f of ['name', 'description']) { assert.ok(t[f]?.en && t[f]?.es, `${t.id}: ${f} en+es`); }
    if (t.warning) assert.ok(t.warning.en && t.warning.es, `${t.id}: warning en+es`);
  }
});

test('non-safe tweaks must carry a warning', () => {
  cat.tweaks.filter((t) => t.risk !== 'safe').forEach((t) => assert.ok(t.warning, `${t.id}: needs warning`));
});

test('only whitelisted, well-formed actions', () => {
  for (const t of cat.tweaks) {
    assert.ok(t.actions.length > 0, `${t.id}: no actions`);
    for (const a of t.actions) {
      assert.ok(TYPES.has(a.type), `${t.id}: type ${a.type}`);
      if (a.type === 'registry') {
        assert.match(a.path, /^(HKCU|HKLM):\\/, `${t.id}: hive`);
        assert.ok(['DWord', 'String'].includes(a.kind), `${t.id}: kind`);
        assert.ok(a.name && a.value !== undefined, `${t.id}: name/value`);
      }
      if (a.type === 'service' || a.type === 'process') assert.match(a.name, /^[A-Za-z0-9_.-]+$/);
    }
  }
});

test('profiles reference existing tweaks', () => {
  const ids = new Set(cat.tweaks.map((t) => t.id));
  for (const [k, p] of Object.entries(cat.profiles)) {
    assert.ok(p.name.en && p.name.es, `${k}: name`);
    p.tweaks.forEach((i) => assert.ok(ids.has(i), `${k}: unknown ${i}`));
  }
});

test('UI strings exist in both languages with the same keys', () => {
  global.window = {}; require('../src/renderer/strings.js');
  const { en, es } = window.STRINGS;
  assert.deepEqual(Object.keys(en).sort(), Object.keys(es).sort());
  assert.deepEqual(Object.keys(en.cat).sort(), Object.keys(es.cat).sort());
});
