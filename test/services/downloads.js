var expect = require('code').expect,
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  
  nock = require('nock'),
  downloadsHost = 'https://api.npmjs.com',
  fixtures = require("../fixtures");

var Hapi = require('hapi'),
  downloads = require('../../services/downloads'),
  metrics = require('../../adapters/metrics')();

var server;

before(function(done) {
  server = new Hapi.Server();
  server.connection({
    host: 'localhost',
    port: '8000'
  });

  server.register([{
    register: downloads,
    options: {
      url: downloadsHost + "/downloads/"
    }
  }], function() {
    server.start(done);
  });
});

describe('Getting download counts for a specific package', function() {
  it('returns empty counts with incorrect parameters', function(done) {

    var mock = nock(downloadsHost)
      .get('/downloads/point/last-something/request')
      .reply(200, {});

    server.methods.downloads.getDownloadsForPackage('last-something', 'point', 'request', function(er, data) {
      mock.done();
      expect(er).to.not.exist();
      expect(data).to.equal(0);
      done();
    });
  });

  it('returns null data for an invalid (non-existent) package name', function(done) {

    var mock = nock(downloadsHost)
      .get('/downloads/point/last-month/bajskhl')
      .reply(200, null);

    server.methods.downloads.getDownloadsForPackage('last-month', 'point', 'bajskhl', function(er, data) {
      mock.done();
      expect(data).to.exist();
      expect(data).to.equal(0);
      done();
    });
  });

  it('gets a point with valid parameters', function(done) {

    var mock = nock(downloadsHost)
      .get('/downloads/point/last-month/request')
      .reply(200, {
        "downloads": 6089992,
        "start": "2015-01-03",
        "end": "2015-02-01",
        "package": "request"
      });

    server.methods.downloads.getDownloadsForPackage('last-month', 'point', 'request', function(er, data) {
      mock.done();
      expect(er).to.be.null();
      expect(data).to.exist();
      expect(data).to.be.above(0);
      expect(data).to.not.be.null();
      done();
    });
  });

  it('gets a range with valid parameters', function(done) {

    var mock = nock(downloadsHost)
      .get('/downloads/range/last-month/request')
      .reply(200, {
        "downloads": [{
          "day": "2015-01-03",
          "downloads": 89576
        }],
        "start": "2015-01-03",
        "end": "2015-02-01",
        "package": "request"
      });

    server.methods.downloads.getDownloadsForPackage('last-month', 'range', 'request', function(er, data) {
      mock.done();
      expect(er).to.be.null();
      expect(data).to.be.an.array();
      expect(data[0]).to.contain('day');
      expect(data[0]).to.contain('downloads');
      done();
    });
  });
});

describe('Getting all download counts for a specific package', function() {
  it('returns null data for an invalid (non-existent) package name', function(done) {

    var mock = nock(downloadsHost)
      .get('/downloads/point/last-day/bajskhl')
      .reply(200, null)
      .get('/downloads/point/last-week/bajskhl')
      .reply(200, null)
      .get('/downloads/point/last-month/bajskhl')
      .reply(200, null);

    server.methods.downloads.getAllDownloadsForPackage('bajskhl', function(er, data) {
      mock.done();
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

  it('works with valid parameters', function(done) {

    var mock = nock(downloadsHost)
      .get('/downloads/point/last-day/request')
      .reply(200, fixtures.downloads.request.day)
      .get('/downloads/point/last-week/request')
      .reply(200, fixtures.downloads.request.week)
      .get('/downloads/point/last-month/request')
      .reply(200, fixtures.downloads.request.month);

    server.methods.downloads.getAllDownloadsForPackage('request', function(er, data) {
      mock.done();
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

describe('Getting download counts for all packages', function() {
  it('works with valid parameters', function(done) {

    var mock = nock(downloadsHost)
      .get('/downloads/point/last-day/')
      .reply(200, {
        "downloads": 13,
        "start": "2015-02-01",
        "end": "2015-02-01"
      })
      .get('/downloads/point/last-week/')
      .reply(200, {
        "downloads": 200,
        "start": "2015-01-26",
        "end": "2015-02-01"
      })
      .get('/downloads/point/last-month/')
      .reply(200, {
        "downloads": 500,
        "start": "2015-01-03",
        "end": "2015-02-01"
      });

    server.methods.downloads.getAllDownloads(function(er, data) {
      mock.done();
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
