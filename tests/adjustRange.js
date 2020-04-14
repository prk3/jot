const tap = require('tap')
const selection = require('../jot/selection');
const adjustRange = selection.adjustRange;

tap.test('adjustRange', function (t) {
	t.test('works with left inserts', function (t) {
		// "he[llo wor]ld"
		// INSERT "abcde" at 1
		var r = adjustRange({ start: 2, end: 9 }, 1, 0, 5);
		t.equal(r.start, 7);
		t.equal(r.end, 14);
		t.end();
	});

	t.test('works with left inserts touching range', function (t) {
		// "he[llo wor]ld"
		// INSERT "abcde" at 2
		var r = adjustRange({ start: 2, end: 9 }, 2, 0, 5);
		t.equal(r.start, 7);
		t.equal(r.end, 14);
		t.end();
	});

	t.test('works with middle inserts', function (t) {
		// "he[llo wor]ld"
		// INSERT "abcde" at 3
		var r = adjustRange({ start: 2, end: 9 }, 3, 0, 5);
		t.equal(r.start, 2);
		t.equal(r.end, 14);
		t.end();
	});

	t.test('works with right inserts touching range', function (t) {
		// "he[llo wor]ld"
		// INSERT "abcde" at 9
		var r = adjustRange({ start: 2, end: 9 }, 9, 0, 5);
		t.equal(r.start, 2);
		t.equal(r.end, 9);
		t.end();
	});

	t.test('works with right inserts', function (t) {
		// "he[llo wor]ld"
		// INSERT "abcde" at 10
		var r = adjustRange({ start: 2, end: 9 }, 10, 0, 5);
		t.equal(r.start, 2);
		t.equal(r.end, 9);
		t.end();
	});

	t.test('works with left deletes', function (t) {
		// "he[llo wor]ld"
		// DELETE 1 at 0
		var r = adjustRange({ start: 2, end: 9 }, 0, 1, 0);
		t.equal(r.start, 1);
		t.equal(r.end, 8);
		t.end();
	});

	t.test('works with left deletes touching range', function (t) {
		// "he[llo wor]ld"
		// DELETE 1 at 1
		var r = adjustRange({ start: 2, end: 9 }, 1, 1, 0);
		t.equal(r.start, 1);
		t.equal(r.end, 8);
		t.end();
	});

	t.test('works with left deletes crossing range start', function (t) {
		// "he[llo wor]ld"
		// DELETE 3 at 1
		var r = adjustRange({ start: 2, end: 9 }, 1, 3, 0);
		t.equal(r.start, 1);
		t.equal(r.end, 6);
		t.end();
	});

	t.test('works with middle deletes touching range start', function (t) {
		// "he[llo wor]ld"
		// DELETE 2 at 2
		var r = adjustRange({ start: 2, end: 9 }, 2, 2, 0);
		t.equal(r.start, 2);
		t.equal(r.end, 7);
		t.end();
	});

	t.test('works with middle deletes', function (t) {
		// "he[llo wor]ld"
		// DELETE 5 at 3
		var r = adjustRange({ start: 2, end: 9 }, 3, 5, 0);
		t.equal(r.start, 2);
		t.equal(r.end, 4);
		t.end();
	});

	t.test('works with middle deletes touching range end', function (t) {
		// "he[llo wor]ld"
		// DELETE 2 at 7
		var r = adjustRange({ start: 2, end: 9 }, 7, 2, 0);
		t.equal(r.start, 2);
		t.equal(r.end, 7);
		t.end();
	});

	t.test('works with middle deletes crossing range end', function (t) {
		// "he[llo wor]ld"
		// DELETE 3 at 7
		var r = adjustRange({ start: 2, end: 9 }, 7, 3, 0);
		t.equal(r.start, 2);
		t.equal(r.end, 7);
		t.end();
	});

	t.test('works with right deletes touching range end', function (t) {
		// "he[llo wor]ld"
		// DELETE 1 at 9
		var r = adjustRange({ start: 2, end: 9 }, 9, 1, 0);
		t.equal(r.start, 2);
		t.equal(r.end, 9);
		t.end();
	});

	t.test('works with right deletes', function (t) {
		// "he[llo wor]ld"
		// DELETE 1 at 10
		var r = adjustRange({ start: 2, end: 9 }, 10, 1, 0);
		t.equal(r.start, 2);
		t.equal(r.end, 9);
		t.end();
	});

	t.test('works with deletes covering range', function (t) {
		// "he[llo wor]ld"
		// DELETE 7 at 2
		var r = adjustRange({ start: 2, end: 9 }, 2, 7, 0);
		t.equal(r.start, 2);
		t.equal(r.end, 2);

		// "he[llo wor]ld"
		// DELETE 9 at 1
		r = adjustRange({ start: 2, end: 9 }, 1, 9, 0);
		t.equal(r.start, 1);
		t.equal(r.end, 1);
		t.end();
	});

	t.test('works with left replacements', function (t) {
		// "he[llo wor]ld"
		// REPLACE 1 at 0 with "abc"
		var r = adjustRange({ start: 2, end: 9 }, 0, 1, 3);
		t.equal(r.start, 4);
		t.equal(r.end, 11);
		t.end();
	});

	t.test('works with left replacements touching range start', function (t) {
		// "he[llo wor]ld"
		// REPLACE 2 at 0 with "abc"
		var r = adjustRange({ start: 2, end: 9 }, 0, 2, 3);
		t.equal(r.start, 3);
		t.equal(r.end, 10);
		t.end();
	});

	t.test('works with left replacements crossing range start', function (t) {
		// "he[llo wor]ld"
		// REPLACE 3 at 0 with "abcde"
		var r = adjustRange({ start: 2, end: 9 }, 0, 3, 5);
		t.equal(r.start, 5);
		t.equal(r.end, 11);

		// "he[llo wor]ld"
		// REPLACE 8 at 1 with "a"
		r = adjustRange({ start: 2, end: 9 }, 1, 8, 1);
		t.equal(r.start, 2);
		t.equal(r.end, 2);
		t.end();
	});

	t.test('works with middle replacements touching range start', function (t) {
		// "he[llo wor]ld"
		// REPLACE 1 at 2 with "abc"
		var r = adjustRange({ start: 2, end: 9 }, 2, 1, 3);
		t.equal(r.start, 2);
		t.equal(r.end, 11);
		t.end();
	});

	t.test('works with middle replacements', function (t) {
		// "he[llo wor]ld"
		// REPLACE 5 at 3 with "12345678"
		var r = adjustRange({ start: 2, end: 9 }, 2, 5, 8);
		t.equal(r.start, 2);
		t.equal(r.end, 12);
		t.end();
	});

	t.test('works with middle replacements touching range end', function (t) {
		// "he[llo wor]ld"
		// REPLACE 2 at 7 with "abcde"
		var r = adjustRange({ start: 2, end: 9 }, 7, 2, 5);
		t.equal(r.start, 2);
		t.equal(r.end, 12);
		t.end();
	});

	t.test('works with middle replacements crossing range end', function (t) {
		// "he[llo wor]ld"
		// REPLACE 3 at 7 with "abcde"
		var r = adjustRange({ start: 2, end: 9 }, 7, 3, 5);
		t.equal(r.start, 2);
		t.equal(r.end, 7);
		t.end();
	});

	t.test('works with right replacements touching range end', function (t) {
		// "he[llo wor]ld"
		// REPLACE 1 at 9 with "abc"
		var r = adjustRange({ start: 2, end: 9 }, 9, 1, 3);
		t.equal(r.start, 2);
		t.equal(r.end, 9);
		t.end();
	});

	t.test('works with right replacements', function (t) {
		// "he[llo wor]ld"
		// REPLACE 1 at 10 with "abc"
		var r = adjustRange({ start: 2, end: 9 }, 10, 1, 3);
		t.equal(r.start, 2);
		t.equal(r.end, 9);
		t.end();
	});

	t.test('works with replacements covering range', function (t) {
		// "he[llo wor]ld"
		// REPLACE 7 at 2 with "a"
		var r = adjustRange({ start: 2, end: 9 }, 2, 7, 1);
		t.equal(r.start, 2);
		t.equal(r.end, 3);

		// "he[llo wor]ld"
		// REPLACE 9 at 1 with "abc"
		r = adjustRange({ start: 2, end: 9 }, 1, 9, 3);
		t.equal(r.start, 1);
		t.equal(r.end, 1);
		t.end();
	});

	t.end();
});
