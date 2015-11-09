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
  fixtures = require('../fixtures'),
  URL = require('url'),
  qs = require('qs');

var requireInject = require('require-inject');
var redisMock = require('redis-mock');
var TokenFacilitator = require('token-facilitator');
var client = redisMock.createClient();

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

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var options = {
        url: "/org/asj828&&&@@@13/team/create",
        credentials: fixtures.users.bob
      };

      server.inject(options, function(resp) {
        userMock.done();
        licenseMock.done();
        expect(resp.statusCode).to.equal(404);
        expect(resp.request.response.source.template).to.equal('errors/not-found');
        done();
      });
    });

    it('returns a 404 if the org does not exist', function(done) {

      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .get('/org/bigco')
        .reply(404)
        .get('/org/bigco/user')
        .reply(404)
        .get('/org/bigco/package')
        .reply(404)
        .get('/org/bigco/team')
        .reply(404);

      var options = {
        url: "/org/bigco/team/create",
        credentials: fixtures.users.bob
      };

      server.inject(options, function(resp) {
        userMock.done();
        licenseMock.done();
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

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/betty/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .get('/org/bigco')
        .reply(200, fixtures.orgs.bigco)
        .get('/org/bigco/user')
        .reply(200, fixtures.orgs.bigcoUsers)
        .get('/org/bigco/package')
        .reply(200, {
          count: 1,
          items: [fixtures.packages.fake]
        })
        .get('/org/bigco/team')
        .reply(200, fixtures.teams.bigcoOrg);

      var options = {
        url: "/org/bigco/team/create",
        credentials: fixtures.users.betty
      };

      server.inject(options, function(resp) {
        userMock.done();
        licenseMock.done();
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

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .get('/org/bigco')
        .reply(200, fixtures.orgs.bigco)
        .get('/org/bigco/user')
        .reply(200, fixtures.orgs.bigcoUsers)
        .get('/org/bigco/package')
        .reply(200, {
          count: 1,
          items: [fixtures.packages.fake]
        })
        .get('/org/bigco/team')
        .reply(200, fixtures.teams.bigcoOrg);

      var options = {
        url: "/org/bigco/team/create",
        credentials: fixtures.users.bob
      };

      server.inject(options, function(resp) {
        userMock.done();
        licenseMock.done();
        orgMock.done();
        expect(resp.statusCode).to.equal(200);
        expect(resp.request.response.source.template).to.equal("org/add-team");
        done();
      });

    });
  });

  describe('adding a team to an org', function() {
    it('renders an error on invalid orgname', function(done) {
      generateCrumb(server, function(crumb) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock('https://license-api-example.com')
          .get('/customer/bob/stripe')
          .reply(404);

        var options = {
          url: "/org/big@@@@@co/team",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          var redirectPath = resp.headers.location;
          var url = URL.parse(redirectPath);
          var query = url.query;
          var token = qs.parse(query).notice;
          var tokenFacilitator = new TokenFacilitator({
            redis: client
          });
          expect(token).to.be.string();
          expect(token).to.not.be.empty();
          expect(resp.statusCode).to.equal(302);
          tokenFacilitator.read(token, {
            prefix: "notice:"
          }, function(err, notice) {
            expect(err).to.not.exist();
            expect(notice.notices).to.be.array();
            expect(notice.notices[0]).to.equal('Invalid Org Name.');
            done();
          });
        });
      });
    });
    it('renders an error on invalid team name', function(done) {
      generateCrumb(server, function(crumb) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock('https://license-api-example.com')
          .get('/customer/bob/stripe')
          .reply(404);

        var options = {
          url: "/org/bigco/team",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            "team-name": "bigco@@@team",
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          var redirectPath = resp.headers.location;
          var url = URL.parse(redirectPath);
          var query = url.query;
          var token = qs.parse(query).notice;
          var tokenFacilitator = new TokenFacilitator({
            redis: client
          });
          expect(token).to.be.string();
          expect(token).to.not.be.empty();
          expect(resp.statusCode).to.equal(302);
          tokenFacilitator.read(token, {
            prefix: "notice:"
          }, function(err, notice) {
            expect(err).to.not.exist();
            expect(notice.notices).to.be.array();
            expect(notice.notices[0]).to.equal('Invalid Team Name.');
            done();
          });
        });
      });
    });
    it('renders an error on org missing', function(done) {
      generateCrumb(server, function(crumb) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock('https://license-api-example.com')
          .get('/customer/bob/stripe')
          .reply(404);

        var orgMock = nock("https://user-api-example.com")
          .get('/org/bigco')
          .reply(404)
          .get('/org/bigco/user')
          .reply(404)
          .get('/org/bigco/package')
          .reply(404)
          .get('/org/bigco/team')
          .reply(404);

        var options = {
          url: "/org/bigco/team",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            "team-name": "bigcoteam",
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          orgMock.done();
          expect(resp.statusCode).to.equal(404);
          expect(resp.request.response.source.template).to.equal('errors/not-found');
          done();
        });
      });
    });
    it('renders an error on 500+ error', function(done) {
      generateCrumb(server, function(crumb) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock('https://license-api-example.com')
          .get('/customer/bob/stripe')
          .reply(404);

        var orgMock = nock("https://user-api-example.com")
          .get('/org/bigco')
          .reply(500)
          .get('/org/bigco/user')
          .reply(500)
          .get('/org/bigco/package')
          .reply(500)
          .get('/org/bigco/team')
          .reply(500);

        var options = {
          url: "/org/bigco/team",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            "team-name": "bigcoteam",
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          orgMock.done();
          expect(resp.statusCode).to.equal(200);
          expect(resp.request.response.source.template).to.equal('errors/internal');
          done();
        });
      });
    });

    it('allows team to be added without users', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .get('/org/bigco')
        .reply(200, fixtures.orgs.bigco)
        .get('/org/bigco/user')
        .reply(200, fixtures.orgs.bigcoUsers)
        .get('/org/bigco/package')
        .reply(200, {
          count: 1,
          items: [fixtures.packages.fake]
        })
        .get('/org/bigco/team')
        .reply(200, fixtures.teams.bigcoOrg)
        .put('/org/bigco/team', {
          scope: 'bigco',
          name: 'bigcoteam',
          description: 'bigco has a team called bigcoteam',
        })
        .reply(200);

      generateCrumb(server, function(crumb) {

        var options = {
          url: "/org/bigco/team",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            "team-name": "bigcoteam",
            description: 'bigco has a team called bigcoteam',
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          orgMock.done();
          expect(resp.statusCode).to.equal(302);
          expect(resp.request.response.headers.location).to.equal('/org/bigco/team/bigcoteam');
          done();
        });
      });
    });

    it('allows team to be added with one user', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .get('/org/bigco')
        .reply(200, fixtures.orgs.bigco)
        .get('/org/bigco/user')
        .reply(200, fixtures.orgs.bigcoUsers)
        .get('/org/bigco/package')
        .reply(200, {
          count: 1,
          items: [fixtures.packages.fake]
        })
        .get('/org/bigco/team')
        .reply(200, fixtures.teams.bigcoOrg)
        .put('/org/bigco/team', {
          scope: 'bigco',
          name: 'bigcoteam',
          description: 'bigco has a team called bigcoteam',
        })
        .reply(200)
        .put('/team/bigco/bigcoteam/user', {
          user: 'billy'
        })
        .reply(200);

      generateCrumb(server, function(crumb) {

        var options = {
          url: "/org/bigco/team",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            "team-name": "bigcoteam",
            description: 'bigco has a team called bigcoteam',
            member: "billy",
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          orgMock.done();
          expect(resp.statusCode).to.equal(302);
          expect(resp.request.response.headers.location).to.equal('/org/bigco/team/bigcoteam');
          done();
        });
      });
    });

    it('allows team to be added with multiple users', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .get('/org/bigco')
        .reply(200, fixtures.orgs.bigco)
        .get('/org/bigco/user')
        .reply(200, fixtures.orgs.bigcoUsers)
        .get('/org/bigco/package')
        .reply(200, {
          count: 1,
          items: [fixtures.packages.fake]
        })
        .get('/org/bigco/team')
        .reply(200, fixtures.teams.bigcoOrg)
        .put('/org/bigco/team', {
          scope: 'bigco',
          name: 'bigcoteam',
          description: 'bigco has a team called bigcoteam',
        })
        .reply(200)
        .put('/team/bigco/bigcoteam/user', {
          user: 'billy'
        })
        .reply(200)
        .put('/team/bigco/bigcoteam/user', {
          user: 'sally'
        })
        .reply(200)
        .put('/team/bigco/bigcoteam/user', {
          user: 'deb'
        })
        .reply(200);

      generateCrumb(server, function(crumb) {

        var options = {
          url: "/org/bigco/team",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            "team-name": "bigcoteam",
            description: 'bigco has a team called bigcoteam',
            member: ['billy', 'sally', 'deb'],
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          orgMock.done();
          expect(resp.statusCode).to.equal(302);
          expect(resp.request.response.headers.location).to.equal('/org/bigco/team/bigcoteam');
          done();
        });
      });
    });

  });
/**
describe('viewing a team page', function() {
  it('
});
*/
});
