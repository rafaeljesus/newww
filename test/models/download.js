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

      it("gets daily counts", function(done) {
        var mock = nock(Download.host)
          .get('/point/last-day/request')
          .reply(200, fixtures.downloads.request.day);

        Download.getDaily("request")
          .then(function(result) {
            expect(result).to.exist();
            expect(result.downloads).to.equal(13);
          })
          .catch(function(err) {
            expect(err).to.be.null();
          })
          .then(function() {
            mock.done();
            done();
          });

      });

      it("swallows errors and returns null when the request fails", function(done){
        var mock = nock(Download.host)
          .get('/point/last-day/request')
          .reply(400);

        Download.getDaily("request")
          .then(function(result) {
            expect(result).to.be.null();
            mock.done();
            done();
          });
      });

    })

    describe("when package is not specified", function(){

      it("gets daily counts for all packages", function(done) {
        var mock = nock(Download.host)
          .get('/point/last-day')
          .reply(200, fixtures.downloads.all.day);

        Download.getDaily()
          .then(function(result) {
            expect(result).to.exist();
            expect(result.downloads).to.equal(41695496);
          })
          .catch(function(err) {
            expect(err).to.be.null();
          })
          .then(function() {
            mock.done();
            done();
          });

      });

      it("returns null if request duration exceeds specified timeout", function(done){

        Download = new (require("../../models/download"))({
          host: "https://fake-download.com",
          timeout: 50,
        });

        var mock = nock(Download.host)
          .get('/point/last-day')
          .delayConnection(100)
          .reply(200, fixtures.downloads.all.day);

        Download.getDaily()
          .then(function(result) {
            expect(result).to.be.null();
            mock.done();
            done();
          });

      });
    });
  });

  describe("getWeekly()", function() {

    it("gets weekly counts for a specific package", function(done) {
      var mock = nock(Download.host)
        .get('/point/last-week/request')
        .reply(200, fixtures.downloads.request.week);

      Download.getWeekly("request")
        .then(function(result) {
          expect(result).to.exist();
          expect(result.downloads).to.equal(200);
        })
        .catch(function(err){
          expect(err).to.be.null();
        })
        .then(function(){
          mock.done();
          done();
        });
    });

    it("gets weekly counts for all packages", function(done) {
      var mock = nock(Download.host)
        .get('/point/last-week')
        .reply(200, fixtures.downloads.all.week);

      Download.getWeekly()
        .then(function(result) {
          expect(result).to.exist();
          expect(result.downloads).to.equal(249027204);
        })
        .catch(function(err){
          expect(err).to.be.null();
        })
        .then(function(){
          mock.done();
          done();
        });
    });

  });

  describe("getMonthly()", function() {

    it("gets monthly counts for a specific package", function(done) {
      var mock = nock(Download.host)
        .get('/point/last-month/request')
        .reply(200, fixtures.downloads.request.month);

      Download.getMonthly("request")
        .then(function(result){
          expect(result).to.exist();
          expect(result.downloads).to.equal(500);
        })
        .catch(function(err){
          expect(err).to.be.null();
        })
        .then(function(){
          mock.done();
          done();
        });

    });

    it("gets monthly counts for all packages", function(done) {
      var mock = nock(Download.host)
        .get('/point/last-month')
        .reply(200, fixtures.downloads.all.month);

      Download.getMonthly()
        .then(function(result) {
          expect(result).to.exist();
          expect(result.downloads).to.equal(1028113165);
        })
        .catch(function(err){
          expect(err).to.be.null();
        })
        .then(function(){
          mock.done();
          done();
        });
    });

  });

  describe("getAll()", function() {

    it("gets daily, weekly, and monthly downloads for a specific package", function(done){
      var mock = nock(Download.host)
        .get('/point/last-day/request')
        .reply(200, fixtures.downloads.request.day)
        .get('/point/last-week/request')
        .reply(200, fixtures.downloads.request.week)
        .get('/point/last-month/request')
        .reply(200, fixtures.downloads.request.month);

      Download.getAll("request")
        .then(function(result) {
          expect(result).to.exist();
          expect(result.day).to.be.an.object();
          expect(result.week).to.be.an.object();
          expect(result.month).to.be.an.object();
          expect(result.month.downloads).to.equal(500);
          mock.done();
          done();
        });

    });

    it("gets daily, weekly, and monthly downloads for all packages", function(done){
      var mock = nock(Download.host)
        .get('/point/last-day')
        .reply(200, fixtures.downloads.all.day)
        .get('/point/last-week')
        .reply(200, fixtures.downloads.all.week)
        .get('/point/last-month')
        .reply(200, fixtures.downloads.all.month);

      Download.getAll()
        .then(function(result) {
          expect(result).to.exist();
          expect(result.day).to.be.an.object();
          expect(result.week).to.be.an.object();
          expect(result.month).to.be.an.object();
          expect(result.month.downloads).to.equal(1028113165);
          mock.done();
          done();
        });

    });

  });

});
