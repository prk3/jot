const tap = require('tap');
const jot = require('..');

tap.test('lists', function (t) {

	t.test('optimize SELECT + PATCH chains', function (t) {
		var long = new jot.LIST([
			new jot.SELECT('b', { start: 100, end: 110 }),
			new jot.SELECT('a', { start: 9, end: 9 }),
			new jot.SPLICE(9, 0, 'b'),
			new jot.SELECT('a', { start: 10, end: 10 }),
			new jot.SPLICE(10, 0, 'a'),
			new jot.SELECT('a', { start: 11, end: 11 }),
			new jot.SPLICE(11, 0, 'n'),
			new jot.SELECT('a', { start: 12, end: 12 }),
			new jot.SPLICE(12, 0, 'a'),
			new jot.SELECT('a', { start: 13, end: 13 }),
			new jot.SPLICE(13, 0, 'n'),
			new jot.SELECT('a', { start: 14, end: 14 }),
			new jot.SPLICE(14, 0, 'a'),
			new jot.SELECT('a', { start: 15, end: 15 }),
			new jot.SPLICE(15, 0, 's'),
			new jot.SELECT('a', { start: 16, end: 16 }),
		]);

		var short = new jot.LIST([
			new jot.SPLICE(9, 0, 'bananas'),
			new jot.SELECT({
				a: { start: 16, end: 16 },
				b: { start: 107, end: 117 },
			}),
		]);

		t.deepEqual(long.simplify().toJSON(), short.toJSON());
		t.end();
	});

	t.end();
});
