var OverlapKeeper = require('../src/collision/OverlapKeeper');

module.exports = {
	construct: function(test){
		new OverlapKeeper();
		test.done();
	},

	set: function(test){
		var keeper = new OverlapKeeper();

		keeper.set(1, 2);
		test.deepEqual(keeper.current, [keeper.getKey(1,2)]);

		keeper.set(3, 2);
		test.deepEqual(keeper.current, [keeper.getKey(1,2), keeper.getKey(3,2)]);

		keeper.set(3, 1);
		test.deepEqual(keeper.current, [keeper.getKey(1,2), keeper.getKey(1,3), keeper.getKey(3,2)]);

		test.done();
	},

	getDiff: function(test){
		var keeper = new OverlapKeeper();

		keeper.set(1, 2);
		keeper.set(3, 2);
		keeper.set(3, 1);

		keeper.tick();

		keeper.set(1, 2);
		keeper.set(3, 2);
		keeper.set(3, 1);

		var additions = [];
		var removals = [];
		keeper.getDiff(additions, removals);

		test.equal(additions.length, 0);
		test.equal(removals.length, 0);

		keeper.tick();

		keeper.set(1, 2);
		keeper.getDiff(additions, removals);
		test.equal(additions.length, 0);
		test.deepEqual(removals, [1,3,2,3]);

		keeper.tick();

		keeper.set(1, 2);
		keeper.set(1, 2);

		additions = [];
		removals = [];
		keeper.getDiff(additions, removals);
		test.equal(additions.length, 0, 'should handle duplicate entries');
		test.equal(removals.length, 0, 'should handle duplicate entries');

		keeper.set(3, 2);
		keeper.set(3, 1);
		additions = [];
		removals = [];
		keeper.getDiff(additions, removals);
		test.deepEqual(additions, [1,3,2,3]);

		keeper.tick();

		keeper.set(4, 2);
		keeper.set(4, 1);

		additions = [];
		removals = [];
		keeper.getDiff(additions, removals);
		test.deepEqual(additions, [1,4,2,4]);
		test.deepEqual(removals, [1,2,1,3,2,3]);

		test.done();
	}
};