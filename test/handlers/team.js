var generateCrumb = require("../handlers/crumb.js"),
  Lab = require('lab'),
  Code = require('code'),
  nock = require('nock'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  server,
  fixtures = require('../fixtures');

var requireInject = require('require-inject');
var redisMock = require('redis-mock');

before(function(done) {
  process.env.FEATURE_ORG_BILLING = 'bob,betty';
  require('../../lib/feature-flags').calculate('org_billing');
  requireInject.installGlobally('../mocks/server', {
    redis: redisMock
  })(function(obj) {
    server = obj;
    done();
  });
});

after(function(done) {
  delete process.env.FEATURE_ORG_BILLING;
  server.stop(done);
});

describe('team', function() {
  describe('accessing team creation page', function() {
    it('gives you a 404 if the org name is invalid', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var options = {
        url: "/org/asj828&&&@@@13/team/create",
        credentials: fixtures.users.bob
      };

      server.inject(options, function(resp) {
        userMock.done();
        expect(resp.statusCode).to.equal(404);
        expect(resp.request.response.source.template).to.equal('errors/not-found');
        done();
      });
    });

    it('returns a 404 if the org does not exist', function(done) {

      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var orgMock = nock("https://user-api-example.com")
        .get('/org/bigco')
        .reply(404)
        .get('/org/bigco/user')
        .reply(404)
        .get('/org/bigco/package')
        .reply(404);

      var options = {
        url: "/org/bigco/team/create",
        credentials: fixtures.users.bob
      };

      server.inject(options, function(resp) {
        userMock.done();
        orgMock.done();
        expect(resp.statusCode).to.equal(404);
        expect(resp.request.response.source.template).to.equal('errors/not-found');
        done();
      });
    });

    it('redirects to org page if logged in user is not an admin', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/betty")
        .reply(200, fixtures.users.betty);


      var orgMock = nock("https://user-api-example.com")
        .get('/org/bigco')
        .reply(200, fixtures.orgs.bigco)
        .get('/org/bigco/user')
        .reply(200, fixtures.orgs.bigcoUsers)
        .get('/org/bigco/package')
        .reply(200, {
          count: 1,
          items: [fixtures.packages.fake]
        });

      var options = {
        url: "/org/bigco/team/create",
        credentials: fixtures.users.betty
      };

      server.inject(options, function(resp) {
        userMock.done();
        orgMock.done();
        expect(resp.statusCode).to.equal(302);
        expect(resp.request.response.headers.location).to.match(/\/org\/bigco\?notice=/);
        done();
      });
    });

    it('takes you to the team creation page if you are an admin', function(done) {

      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);


      var orgMock = nock("https://user-api-example.com")
        .get('/org/bigco')
        .reply(200, fixtures.orgs.bigco)
        .get('/org/bigco/user')
        .reply(200, fixtures.orgs.bigcoUsers)
        .get('/org/bigco/package')
        .reply(200, {
          count: 1,
          items: [fixtures.packages.fake]
        });

      var options = {
        url: "/org/bigco/team/create",
        credentials: fixtures.users.bob
      };

      server.inject(options, function(resp) {
        userMock.done();
        orgMock.done();
        expect(resp.statusCode).to.equal(200);
        expect(resp.request.response.source.template).to.equal("org/add-team");
        done();
      });

    });
  });
});
