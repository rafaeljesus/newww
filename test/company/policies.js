var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect;

var server;

// prepare the server
before(function (done) {
  require('../fixtures/setupServer')(function (obj) {
    server = obj;
    done();
  });
});

after(function (done) {
  server.stop(done);
});

describe('Viewing policies', function () {
  it('starts with the policies index page', function (done) {
    var opts = {
      url: '/policies'
    };

    server.inject(opts, function (resp) {
      var source = resp.request.response.source;
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
      var source = resp.request.response.source;
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
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/not-found');
      done();
    });
  });

  it('rejects any non-alphanumeric-string', function (done) {
    var opts = {
      url: '/policies/..%2f..%2fsomething'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(404);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/not-found');
      done();
    });
  });
});