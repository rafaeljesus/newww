var Lab = require('lab'),
    describe = Lab.experiment,
    before = Lab.before,
    it = Lab.test,
    expect = Lab.expect;

var server, serverResponse, source;

before(function (done) {
  server = require('./fixtures/setupServer')(done);

  server.ext('onPreResponse', function (request, next) {
    source = request.response.source;
    next();
  });
});

describe('Getting to the whoshiring page', function () {
  it('gets there, no problem', function (done) {
    var opts = {
      url: '/whoshiring'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('whoshiring');
      done();
    });
  });

  it('has all the pieces', function (done) {
    expect(source.context.hiring).to.exist;
    expect(source.context.companies).to.exist;
    expect(source.context.title).to.exist;
    done();
  });
});