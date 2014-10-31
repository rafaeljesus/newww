var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect;

var server, serverResponse, source;

before(function (done) {
  server = require('../fixtures/setupServer')(done);

  server.ext('onPreResponse', function (request, next) {
    source = request.response.source;
    next();
  });
});

describe('Viewing policies', function () {
  it('starts with the policies index page', function (done) {
    var opts = {
      url: '/policies'
    };

    server.inject(opts, function (resp) {
      var ctx = source.context;

      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('company/corporate');
      expect(ctx.md).to.include('These are the legal policies');
      done();
    });
  });

  it('goes to any policy that exists', function (done) {
    var opts = {
      url: '/policies/disputes'
    };

    server.inject(opts, function (resp) {
      var ctx = source.context;

      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('company/corporate');
      expect(ctx.md).to.include('Dispute Resolution');
      done();
    });
  });

  it('renders an error if the policy does not exist', function (done) {
    var opts = {
      url: '/policies/blarg'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(404);
      expect(source.template).to.equal('errors/notfound');
      done();
    });
  });
});