var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    it = lab.test,
    expect = Code.expect,
    nock = require("nock"),
    fixtures = require("../fixtures"),
    Download;

beforeEach(function (done) {
  Download = new (require("../../models/download"))({
    host: "https://fake-download.com",
    timeout: 50,
  });
  done();
});

afterEach(function (done) {
  Download = null;
  done();
});

describe("Download", function(){

  describe("initialization", function() {
    it("defaults to process.env.DOWNLOADS_API as host", function(done) {
      var DOWNLOADS_API_OLD = process.env.DOWNLOADS_API;
      process.env.DOWNLOADS_API = "https://envy-dl.com/";
      expect(new (require("../../models/download"))().host).to.equal('https://envy-dl.com/');
      process.env.DOWNLOADS_API = DOWNLOADS_API_OLD;
      done();
    });

    it("accepts a custom host", function(done) {
      expect(Download.host).to.equal('https://fake-download.com');
      done();
    });
  });

  describe("getDaily()", function() {

    describe("when package is specified", function() {

      it("gets daily counts for a specific package, if specified", function(done) {
        var mock = nock(Download.host)
          .get('/point/last-day/request')
          .reply(200, fixtures.downloads.request['last-day']);

        Download.getDaily("request", function(err, result) {
          mock.done();
          expect(err).to.be.null();
          expect(result).to.exist();
          expect(result.downloads).to.equal(13);
          done();
        });
      });

      it("generates an error message when the request fails", function(done){
        var mock = nock(Download.host)
          .get('/point/last-day/request')
          .reply(400);

        Download.getDaily("request", function(err, result) {
          mock.done();
          expect(err).to.exist();
          expect(err.message).to.equal("error getting downloads for period day for request");
          expect(result).to.not.exist();
          done();
        });
      });

    })

    describe("when package is not specified", function(){

      it("gets daily counts for all packages", function(done) {
        var mock = nock(Download.host)
          .get('/point/last-day')
          .reply(200, fixtures.downloads.all['last-day']);

        Download.getDaily(function(err, result) {
          mock.done();
          expect(err).to.be.null();
          expect(result).to.exist();
          expect(result.downloads).to.equal(41695496);
          done();
        });
      });

      it("generates an error message when the request fails", function(done){
        var mock = nock(Download.host)
          .get('/point/last-day')
          .reply(400);

        Download.getDaily(function(err, result) {
          mock.done();
          expect(err).to.exist();
          expect(err.message).to.equal("error getting downloads for period day for all packages");
          expect(result).to.not.exist();
          done();
        });
      });

      it("returns an error if request duration exceeds specified timeout", function(done){
        var mock = nock(Download.host)
          .get('/point/last-day')
          .delayConnection(51)
          .reply(200, fixtures.downloads.all['last-day']);

        Download.getDaily(function(err, result) {
          mock.done();
          expect(err).to.exist();
          expect(err.code).to.equal('ETIMEDOUT');
          expect(result).to.not.exist();
          done();
        });

      });
    });
  });

  describe("getWeekly()", function() {

    it("gets weekly counts for a specific package, if specified", function(done) {
      var mock = nock(Download.host)
        .get('/point/last-week/request')
        .reply(200, fixtures.downloads.request['last-week']);

      Download.getWeekly("request", function(err, result) {
        mock.done();
        expect(err).to.be.null();
        expect(result).to.exist();
        expect(result.downloads).to.equal(200);
        done();
      });
    });

    it("gets weekly counts for all packages if name is not specified", function(done) {
      var mock = nock(Download.host)
        .get('/point/last-week')
        .reply(200, fixtures.downloads.all['last-week']);

      Download.getWeekly(function(err, result) {
        mock.done();
        expect(err).to.be.null();
        expect(result).to.exist();
        expect(result.downloads).to.equal(249027204);
        done();
      });
    });

  });

  describe("getMonthly()", function() {

    it("gets monthly counts for a specific package, if specified", function(done) {
      var mock = nock(Download.host)
        .get('/point/last-month/request')
        .reply(200, fixtures.downloads.request['last-month']);

      Download.getMonthly("request", function(err, result) {
        mock.done();
        expect(err).to.be.null();
        expect(result).to.exist();
        expect(result.downloads).to.equal(500);
        done();
      });
    });

    it("gets monthly counts for all packages if name is not specified", function(done) {
      var mock = nock(Download.host)
        .get('/point/last-month')
        .reply(200, fixtures.downloads.all['last-month']);

      Download.getMonthly(function(err, result) {
        mock.done();
        expect(err).to.be.null();
        expect(result).to.exist();
        expect(result.downloads).to.equal(1028113165);
        done();
      });
    });

  });

});
