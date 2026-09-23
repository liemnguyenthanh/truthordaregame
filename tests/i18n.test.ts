import test from 'node:test';
import assert from 'node:assert/strict';
import { interpolate, isLocale, localeFromPath, localePath, routeSegments } from '../lib/i18n';

test('localized routes round-trip without altering IDs, query values or fragments', () => {
  for (const [vi, en] of Object.entries(routeSegments)) {
    const suffix = '/ban-be-khoi-dong?group=1&next=%2Fvi#main';
    assert.equal(localePath('en', `/vi/${vi}${suffix}`), `/en/${en}${suffix}`);
    assert.equal(localePath('vi', `/en/${en}${suffix}`), `/vi/${vi}${suffix}`);
  }
  assert.equal(localePath('en', '/'), '/en');
  assert.equal(localePath('en', '/vi?group=1'), '/en?group=1');
  for (const href of [
    '/api/catalog',
    '/content/questions/a/1',
    'https://example.com/vi',
    '//example.com/vi',
    '#main',
  ]) {
    assert.equal(localePath('en', href), href);
  }
});

test('locale detection accepts only supported language boundaries', () => {
  assert.equal(isLocale('en'), true);
  assert.equal(isLocale('en-US'), false);
  assert.equal(isLocale('../en'), false);
  assert.equal(localeFromPath('/en/play/a'), 'en');
  assert.equal(localeFromPath('/english'), 'vi');
});

test('interpolation preserves unknown variables and inserts values literally', () => {
  assert.equal(
    interpolate('{name}: {count} / {total}', { name: '$& <An>', count: 0 }),
    '$& <An>: 0 / {total}',
  );
});
