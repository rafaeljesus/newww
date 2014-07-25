var Lab = require('lab')
  , describe = Lab.experiment
  , before = Lab.before
  , it = Lab.test
  , expect = Lab.expect;

var Hapi = require('hapi'),
    config = require('../../../config').metrics,
    metrics = require('../index.js');

var server;

before(function (done) {
  server = Hapi.createServer();
  server.pack.register({ plugin: metrics, options: config}, done);
});

describe('Adding metrics', function () {
  it('has functions', function (done) {
    // this service doesn't do much; it's simply a wrapper for the
    // much better tested numbat-emitter
    expect(server.methods).to.be.an.object;

    expect(server.methods.metrics.addMetric).to.be.a.function;
    expect(server.methods.metrics.addCouchLatencyMetric).to.exist;
    expect(server.methods.metrics.addPageLatencyMetric).to.exist;
    done();
  });
});
