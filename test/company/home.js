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

describe('Getting to the home page', function () {
  it('gets there, no problem', function (done) {
    var opts = {
      url: '/'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('company/index');
      done();
    });
  });

  it('handles an API call timeout', function (done) {
    var getDependedUponOriginal = server.methods.registry.getDependedUpon,
      opts = {
        url: '/'
      };

    // prior to our fix for timeouts on the home-page,
    // this method would cause getDependedUpon to never
    // execute its callback, resulting in the homepage
    // timing out.
    process.env.API_TIMEOUT = '500';
    server.methods.registry.getDependedUpon = function() {};

    server.inject(opts, function (resp) {
      server.methods.registry.getDependedUpon = getDependedUponOriginal;
      return done();
    });
  });

  it('has all the pieces', function (done) {
    expect(source.context.updated).to.exist;
    expect(source.context.depended).to.exist;
    expect(source.context.starred).to.exist;
    done();
  });
});
