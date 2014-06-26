var Lab = require('lab')
  , describe = Lab.experiment
  , before = Lab.before
  , it = Lab.test
  , expect = Lab.expect;

var Hapi = require('hapi'),
    registry = require('../facets/registry');

var server;

before(function (done) {
  server = Hapi.createServer();
  server.pack.register(registry, done);
});

describe('Registry is routing properly', function () {
  it('calls all the right routes', function (done) {
    var table = server.table();

    expect(table).to.have.length(4);
    expect(table[0].path).to.equal('/search');
    expect(table[1].path).to.equal('/keyword/{kw}');
    expect(table[2].path).to.equal('/package/{package}/{version?}');
    expect(table[3].path).to.equal('/browse/{p*}');


    done();
  })
})