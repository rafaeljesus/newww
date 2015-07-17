var generateCrumb = require("../handlers/crumb.js"),
    Lab = require('lab'),
    Code = require('code'),
    nock = require('nock'),
    cheerio = require('cheerio'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    beforeEach = lab.beforeEach,
    it = lab.test,
    expect = Code.expect,
    server,
    fixtures = require('../fixtures');

before(function (done) {
  process.env.FEATURE_ORG_BILLING = 'true';
  require('../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

after(function (done) {
  delete process.env.FEATURE_ORG_BILLING;
  server.stop(done);
});

describe('GET /org', function () {
  var mock;
  before(function (done) {
    mock = nock("https://user-api-example.com")
      .get("/org")
      .reply(200, {count:1, items: [fixtures.org.boomer]});

    done();
  });

  after(function (done) {
    mock.done();
    done();
  });
});
