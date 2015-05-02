var fixtures = require("../fixtures"),
    nock = require("nock"),
    cheerio = require("cheerio"),
    expect = require('code').expect,
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    it = lab.test,

    server;

describe("monitoring", function(){

  before(function (done) {
    require('../mocks/server')(function (obj) {
      server = obj;
      done();
    });
  });

  after(function (done) {
    server.stop(done);
  });

  describe('GET /_monitor/ping"', function () {
    var resp;
    var options = {url: '/_monitor/ping'};

    before(function(done){
      server.inject(options, function (response) {
        resp = response
        done()
      })
    })

    it('returns a 200 status code', function (done) {
      expect(resp.statusCode).to.equal(200);
      done()
    })
  });

  describe('GET /_monitor/status"', function () {
    var resp;
    var options = {url: '/_monitor/status'};

    before(function(done){
      server.inject(options, function (response) {
        resp = response
        done()
      })
    })

    it('returns a 200 status code', function (done) {
      expect(resp.statusCode).to.equal(200);
      done()
    })

    it('returns a JSON object', function (done) {
      expect(resp.result).to.be.an.object();
      done()
    })

    it('returns ok status', function (done) {
      expect(resp.result.status).to.equal('ok');
      done()
    })

    it('returns a pid', function (done) {
      expect(resp.result.pid).to.be.a.number();
      done()
    })

    it('returns uptime', function (done) {
      expect(resp.result.uptime).to.be.a.number();
      done()
    })

    it('returns a correlationID', function (done) {
      expect(resp.result.correlationID).to.exist();
      done()
    })

    it('returns app version number', function (done) {
      expect(resp.result.version).to.exist();
      expect(resp.result.version).to.equal(require("../../package.json").version);
      done()
    })

    it('returns git head sha', function (done) {
      expect(resp.result.gitHead).to.exist();
      expect(resp.result.gitHead).to.match(/^\w+$/);
      expect(resp.result.gitHead.length).to.equal(40);
      done()
    })

  });

})
