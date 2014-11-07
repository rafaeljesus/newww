var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect;

var server, serverResponse, source, ctx;

before(function (done) {
  server = require('../fixtures/setupServer')(done);

  server.ext('onPreResponse', function (request, next) {
    source = request.response.source;
    ctx = source.context;
    next();
  });
});

describe('Getting to the enterprise page', function () {
  it('gets there, no problem', function (done) {
    var opts = {
      url: '/enterprise'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('enterprise/index');
      done();
    });
  });

  it('has all the pieces', function (done) {
    expect(ctx.title).to.equal('npm Enterprise');
    done();
  });
});
