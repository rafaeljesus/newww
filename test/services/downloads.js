var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect;

var Hapi = require('hapi'),
    downloads = require('../../services/downloads'),
    config = require('../../config'),
    metrics = require('../../adapters/metrics')(config.metrics);

var server;

before(function (done) {
  server = new Hapi.Server();
  server.connection({ host: 'localhost', port: '8000' });

  server.register([
    {
      register: downloads,
      options: {url: 'https://api.npmjs.org/downloads/'}
    }
  ], function () {
    server.start(done);
  });
});

describe('Getting download counts for a specific package', function () {
  it('returns empty counts with incorrect parameters', function (done) {
    server.methods.downloads.getDownloadsForPackage('last-something', 'point', 'request', function (er, data) {
      expect(er).to.not.exist();
      expect(data).to.equal(0);
      done();
    });
  });

  it('returns null data for an invalid (non-existent) package name', function (done) {
    server.methods.downloads.getDownloadsForPackage('last-month', 'point', 'bajskhl', function (er, data) {
      expect(data).to.exist();
      expect(data).to.equal(0);
      done();
    });
  });

  it('gets a point with valid parameters', function (done) {
    server.methods.downloads.getDownloadsForPackage('last-month', 'point', 'request', function (er, data) {
      expect(er).to.be.null();
      expect(data).to.exist();
      expect(data).to.be.above(0);
      expect(data).to.not.be.null();
      done();
    });
  });

  it('gets a range with valid parameters', function (done) {
    server.methods.downloads.getDownloadsForPackage('last-month', 'range', 'request', function (er, data) {
      expect(er).to.be.null();
      expect(data).to.be.an.array();
      expect(data[0]).to.contain('day');
      expect(data[0]).to.contain('downloads');
      done();
    });
  });
});

describe('Getting all download counts for a specific package', function () {
  it('returns null data for an invalid (non-existent) package name', function (done) {
    server.methods.downloads.getAllDownloadsForPackage('bajskhl', function (er, data) {
      expect(data).to.exist();
      expect(data).to.contain('day');
      expect(data).to.contain('week');
      expect(data).to.contain('month');
      expect(data.day).to.equal(0);
      expect(data.week).to.equal(0);
      expect(data.month).to.equal(0);
      done();
    });
  });

  it('works with valid parameters', function (done) {
    server.methods.downloads.getAllDownloadsForPackage('request', function (er, data) {
      expect(data).to.exist();
      expect(data).to.contain('day');
      expect(data).to.contain('week');
      expect(data).to.contain('month');
      expect(data.day).to.be.above(0);
      expect(data.week).to.be.above(0);
      expect(data.month).to.be.above(0);
      done();
    });
  });
});

describe('Getting download counts for all packages', function () {
  it('works with valid parameters', function (done) {
    server.methods.downloads.getAllDownloads(function (er, data) {
      expect(data).to.exist();
      expect(data).to.contain('day');
      expect(data).to.contain('week');
      expect(data).to.contain('month');
      expect(data.day).to.be.above(0);
      expect(data.week).to.be.above(0);
      expect(data.month).to.be.above(0);
      done();
    });
  });
});
