var tap = require('tap');
var jot = require('..');

tap.test('selection', function (t) {

	t.test('can be constructed', function (t) {
		var op = new jot.SELECT('x', null);

		var opObj = new jot.SELECT({ x: { start: 1, end: 3 }});
		var opPair = new jot.SELECT('x', { start: 1, end: 3 });

		t.deepEqual(opObj.toJSON(), opPair.toJSON());
		t.end();
	});

	t.test('does not change value', function (t) {
		var doc = { hello: 'world' };
		var meta = { in: {} };
		var op = new jot.APPLY('hello', new jot.SELECT('x', { start: 1, end: 3 }));
		var newDoc = op.apply(doc, meta);

		t.deepEqual(newDoc, doc);
		t.end();
	});

	t.test('sets meta correctly', function (t) {
		var doc = { hello: 'world' };
		var meta = { in: {} };
		var op = new jot.APPLY('hello', new jot.SELECT('x', { start: 1, end: 3 }));

		op.apply(doc, meta);

		t.deepEqual(meta.out, {
			selections: {
				'/hello': {
					x: { start: 1, end: 3 },
				},
			},
		});
		t.end();
	});

	t.test('works with splices in a list', function (t) {
		var doc = { hello: 'world' };
		var meta = { in: {} };
		var op = new jot.LIST([
			new jot.APPLY('hello', new jot.SPLICE(0, 0, '1')),
			new jot.APPLY('hello', new jot.SELECT('x', { start: 1, end: 1 })),
			new jot.APPLY('hello', new jot.SPLICE(1, 0, '2')),
			new jot.APPLY('hello', new jot.SELECT('x', { start: 2, end: 2 })),
		]).simplify();

		var newDoc = op.apply(doc, meta);

		t.deepEqual(newDoc, { hello: '12world' });
		t.deepEqual(meta.out, {
			selections: {
				'/hello': {
					x: { start: 2, end: 2 },
				},
			},
		});
		t.end();
	});

	t.test('works with multiple-hunk splices', function (t) {
		// test applying multiple-hunk splices on existing document and selections
		var doc = 'abc def ghi';
		var meta = {
			in: {
				selections: {
					'': {
						a: { start: 1, end: 2 },
						b: { start: 9, end: 10 },
					},
				},
			},
		};
		var op = new jot.LIST([
			new jot.SPLICE(5, 0, '-'),
			new jot.SPLICE(7, 0, '-'),
		]).simplify();

		var newDoc = op.apply(doc, meta);

		t.equal(newDoc, 'abc d-e-f ghi');
		t.deepEqual(meta.out, {
			selections: {
				'': {
					a: { start: 1, end: 2 },
					b: { start: 11, end: 12 },
				},
			},
		});
		t.end();
	});

	t.test('rebase preserves intentions 1', function (t) {
		var doc = 'aaa bb ccc';

		var alice = new jot.LIST([
			new jot.SELECT('a', { start: 1, end: 2 }),
			new jot.SELECT('c', { start: 8, end: 9 }),
		]).simplify();
		var metaAlice = { in: {} };
		var docAlice = alice.apply(doc, metaAlice);

		t.equal(docAlice, 'aaa bb ccc');
		t.deepEqual(metaAlice.out, {
			selections: {
				'': {
					a: { start: 1, end: 2 },
					c: { start: 8, end: 9 },
				},
			},
		});

		var bob = new jot.LIST([
			new jot.SPLICE(5, 0, 'xxx'),
			new jot.SELECT('b', { start: 8, end: 8 }),
		]).simplify();
		var metaBob = { in: {} };
		var docBob = bob.apply(doc, metaBob);

		t.equal(docBob, 'aaa bxxxb ccc');
		t.deepEqual(metaBob.out, {
			selections: {
				'': {
					b: { start: 8, end: 8 },
				},
			},
		});

		var bobRebaseAlice = bob.rebase(alice, { document: doc });
		var metaBobRebaseAlice = { in: metaAlice.out };
		var docBobRebaseAlice = bobRebaseAlice.apply(docAlice, metaBobRebaseAlice);

		t.equal(docBobRebaseAlice, 'aaa bxxxb ccc');
		t.deepEqual(metaBobRebaseAlice.out, {
			selections: {
				'': {
					a: { start: 1, end: 2 },
					b: { start: 8, end: 8 },
					c: { start: 11, end: 12 },
				},
			},
		});

		var aliceRebaseBob = alice.rebase(bob, { document: doc });
		var metaAliceRebaseBob = { in: metaBob.out };
		var docAliceRebaseBob = aliceRebaseBob.apply(docBob, metaAliceRebaseBob);

		t.equal(docAliceRebaseBob, 'aaa bxxxb ccc');
		t.deepEqual(metaAliceRebaseBob.out, {
			selections: {
				'': {
					a: { start: 1, end: 2 },
					b: { start: 8, end: 8 },
					c: { start: 11, end: 12 },
				},
			},
		});

		t.end();
	});

	t.test('rebase preserves intentions 2', function (t) {
		var doc = 'one \ntwo \nthree \n';
		var meta = {
			in: {
				selections: {
					'': {
						alice: { start: 0, end: 0 },
						bob: { start: 17, end: 17 },
					},
				},
			},
		};

		var alice = new jot.LIST([
			new jot.SPLICE(4, 0, 'orange'),
			new jot.SELECT('alice', { start: 10, end: 10 }),
		]).simplify();
		var metaAlice = Object.assign({}, meta);
		var docAlice = alice.apply(doc, metaAlice);

		t.equal(docAlice, 'one orange\ntwo \nthree \n');
		t.deepEqual(metaAlice.out, {
			selections: {
				'': {
					alice: { start: 10, end: 10 },
					bob: { start: 23, end: 23 },
				},
			},
		});

		var bob = new jot.LIST([
			new jot.SPLICE(9, 0, 'bananas'),
			new jot.SELECT('bob', { start: 16, end: 16 }),
		]).simplify();
		var metaBob = Object.assign({}, meta);
		var docBob = bob.apply(doc, metaBob);

		t.equal(docBob, 'one \ntwo bananas\nthree \n');
		t.deepEqual(metaBob.out, {
			selections: {
				'': {
					alice: { start: 0, end: 0 },
					bob: { start: 16, end: 16 },
				},
			},
		});

		var bobRebaseAlice = bob.rebase(alice, { document: doc });
		var metaBobRebaseAlice = { in: metaAlice.out };
		var docBobRebaseAlice = bobRebaseAlice.apply(docAlice, metaBobRebaseAlice);

		t.equal(docBobRebaseAlice, 'one orange\ntwo bananas\nthree \n');
		t.deepEqual(metaBobRebaseAlice.out, {
			selections: {
				'': {
					alice: { start: 10, end: 10 },
					bob: { start: 22, end: 22 },
				},
			},
		});

		var aliceRebaseBob = alice.rebase(bob, { document: doc });
		var metaAliceRebaseBob = { in: metaBob.out };
		var docAliceRebaseBob = aliceRebaseBob.apply(docBob, metaAliceRebaseBob);

		t.equal(docAliceRebaseBob, 'one orange\ntwo bananas\nthree \n');
		t.deepEqual(metaAliceRebaseBob.out, {
			selections: {
				'': {
					alice: { start: 10, end: 10 },
					bob: { start: 22, end: 22 },
				},
			},
		});

		t.end();
	});

	t.test('rebase preserves intentions 3', function (t) {
		var doc = 'one \ntwo \nthree \n';
		var meta = {
			in: {
				selections: {
					'': {
						alice: { start: 0, end: 0 },
						bob: { start: 17, end: 17 },
					},
				},
			},
		};

		var alice = new jot.LIST([
			new jot.SELECT('alice', { start: 4, end: 4 }),
			new jot.SPLICE(4, 0, 'o'),
			new jot.SELECT('alice', { start: 5, end: 5 }),
			new jot.SPLICE(5, 0, 'r'),
			new jot.SELECT('alice', { start: 6, end: 6 }),
			new jot.SPLICE(6, 0, 'a'),
			new jot.SELECT('alice', { start: 7, end: 7 }),
			new jot.SPLICE(7, 0, 'n'),
			new jot.SELECT('alice', { start: 8, end: 8 }),
			new jot.SPLICE(8, 0, 'g'),
			new jot.SELECT('alice', { start: 9, end: 9 }),
			new jot.SPLICE(9, 0, 'e'),
			new jot.SELECT('alice', { start: 10, end: 10 }),
		]).simplify();
		var metaAlice = Object.assign({}, meta);
		var docAlice = alice.apply(doc, metaAlice);

		t.equal(docAlice, 'one orange\ntwo \nthree \n');
		t.deepEqual(metaAlice.out, {
			selections: {
				'': {
					alice: { start: 10, end: 10 },
					bob: { start: 23, end: 23 },
				},
			},
		});

		var bob = new jot.LIST([
			new jot.SELECT('bob', { start: 9, end: 9 }),
			new jot.SPLICE(9, 0, 'b'),
			new jot.SELECT('bob', { start: 10, end: 10 }),
			new jot.SPLICE(10, 0, 'a'),
			new jot.SELECT('bob', { start: 11, end: 11 }),
			new jot.SPLICE(11, 0, 'n'),
			new jot.SELECT('bob', { start: 12, end: 12 }),
			new jot.SPLICE(12, 0, 'a'),
			new jot.SELECT('bob', { start: 13, end: 13 }),
			new jot.SPLICE(13, 0, 'n'),
			new jot.SELECT('bob', { start: 14, end: 14 }),
			new jot.SPLICE(14, 0, 'a'),
			new jot.SELECT('bob', { start: 15, end: 15 }),
			new jot.SPLICE(15, 0, 's'),
			new jot.SELECT('bob', { start: 16, end: 16 }),
		]).simplify();
		var metaBob = Object.assign({}, meta);
		var docBob = bob.apply(doc, metaBob);

		t.equal(docBob, 'one \ntwo bananas\nthree \n');
		t.deepEqual(metaBob.out, {
			selections: {
				'': {
					alice: { start: 0, end: 0 },
					bob: { start: 16, end: 16 },
				},
			},
		});

		var bobRebaseAlice = bob.rebase(alice, { document: doc });
		var metaBobRebaseAlice = { in: metaAlice.out };
		var docBobRebaseAlice = bobRebaseAlice.apply(docAlice, metaBobRebaseAlice);

		t.equal(docBobRebaseAlice, 'one orange\ntwo bananas\nthree \n');
		t.deepEqual(metaBobRebaseAlice.out, {
			selections: {
				'': {
					alice: { start: 10, end: 10 },
					bob: { start: 22, end: 22 },
				},
			},
		});

		var aliceRebaseBob = alice.rebase(bob, { document: doc });
		var metaAliceRebaseBob = { in: metaBob.out };
		var docAliceRebaseBob = aliceRebaseBob.apply(docBob, metaAliceRebaseBob);

		t.equal(docAliceRebaseBob, 'one orange\ntwo bananas\nthree \n');
		t.deepEqual(metaAliceRebaseBob.out, {
			selections: {
				'': {
					alice: { start: 10, end: 10 },
					bob: { start: 22, end: 22 },
				},
			},
		});

		t.end();
	});

	t.end();
});
