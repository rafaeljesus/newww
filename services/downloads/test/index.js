var Lab = require('lab'),
    describe = Lab.experiment,
    before = Lab.before,
    it = Lab.test,
    expect = Lab.expect;

var Hapi = require('hapi'),
    downloads = require('../index.js'),
    config = require('../../../config').metrics,
    MetricsClient = require('../../../adapters/metrics');

var server;

before(function (done) {
  server = Hapi.createServer('localhost', '8000');

  var metrics = new MetricsClient(config);

  server.pack.register([
    {
      plugin: downloads,
      options: {url: 'https://api.npmjs.org/downloads/'}
    }
  ], function () {
    server.start(done);
  });
});

describe('Getting download counts for a specific package', function () {
  it('fails with incorrect parameters', function (done) {
    server.methods.downloads.getDownloadsForPackage('last-something', 'point', 'request', function (er, data) {
      expect(er.error).to.equal('Invalid period specified');
      done();
    });
  });

  it('returns null data for an invalid (non-existent) package name', function (done) {
    server.methods.downloads.getDownloadsForPackage('last-month', 'point', 'bajskhl', function (er, data) {
      expect(data).to.exist;
      expect(data).to.equal(0);
      done();
    });
  });

  it('gets a point with valid parameters', function (done) {
    server.methods.downloads.getDownloadsForPackage('last-month', 'point', 'request', function (er, data) {
      expect(er).to.be.null;
      expect(data).to.exist;
      expect(data).to.be.gt(0);
      expect(data).to.not.be.null;
      done();
    });
  });

  it('gets a range with valid parameters', function (done) {
    server.methods.downloads.getDownloadsForPackage('last-month', 'range', 'request', function (er, data) {
      expect(er).to.be.null;
      expect(data).to.be.an('array');
      expect(data[0]).to.have.property('day');
      expect(data[0]).to.have.property('downloads');
      done();
    });
  });
});

describe('Getting all download counts for a specific package', function () {
  it('returns null data for an invalid (non-existent) package name', function (done) {
    server.methods.downloads.getAllDownloadsForPackage('bajskhl', function (er, data) {
      expect(data).to.exist;
      expect(data).to.have.property('day');
      expect(data).to.have.property('week');
      expect(data).to.have.property('month');
      expect(data.day).to.equal(0);
      expect(data.week).to.equal(0);
      expect(data.month).to.equal(0);
      done();
    });
  });

  it('works with valid parameters', function (done) {
    server.methods.downloads.getAllDownloadsForPackage('request', function (er, data) {
      expect(data).to.exist;
      expect(data).to.have.property('day');
      expect(data).to.have.property('week');
      expect(data).to.have.property('month');
      expect(data.day).to.be.gt(0);
      expect(data.week).to.be.gt(0);
      expect(data.month).to.be.gt(0);
      done();
    });
  });
});

describe('Getting download counts for all packages', function () {
  it('works with valid parameters', function (done) {
    server.methods.downloads.getAllDownloads(function (er, data) {
      expect(data).to.exist;
      expect(data).to.have.property('day');
      expect(data).to.have.property('week');
      expect(data).to.have.property('month');
      expect(data.day).to.be.gt(0);
      expect(data.week).to.be.gt(0);
      expect(data.month).to.be.gt(0);
      done();
    });
  });
});

