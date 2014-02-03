var TupleDictionary = require('../src/utils/TupleDictionary');

exports.set = function(test){
    var t = new TupleDictionary();

    t.set(1,2,'lol');
    test.equal(t.data['1-2'],'lol');

    t.set(2,1,'lol2');
    test.equal(t.data['1-2'],'lol2');

    test.done();
};

exports.get = function(test){
    var t = new TupleDictionary();

    t.set(1,2,'1');
    t.set(3,2,'2');

    test.equal(t.data['1-2'],t.get(1,2));
    test.equal(t.data['1-2'],t.get(2,1));

    test.equal(t.data['2-3'],t.get(2,3));
    test.equal(t.data['2-3'],t.get(3,2));

    test.done();
};

exports.reset = function(test){
    var t = new TupleDictionary(),
        empty = new TupleDictionary();

    t.reset();
    t.set(1,2,'1');
    t.reset();
    test.deepEqual(t.data,empty.data);

    test.done();
};
