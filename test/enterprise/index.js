var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect;

var server;


before(function(done) {
  require('../mocks/server')(function(obj) {
    server = obj;
    done();
  });
});

after(function(done) {
  server.stop(done);
});

describe('Getting to the enterprise page', function() {
  it('gets there, no problem', function(done) {
    var opts = {
      url: '/enterprise'
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('enterprise/index');
      expect(source.context.title).to.equal('npm On-Site');
      done();
    });
  });
});
