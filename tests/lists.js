const tap = require('tap');
const jot = require('..');

tap.test('lists', function (t) {

	t.test('optimize SELECT + PATCH chains', function (t) {
		var long = new jot.LIST([
			new jot.SELECT('a', { start: 0, end: 5 }),
			new jot.SELECT('b', { start: 20, end: 30 }),
			new jot.SELECT('c', { start: 10, end: 10 }),
			new jot.SPLICE(10, 0, 'h'),
			new jot.SELECT('c', { start: 11, end: 11 }),
			new jot.SPLICE(11, 0, 'i'),
			new jot.SELECT('c', { start: 12, end: 12 }),
			new jot.SPLICE(12, 0, '!'),
			new jot.SELECT('c', { start: 13, end: 13 }),
		]);

		var short = new jot.LIST([
			new jot.SPLICE(10, 0, 'hi!'),
			new jot.SELECT({
				a: { start: 0, end: 5 },
				b: { start: 23, end: 33 },
				c: { start: 13, end: 13 },
			}),
		]);

		t.deepEqual(long.simplify().toJSON(), short.toJSON());
		t.end();
	});

	t.test('optimize SELECT + PATCH chains (deletes)', function (t) {
		var long = new jot.LIST([
			new jot.SELECT('a', { start: 10, end: 15 }),
			new jot.SELECT('b', { start: 30, end: 40 }),
			new jot.SELECT('c', { start: 20, end: 20 }),
			new jot.SPLICE(19, 1, ''),
			new jot.SELECT('c', { start: 19, end: 19 }),
			new jot.SPLICE(18, 1, ''),
			new jot.SELECT('c', { start: 18, end: 18 }),
			new jot.SPLICE(17, 1, ''),
			new jot.SELECT('c', { start: 17, end: 17 }),
		]);

		var short = new jot.LIST([
			new jot.SPLICE(17, 3, ''),
			new jot.SELECT({
				a: { start: 10, end: 15 },
				b: { start: 27, end: 37 },
				c: { start: 17, end: 17 },
			}),
		]);

		t.deepEqual(long.simplify().toJSON(), short.toJSON());
		t.end();
	});

	t.test('optimize SELECT + PATCH chains (with multiple hunks)', function (t) {
		var long = new jot.LIST([
			new jot.SELECT('a', { start: 10, end: 15 }),
			new jot.SELECT('b', { start: 30, end: 40 }),
			new jot.SELECT('c', { start: 20, end: 20 }),
			new jot.LIST([
				new jot.SPLICE(20, 0, 'h'),
				new jot.SPLICE(22, 0, 'i'),
				new jot.SPLICE(24, 0, '!'),
			]).simplify(),
			new jot.SELECT('c', { start: 25, end: 25 }),
		]);

		var short = new jot.LIST([
			new jot.LIST([
				new jot.SPLICE(20, 0, 'h'),
				new jot.SPLICE(22, 0, 'i'),
				new jot.SPLICE(24, 0, '!'),
			]).simplify(),
			new jot.SELECT({
				a: { start: 10, end: 15 },
				b: { start: 33, end: 43 },
				c: { start: 25, end: 25 },
			}),
		]);

		t.deepEqual(long.simplify().toJSON(), short.toJSON());
		t.end();
	});

	t.end();
});
