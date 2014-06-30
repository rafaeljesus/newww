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

describe('Getting to the home page', function () {
  it('gets there, no problem', function (done) {
    var opts = {
      url: '/'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('index');
      done();
    });
  });

  it('has all the pieces', function (done) {
    expect(source.context.updated).to.exist;
    expect(source.context.depended).to.exist;
    expect(source.context.starred).to.exist;
    expect(source.context.authors).to.exist;
    expect(source.context.hiring).to.exist;
    done();
  });
});