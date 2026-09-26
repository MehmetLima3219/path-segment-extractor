import { test } from 'node:test';
import assert from 'node:assert/strict';

import { splitPath, SegmentType } from '../src/index.js';

// --- Happy path ----------------------------------------------------------

test('simple file with extension', () => {
  const r = splitPath('readme.txt');
  assert.deepStrictEqual(r, {
    directory: '',
    filename: 'readme.txt',
    basename: 'readme',
    extension: 'txt',
    type: SegmentType.FILE
  });
});

test('nested file with extension', () => {
  const r = splitPath('/home/alice/readme.txt');
  assert.deepStrictEqual(r, {
    directory: '/home/alice/',
    filename: 'readme.txt',
    basename: 'readme',
    extension: 'txt',
    type: SegmentType.NESTED
  });
});

test('relative nested path', () => {
  const r = splitPath('src/index.js');
  assert.deepStrictEqual(r, {
    directory: 'src/',
    filename: 'index.js',
    basename: 'index',
    extension: 'js',
    type: SegmentType.NESTED
  });
});

// --- Extension edge cases -----------------------------------------------

test('multiple dots: only last extension is taken', () => {
  const r = splitPath('archive.tar.gz');
  assert.strictEqual(r.basename, 'archive.tar');
  assert.strictEqual(r.extension, 'gz');
});

test('leading dot is not an extension (dotfile)', () => {
  const r = splitPath('.bashrc');
  assert.strictEqual(r.filename, '.bashrc');
  assert.strictEqual(r.basename, '.bashrc');
  assert.strictEqual(r.extension, '');
});

test('dotfile with extension after the leading dot', () => {
  const r = splitPath('.env.local');
  assert.strictEqual(r.basename, '.env');
  assert.strictEqual(r.extension, 'local');
});

test('trailing dot is not an extension', () => {
  const r = splitPath('report.');
  assert.strictEqual(r.basename, 'report.');
  assert.strictEqual(r.extension, '');
});

test('no extension at all', () => {
  const r = splitPath('Makefile');
  assert.strictEqual(r.basename, 'Makefile');
  assert.strictEqual(r.extension, '');
});

// --- Directory / trailing-slash edges -----------------------------------

test('trailing slash yields empty filename', () => {
  const r = splitPath('a/b/');
  assert.strictEqual(r.directory, 'a/b/');
  assert.strictEqual(r.filename, '');
  assert.strictEqual(r.basename, '');
  assert.strictEqual(r.extension, '');
  assert.strictEqual(r.type, SegmentType.EMPTY);
});

test('root-only path', () => {
  const r = splitPath('/');
  assert.strictEqual(r.directory, '/');
  assert.strictEqual(r.filename, '');
  assert.strictEqual(r.type, SegmentType.EMPTY);
});

test('absolute path with no extension', () => {
  const r = splitPath('/usr/bin/perl');
  assert.strictEqual(r.directory, '/usr/bin/');
  assert.strictEqual(r.filename, 'perl');
  assert.strictEqual(r.extension, '');
  assert.strictEqual(r.type, SegmentType.NESTED);
});

// --- Empty / bad input ---------------------------------------------------

test('empty string returns all-empty fields', () => {
  const r = splitPath('');
  assert.deepStrictEqual(r, {
    directory: '',
    filename: '',
    basename: '',
    extension: '',
    type: SegmentType.EMPTY
  });
});

test('non-string input coerces to empty result rather than throwing', () => {
  assert.deepStrictEqual(splitPath(undefined), {
    directory: '',
    filename: '',
    basename: '',
    extension: '',
    type: SegmentType.EMPTY
  });
  assert.deepStrictEqual(splitPath(null), {
    directory: '',
    filename: '',
    basename: '',
    extension: '',
    type: SegmentType.EMPTY
  });
});

// --- Type field semantics -----------------------------------------------

test('SegmentType is frozen and exposes the documented labels', () => {
  assert.strictEqual(SegmentType.FILE, 'file');
  assert.strictEqual(SegmentType.NESTED, 'nested');
  assert.strictEqual(SegmentType.EMPTY, 'empty');
  assert.strictEqual(Object.isFrozen(SegmentType), true);
});

test('multiple consecutive slashes are preserved literally', () => {
  // We do not collapse slashes — they are legal (if odd) POSIX path
  // separators and the caller can normalise them separately if desired.
  const r = splitPath('a//b/c.txt');
  assert.strictEqual(r.directory, 'a//b/');
  assert.strictEqual(r.filename, 'c.txt');
  assert.strictEqual(r.extension, 'txt');
});
