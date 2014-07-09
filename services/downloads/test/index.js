var Lab = require('lab')
  , describe = Lab.experiment
  , before = Lab.before
  , it = Lab.test
  , expect = Lab.expect;

var Hapi = require('hapi'),
    downloads = require('../index.js');

var server;

before(function (done) {
  server = Hapi.createServer();
  server.pack.register({
    plugin: downloads,
    options: {url: 'https://api.npmjs.org/downloads/'}
  }, done);
});

describe('Getting download counts for a specific package', function () {
  it('fails with missing parameters', function (done) {
    server.methods.getDownloadsForPackage('last-month', 'request', function (er, data) {
      expect(er.statusCode).to.equal(404);
      expect(er.error).to.equal('Not Found');
      done();
    });
  })

  it('fails with incorrect parameters', function (done) {
    server.methods.getDownloadsForPackage('last-something', 'point', 'request', function (er, data) {
      expect(er.error).to.equal('Invalid period specified');
      done();
    });
  });

  it('returns null data for an invalid (non-existent) package name', function (done) {
    server.methods.getDownloadsForPackage('last-month', 'point', 'bajskhl', function (er, data) {
      expect(data).to.exist;
      expect(data).to.equal(0);
      done();
    });
  });

  it('works with valid parameters', function (done) {
    server.methods.getDownloadsForPackage('last-month', 'point', 'request', function (er, data) {
      expect(data).to.exist;
      expect(data).to.be.gt(0);
      expect(data).to.not.be.null;
      done();
    });
  });
});

describe('Getting all download counts', function () {
  it('fails with incorrect period parameter', function (done) {
    server.methods.getAllDownloads('last-something', 'point', function (er, data) {
      expect(er.error).to.equal('Invalid period specified');
      done();
    });
  });

  it('fails with incorrect detail parameter', function (done) {
    server.methods.getAllDownloads('last-month', 'blerg', function (er, data) {
      expect(er.error).to.equal('Not Found');
      expect(er.statusCode).to.equal(404);
      done();
    });
  });

  it('works with valid parameters', function (done) {
    server.methods.getAllDownloads('last-month', 'point', function (er, data) {
      expect(data).to.exist;
      expect(data).to.be.gt(0);
      expect(data).to.not.be.null;
      done();
    });
  });
});

