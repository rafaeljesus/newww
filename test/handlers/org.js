var Lab = require('lab'),
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

describe('getting an org', function () {
  it('does not include sponsorships if the org has not sponsored anyone', function (done) {
    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com:443")
      .get("/customer/bob/stripe")
      .reply(200, fixtures.customers.happy)
      .get("/customer/bob/stripe/subscription")
      .reply(200, fixtures.users.bobsubscriptions)
      .get("/sponsorship/1")
      .reply(404);

    var orgMock = nock("https://user-api-example.com")
      .get('/org/bigco')
      .reply(200, fixtures.orgs.bigco)
      .get('/org/bigco/user')
      .reply(200, fixtures.orgs.bigcoUsers);

    var options = {
      url: "/org/bigco",
      credentials: fixtures.users.bob
    };

    server.inject(options, function (resp) {
      userMock.done();
      licenseMock.done();
      orgMock.done();
      expect(resp.statusCode).to.equal(200);
      expect(resp.request.response.source.template).to.equal('org/info');
      expect(resp.request.response.source.context).to.not.include('sponsorships');
      done();
    });
  });

  it('includes sponsorships if the org has sponsored someone', function (done) {
    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get("/customer/bob/stripe")
      .reply(200, fixtures.customers.happy)
      .get("/customer/bob/stripe/subscription")
      .reply(200, fixtures.users.bobsubscriptions)
      .get("/sponsorship/1")
      .reply(200, fixtures.orgs.bigcoSponsorships);

    var orgMock = nock("https://user-api-example.com")
      .get('/org/bigco')
      .reply(200, fixtures.orgs.bigco)
      .get('/org/bigco/user')
      .reply(200, fixtures.orgs.bigcoUsers);

    var options = {
      url: "/org/bigco",
      credentials: fixtures.users.bob
    };

    server.inject(options, function (resp) {
      userMock.done();
      licenseMock.done();
      orgMock.done();
      expect(resp.statusCode).to.equal(200);
      expect(resp.request.response.source.template).to.equal('org/info');
      expect(resp.request.response.source.context).to.include('sponsorships');
      done();
    });
  });

  it('does not include sponsorships if the org does not exist', function (done) {
    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get("/customer/bob/stripe")
      .reply(200, fixtures.customers.happy)
      .get("/customer/bob/stripe/subscription")
      .reply(200, fixtures.users.bobPrivateModules);

    var orgMock = nock("https://user-api-example.com")
      .get('/org/bigco')
      .reply(404)
      .get('/org/bigco/user')
      .reply(404);

    var options = {
      url: "/org/bigco",
      credentials: fixtures.users.bob
    };

    server.inject(options, function (resp) {
      userMock.done();
      licenseMock.done();
      orgMock.done();
      expect(resp.statusCode).to.equal(200);
      expect(resp.request.response.source.template).to.equal('org/info');
      expect(resp.request.response.source.context).to.not.include('sponsorships');
      done();
    });
  });
});

describe('deleting an org', function () {
  it('deletes the org if it exists', function (done) {
    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get("/customer/bob/stripe")
      .reply(200, fixtures.customers.happy);

    var orgMock = nock("https://user-api-example.com")
      .delete('/org/bigco')
      .reply(200, fixtures.orgs.bigcoDeleted);

    var options = {
      url: "/org/bigco",
      method: "DELETE",
      credentials: fixtures.users.bob
    };

    server.inject(options, function (resp) {
      userMock.done();
      licenseMock.done();
      orgMock.done();
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('/org');
      done();
    });
  });
});