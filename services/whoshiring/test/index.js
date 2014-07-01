var Lab = require('lab')
  , describe = Lab.experiment
  , before = Lab.before
  , it = Lab.test
  , expect = Lab.expect;

var Hapi = require('hapi'),
    whoshiring = require('../index.js'),
    whos_hiring = require('../../../static/whos_hiring.json');

var server;

before(function (done) {
  server = Hapi.createServer();
  server.pack.register(whoshiring, done);
});


describe('Getting all the whoshiring entries', function () {
  it('should be random', function (done) {
    var all = server.methods.getAllWhosHiring();

    var shuffled = all.map(function (c) {
      return c.id;
    }).sort();

    var original = Object.keys(whos_hiring).sort();

    expect(shuffled).to.eql(original);
    done();
  });
});

describe('Getting a random whoshiring entry', function () {
  it('should yield a different one regularly', function (done) {
    var first = server.methods.getRandomWhosHiring(),
        second = server.methods.getRandomWhosHiring(),
        third = server.methods.getRandomWhosHiring();

    if (first === second) {
      expect(first).to.not.eql(third);
    } else if (first === third) {
      expect(first).to.not.eql(second);
    } else {
      expect(second).to.not.eql(third);
    }

    done();
  });
});
