var DOWNLOAD_API = "https://downloads-api-example.com";

var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  it = lab.test,
  expect = Code.expect,
  nock = require("nock"),
  fixtures = require("../fixtures"),
  Download = require("../../agents/download");

describe("Download", function() {

  describe("getDaily()", function() {

    describe("when package is specified", function() {

      it("gets daily counts", function(done) {
        var mock = nock(DOWNLOAD_API)
          .get('/point/last-day/request')
          .reply(200, fixtures.downloads.request.day);

        new Download({}, 50).getDaily("request")
          .then(function(result) {
            expect(result).to.exist();
            expect(result.downloads).to.equal(13);
          })
          .catch(function(err) {
            expect(err).to.be.null();
          })
          .finally(function() {
            mock.done();
            done();
          });

      });

      it("swallows errors and returns null when the request fails", function(done) {
        var mock = nock(DOWNLOAD_API)
          .get('/point/last-day/request')
          .reply(400);

        new Download({}, 50).getDaily("request")
          .then(function(result) {
            expect(result).to.be.null();
            mock.done();
            done();
          });
      });

    })

    describe("when package is not specified", function() {

      it("gets daily counts for all packages", function(done) {
        var mock = nock(DOWNLOAD_API)
          .get('/point/last-day')
          .reply(200, fixtures.downloads.all.day);

        new Download({}, 50).getDaily()
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

      it("returns null if request duration exceeds specified timeout", function(done) {

        var mock = nock(DOWNLOAD_API)
          .get('/point/last-day')
          .delayConnection(100)
          .reply(200, fixtures.downloads.all.day);

        new Download({}, 50).getDaily()
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
      var mock = nock(DOWNLOAD_API)
        .get('/point/last-week/request')
        .reply(200, fixtures.downloads.request.week);

      new Download({}, 50).getWeekly("request")
        .then(function(result) {
          expect(result).to.exist();
          expect(result.downloads).to.equal(200);
        })
        .catch(function(err) {
          expect(err).to.be.null();
        })
        .then(function() {
          mock.done();
          done();
        });
    });

    it("gets weekly counts for all packages", function(done) {
      var mock = nock(DOWNLOAD_API)
        .get('/point/last-week')
        .reply(200, fixtures.downloads.all.week);

      new Download({}, 50).getWeekly()
        .then(function(result) {
          expect(result).to.exist();
          expect(result.downloads).to.equal(249027204);
        })
        .catch(function(err) {
          expect(err).to.be.null();
        })
        .then(function() {
          mock.done();
          done();
        });
    });

  });

  describe("getMonthly()", function() {

    it("gets monthly counts for a specific package", function(done) {
      var mock = nock(DOWNLOAD_API)
        .get('/point/last-month/request')
        .reply(200, fixtures.downloads.request.month);

      new Download({}, 50).getMonthly("request")
        .then(function(result) {
          expect(result).to.exist();
          expect(result.downloads).to.equal(500);
        })
        .catch(function(err) {
          expect(err).to.be.null();
        })
        .then(function() {
          mock.done();
          done();
        });

    });

    it("gets monthly counts for all packages", function(done) {
      var mock = nock(DOWNLOAD_API)
        .get('/point/last-month')
        .reply(200, fixtures.downloads.all.month);

      new Download({}, 50).getMonthly()
        .then(function(result) {
          expect(result).to.exist();
          expect(result.downloads).to.equal(1028113165);
        })
        .catch(function(err) {
          expect(err).to.be.null();
        })
        .then(function() {
          mock.done();
          done();
        });
    });

  });

  describe("getAll()", function() {

    it("gets daily, weekly, and monthly downloads for a specific package", function(done) {
      var mock = nock(DOWNLOAD_API)
        .get('/point/last-day/request')
        .reply(200, fixtures.downloads.request.day)
        .get('/point/last-week/request')
        .reply(200, fixtures.downloads.request.week)
        .get('/point/last-month/request')
        .reply(200, fixtures.downloads.request.month);

      new Download({}, 50).getAll("request")
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

    it("gets daily, weekly, and monthly downloads for all packages", function(done) {
      var mock = nock(DOWNLOAD_API)
        .get('/point/last-day')
        .reply(200, fixtures.downloads.all.day)
        .get('/point/last-week')
        .reply(200, fixtures.downloads.all.week)
        .get('/point/last-month')
        .reply(200, fixtures.downloads.all.month);

      new Download({}, 50).getAll()
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
