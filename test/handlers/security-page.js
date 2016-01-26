var Lab = require('lab'),
  Code = require('code'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  server;

var requireInject = require('require-inject');
var redisMock = require('redis-mock');
var client = redisMock.createClient();

before(function(done) {
  requireInject.installGlobally('../mocks/server', {
    redis: redisMock
  })(function(obj) {
    server = obj;
    done();
  });
});

after(function(done) {
  server.stop(done);
});

describe('getting to the org marketing page', function() {
  it('redirects from /security to /policies/security', function(done) {
    var options = {
      url: "/security"
    };

    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(301);
      expect(resp.headers.location).to.equal('/policies/security');
      done();
    });
  });
});
