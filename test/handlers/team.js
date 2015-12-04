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
var redisClient = redisMock.createClient();

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
        .get('/org/bigco/user?per_page=100&page=0')
        .reply(404)
        .get('/org/bigco/package?per_page=100&page=0')
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
        .get('/org/bigco/user?per_page=100&page=0')
        .reply(200, fixtures.orgs.bigcoUsers)
        .get('/org/bigco/package?per_page=100&page=0')
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
        .get('/org/bigco/user?per_page=100&page=0')
        .reply(200, fixtures.orgs.bigcoUsers)
        .get('/org/bigco/package?per_page=100&page=0')
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
            redis: redisClient
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
            redis: redisClient
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
          .get('/org/bigco/user?per_page=100&page=0')
          .reply(404)
          .get('/org/bigco/package?per_page=100&page=0')
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
          .get('/org/bigco/user?per_page=100&page=0')
          .reply(500)
          .get('/org/bigco/package?per_page=100&page=0')
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
        .get('/org/bigco/user?per_page=100&page=0')
        .reply(200, fixtures.orgs.bigcoUsers)
        .get('/org/bigco/package?per_page=100&page=0')
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
        .get('/org/bigco/user?per_page=100&page=0')
        .reply(200, fixtures.orgs.bigcoUsers)
        .get('/org/bigco/package?per_page=100&page=0')
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
        .get('/org/bigco/user?per_page=100&page=0')
        .reply(200, fixtures.orgs.bigcoUsers)
        .get('/org/bigco/package?per_page=100&page=0')
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

  describe('removing a team from an organization', function() {
    it('allows an admin to remove a team from an organization', function(done) {
      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);
      var teamMock = nock('https://user-api-example.com')
        .delete('/team/bigco/bigcoteam')
        .reply(200);
      var userMock = nock('https://user-api-example.com')
        .get('/user/bob')
        .reply(200, fixtures.users.bob);

      generateCrumb(server, function(crumb) {
        var options = {
          credentials: fixtures.users.bob,
          headers: {cookie: 'crumb=' + crumb},
          method: 'POST',
          payload: {
            crumb: crumb,
            updateType: 'removeTeam'
          },
          url: '/org/bigco/team/bigcoteam'
        };

        server.inject(options, function(response) {
          try {
            expect(response.statusCode).to.equal(302);
            expect(response.headers.location).to.equal('/org/bigco/teams');

            done();
          } catch (error) {
            done(error);
          } finally {
            licenseMock.done();
            teamMock.done();
            userMock.done();
          }
        });
      });
    });

    it('does not allow a non-admin to remove a team from an organization', function(done) {
      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/betty/stripe')
        .reply(404);
      var teamMock = nock('https://user-api-example.com')
        .delete('/team/bigco/bigcoteam')
        .reply(401);
      var userMock = nock('https://user-api-example.com')
        .get('/user/betty')
        .reply(200, fixtures.users.betty);

      generateCrumb(server, function(crumb) {
        var options = {
          credentials: fixtures.users.betty,
          headers: {cookie: 'crumb=' + crumb},
          method: 'POST',
          payload: {
            crumb: crumb,
            updateType: 'removeTeam'
          },
          url: '/org/bigco/team/bigcoteam'
        };

        server.inject(options, function(response) {
          try {
            var parsedRedirectUrl = URL.parse(response.headers.location);
            var redirectPath = parsedRedirectUrl.pathname
            var noticeToken = qs.parse(parsedRedirectUrl.query).notice;
            var tokenFacilitator = new TokenFacilitator({redis: redisClient});

            expect(noticeToken).to.be.string();
            expect(noticeToken).to.not.be.empty();
            expect(response.statusCode).to.equal(302);
            expect(redirectPath).to.equal('/org/bigco/team/bigcoteam');
            tokenFacilitator.read(noticeToken, {prefix: 'notice:'}, function(error, noticeContainer) {
              expect(error).to.not.exist();
              expect(noticeContainer.notices).to.be.array();
              expect(noticeContainer.notices[0]).to.equal('You do not have permission to perform this operation.');

              done();
            })
          } catch (error) {
            done(error);
          } finally {
            licenseMock.done();
            teamMock.done();
            userMock.done();
          }
        });
      });
    });
  });

  describe('team package management', function() {
    it('renders an error if the org name is invalid', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var options = {
        url: "/org/.bigco/team/bigcoteam",
        method: "GET",
        credentials: fixtures.users.bob,
      };

      server.inject(options, function(resp) {
        userMock.done();
        licenseMock.done();
        expect(resp.statusCode).to.equal(302);
        expect(resp.request.response.headers.location).to.include('/org?notice=');
        done();
      });
    });

    it('renders an error if the team name is invalid', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var options = {
        url: "/org/bigco/team/.bigcoteam",
        method: "GET",
        credentials: fixtures.users.bob,
      };

      server.inject(options, function(resp) {
        userMock.done();
        licenseMock.done();
        expect(resp.statusCode).to.equal(302);
        expect(resp.request.response.headers.location).to.include('/org/bigco/team?notice=');
        done();
      });
    });

    it('renders an error if the org does not exist', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .get('/org/bigco')
        .reply(404)
        .get('/org/bigco/user?per_page=100&page=0')
        .reply(404)
        .get('/org/bigco/package?per_page=100&page=0')
        .reply(404)
        .get('/org/bigco/team')
        .reply(404);

      var options = {
        url: "/org/bigco/team/bigcoteam",
        method: "GET",
        credentials: fixtures.users.bob,
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

    it('renders an error if the team does not exist', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .get('/org/bigco')
        .reply(200, fixtures.orgs.bigco)
        .get('/org/bigco/user?per_page=100&page=0')
        .reply(200, fixtures.orgs.bigcoAddedUsers)
        .get('/org/bigco/package?per_page=100&page=0')
        .reply(200, {
          count: 1,
          items: [fixtures.packages.fake]
        })
        .get('/org/bigco/team')
        .reply(200, fixtures.teams.bigcoOrg)
        .get('/team/bigco/bigcoteam')
        .reply(404)
        .get('/team/bigco/bigcoteam/user')
        .reply(404)
        .get('/team/bigco/bigcoteam/package?format=detailed')
        .reply(404);

      var options = {
        url: "/org/bigco/team/bigcoteam",
        method: "GET",
        credentials: fixtures.users.bob,
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

    it('displays the team page if everything goes well', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .get('/org/bigco')
        .reply(200, fixtures.orgs.bigco)
        .get('/org/bigco/user?per_page=100&page=0')
        .reply(200, fixtures.orgs.bigcoAddedUsers)
        .get('/org/bigco/package?per_page=100&page=0')
        .reply(200, {
          count: 1,
          items: [fixtures.packages.fake]
        })
        .get('/org/bigco/team')
        .reply(200, fixtures.teams.bigcoOrg)
        .get('/team/bigco/bigcoteam')
        .reply(200, fixtures.teams.bigcoteam)
        .get('/team/bigco/bigcoteam/user')
        .reply(200, fixtures.teams.bigcoteamUsers)
        .get('/team/bigco/bigcoteam/package?format=detailed')
        .reply(200, fixtures.teams.bigcoteamPackages);

      var options = {
        url: "/org/bigco/team/bigcoteam",
        method: "GET",
        credentials: fixtures.users.bob,
      };

      server.inject(options, function(resp) {
        userMock.done();
        licenseMock.done();
        orgMock.done();
        expect(resp.statusCode).to.equal(200);
        expect(resp.request.response.source.template).to.equal('team/show');
        done();
      });
    });

    describe('accessing the add packages to team page', function() {
      it('returns an error if the org is invalid', function(done) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock('https://license-api-example.com')
          .get('/customer/bob/stripe')
          .reply(404);

        var options = {
          url: "/org/.bigco/team/bigcoteam/add-package",
          method: "GET",
          credentials: fixtures.users.bob,
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          expect(resp.statusCode).to.equal(404);
          expect(resp.request.response.source.template).to.equal('errors/not-found');
          done();
        });
      });

      it('returns an error if the team is invalid', function(done) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock('https://license-api-example.com')
          .get('/customer/bob/stripe')
          .reply(404);

        var options = {
          url: "/org/bigco/team/.bigcoteam/add-package",
          method: "GET",
          credentials: fixtures.users.bob,
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          expect(resp.statusCode).to.equal(404);
          expect(resp.request.response.source.template).to.equal('errors/not-found');
          done();
        });
      });

      it('renders an error if the user is not an admin', function(done) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/betty")
          .reply(200, fixtures.users.betty);

        var licenseMock = nock('https://license-api-example.com')
          .get('/customer/betty/stripe')
          .reply(404);

        var orgMock = nock("https://user-api-example.com")
          .get('/org/bigco')
          .reply(200, fixtures.orgs.bigco)
          .get('/org/bigco/user?per_page=100&page=0')
          .reply(200, fixtures.orgs.bigcoAddedUsers)
          .get('/org/bigco/package?per_page=100&page=0')
          .reply(200, {
            count: 1,
            items: [fixtures.packages.fake]
          })
          .get('/org/bigco/team')
          .reply(200, fixtures.teams.bigcoOrg);

        var options = {
          url: "/org/bigco/team/bigcoteam/add-package",
          method: "GET",
          credentials: fixtures.users.betty,
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          orgMock.done();
          expect(resp.statusCode).to.equal(302);
          expect(resp.request.response.headers.location).to.include('/org/bigco?notice=');
          done();
        });
      });

      it('shows the add-package page if there are no issues', function(done) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob)
          .get('/user/bob/package/owner?per_page=9999')
          .reply(200, fixtures.users.ownedPackages);

        var licenseMock = nock('https://license-api-example.com')
          .get('/customer/bob/stripe')
          .reply(404);

        var orgMock = nock("https://user-api-example.com")
          .get('/org/bigco')
          .reply(200, fixtures.orgs.bigco)
          .get('/org/bigco/user?per_page=100&page=0')
          .reply(200, fixtures.orgs.bigcoAddedUsers)
          .get('/org/bigco/package?per_page=100&page=0')
          .reply(200, {
            count: 1,
            items: [fixtures.packages.fake]
          })
          .get('/org/bigco/team')
          .reply(200, fixtures.teams.bigcoOrg)
          .get('/team/bigco/bigcoteam')
          .reply(200, fixtures.teams.bigcoteam)
          .get('/team/bigco/bigcoteam/user')
          .reply(200, fixtures.teams.bigcoteamUsers)
          .get('/team/bigco/bigcoteam/package?format=mini')
          .reply(200, fixtures.teams.bigcoteamPackages);

        var options = {
          url: "/org/bigco/team/bigcoteam/add-package",
          method: "GET",
          credentials: fixtures.users.bob,
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          orgMock.done();
          expect(resp.statusCode).to.equal(200);
          expect(resp.request.response.source.template).to.equal('team/add-package');
          done();
        });
      });
    });

    describe('getting packages for the add-package page (via AJAX)', function() {

      it('sends an error if something was not found', function(done) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock('https://license-api-example.com')
          .get('/customer/bob/stripe')
          .reply(404);

        var orgMock = nock("https://user-api-example.com")
          .get('/team/bigco/bigcoteam/package?format=mini')
          .reply(404);

        var options = {
          url: "/org/bigco/team/bigcoteam/package",
          method: "GET",
          credentials: fixtures.users.bob,
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          orgMock.done();
          expect(resp.statusCode).to.equal(404);
          expect(resp.headers['content-type']).to.include('application/json');
          var obj = JSON.parse(resp.payload);
          expect(obj.error).to.equal('Not Found');
          done();
        });
      });

      it('sends an error if something goes wrong', function(done) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock('https://license-api-example.com')
          .get('/customer/bob/stripe')
          .reply(404);

        var orgMock = nock("https://user-api-example.com")
          .get('/team/bigco/bigcoteam/package?format=mini')
          .reply(401, {
            "error": "cannot read from team"
          });

        var options = {
          url: "/org/bigco/team/bigcoteam/package",
          method: "GET",
          credentials: fixtures.users.bob,
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          orgMock.done();
          expect(resp.statusCode).to.equal(401);
          expect(resp.headers['content-type']).to.include('application/json');
          var obj = JSON.parse(resp.payload);
          expect(obj.error).to.equal('user is unauthorized to perform this action');
          done();
        });
      });

      it('returns packages as JSON', function(done) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock('https://license-api-example.com')
          .get('/customer/bob/stripe')
          .reply(404);

        var orgMock = nock("https://user-api-example.com")
          .get('/team/bigco/bigcoteam/package?format=mini')
          .reply(200, fixtures.teams.bigcoteamPackages);

        var options = {
          url: "/org/bigco/team/bigcoteam/package",
          method: "GET",
          credentials: fixtures.users.bob,
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          orgMock.done();
          expect(resp.statusCode).to.equal(200);
          expect(resp.headers['content-type']).to.include('application/json');
          var obj = JSON.parse(resp.payload);
          expect(obj.items[0].name).to.equal('@bigco/boom');
          done();
        });
      });
    });
  });

  describe('adding packages via the add-package page', function() {
    it('renders an error if there is an issue adding packages', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .put('/team/bigco/bigcoteam/package', {
          packages: [{
            name: '@bigco/boom',
            permissions: 'write'
          }, {
            name: 'kabloom',
            permissions: 'read'
          }]
        })
        .reply(401, {
          error: 'not authorized'
        });

      generateCrumb(server, function(crumb) {

        var options = {
          url: "/org/bigco/team/bigcoteam",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            names: ["@bigco/boom", "kabloom"],
            writePermissions: {
              "@bigco/boom": 'on'
            },
            updateType: 'addPackagesToTeam',
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
          expect(resp.request.response.headers.location).to.include('/org/bigco/team/bigcoteam?notice=');
          done();
        });
      });
    });

    it('allows a super/team-admin to add a single package via the add-package page', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .put('/team/bigco/bigcoteam/package', {
          packages: [{
            name: '@bigco/boom',
            permissions: 'write'
          }]
        })
        .reply(200);

      generateCrumb(server, function(crumb) {

        var options = {
          url: "/org/bigco/team/bigcoteam",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            names: "@bigco/boom",
            writePermissions: {
              "@bigco/boom": 'on'
            },
            updateType: 'addPackagesToTeam',
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

    it('allows a super/team-admin to add packages via the add-package page', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .put('/team/bigco/bigcoteam/package', {
          packages: [{
            name: '@bigco/boom',
            permissions: 'write'
          }, {
            name: 'kabloom',
            permissions: 'read'
          }]
        })
        .reply(200);

      generateCrumb(server, function(crumb) {

        var options = {
          url: "/org/bigco/team/bigcoteam",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            names: ["@bigco/boom", "kabloom"],
            writePermissions: {
              "@bigco/boom": 'on'
            },
            updateType: 'addPackagesToTeam',
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

  describe('updating the team packages', function() {
    it('allows a super/team-admin to make a package writable by the team', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .put('/team/bigco/bigcoteam/package', {
          package: '@bigco/boomer',
          permissions: 'write'
        })
        .reply(200);

      generateCrumb(server, function(crumb) {

        var options = {
          url: "/org/bigco/team/bigcoteam",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            "name": "@bigco/boomer",
            updateType: 'updateWritePermissions',
            writePermission: 'on',
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

    it('allows a super/team-admin to make a package read-only by the team', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .put('/team/bigco/bigcoteam/package', {
          package: '@bigco/boomer',
          permissions: 'read'
        })
        .reply(200);

      generateCrumb(server, function(crumb) {

        var options = {
          url: "/org/bigco/team/bigcoteam",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            "name": "@bigco/boomer",
            updateType: 'updateWritePermissions',
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

    it('does not allow a non-super/team-admin to update a package\'s permissions', function(done) {

      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .put('/team/bigco/bigcoteam/package', {
          package: '@bigco/boomer',
          permissions: 'write'
        })
        .reply(403, {
          error: 'forbidden'
        });

      generateCrumb(server, function(crumb) {

        var options = {
          url: "/org/bigco/team/bigcoteam",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            "name": "@bigco/boomer",
            updateType: 'updateWritePermissions',
            writePermission: 'on',
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
          expect(resp.request.response.headers.location).to.include('/org/bigco/team/bigcoteam?notice=');
          done();
        });
      });
    });

    it('allows a super/team-admin to remove a package', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .delete('/team/bigco/bigcoteam/package', {
          package: '@bigco/boomer'
        })
        .reply(200);

      generateCrumb(server, function(crumb) {

        var options = {
          url: "/org/bigco/team/bigcoteam",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            "name": "@bigco/boomer",
            updateType: 'removePackage',
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

    it('does not allow a non-super/team-admin to remove a package', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .delete('/team/bigco/bigcoteam/package', {
          package: '@bigco/boomer'
        })
        .reply(403, {
          error: "forbidden"
        });

      generateCrumb(server, function(crumb) {

        var options = {
          url: "/org/bigco/team/bigcoteam",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            "name": "@bigco/boomer",
            updateType: 'removePackage',
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
          expect(resp.request.response.headers.location).to.include('/org/bigco/team/bigcoteam?notice=');
          done();
        });
      });
    });

    it('allows an admin to add a user to a team', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var teamMock = nock("https://user-api-example.com")
        .put('/team/bigco/bigcoteam/user', {
          user: 'billy'
        })
        .reply(200);

      generateCrumb(server, function(crumb) {

        var options = {
          url: "/org/bigco/team/bigcoteam",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            "member": ['billy'],
            updateType: 'addUsersToTeam',
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(options, function(resp) {
          userMock.done();
          teamMock.done();
          expect(resp.statusCode).to.equal(302);
          expect(resp.request.response.headers.location).to.equal('/org/bigco/team/bigcoteam#members');
          done();
        });
      });

    });
  });

  describe('viewing the add user to a team page', function() {
    it('gives you a 404 if the org name is invalid', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var options = {
        url: "/org/asj828&&&@@@13/team/bobteam/add-user",
        credentials: fixtures.users.bob
      };

      server.inject(options, function(resp) {
        userMock.done();
        expect(resp.statusCode).to.equal(404);
        expect(resp.request.response.source.template).to.equal('errors/not-found');
        done();
      });
    });

    it('gives you a 404 if the team name is invalid', function(done) {

      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);


      var options = {
        url: "/org/bigco/team/asj828&&&@@@13/bobteam/add-user",
        credentials: fixtures.users.bob
      };

      server.inject(options, function(resp) {
        userMock.done();
        expect(resp.statusCode).to.equal(404);
        expect(resp.request.response.source.template).to.equal('errors/not-found');
        done();
      });
    });

    it('gives you an error if you are not an admin', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/betty")
        .reply(200, fixtures.users.betty);

      var orgMock = nock("https://user-api-example.com")
        .get('/org/bigco')
        .reply(200, fixtures.orgs.bigco)
        .get('/org/bigco/user?per_page=100&page=0')
        .reply(200, fixtures.orgs.bigcoAddedUsers)
        .get('/org/bigco/package?per_page=100&page=0')
        .reply(200, {
          count: 1,
          items: [fixtures.packages.fake]
        })
        .get('/org/bigco/team')
        .reply(200, fixtures.teams.bigcoOrg);

      var options = {
        url: "/org/bigco/team/developers/add-user",
        credentials: fixtures.users.betty
      };

      server.inject(options, function(resp) {
        userMock.done();
        orgMock.done();
        var redirectPath = resp.headers.location;
        var url = URL.parse(redirectPath);
        var query = url.query;
        var token = qs.parse(query).notice;
        var tokenFacilitator = new TokenFacilitator({
          redis: redisClient
        });
        expect(token).to.be.string();
        expect(token).to.not.be.empty();
        expect(resp.statusCode).to.equal(302);
        tokenFacilitator.read(token, {
          prefix: "notice:"
        }, function(err, notice) {
          expect(err).to.not.exist();
          expect(notice.notices).to.be.array();
          expect(notice.notices[0]).to.equal('User does not have the appropriate permissions to reach this page');
          done();
        });
      });
    });

    it('it takes you to the add-user template if you are admin', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob)
        .get("/user/bob/package/owner?per_page=9999")
        .reply(200, fixtures.users.ownedPackages);

      var orgMock = nock("https://user-api-example.com")
        .get('/org/bigco')
        .reply(200, fixtures.orgs.bigco)
        .get('/org/bigco/user?per_page=100&page=0')
        .reply(200, fixtures.orgs.bigcoAddedUsers)
        .get('/org/bigco/package?per_page=100&page=0')
        .reply(200, {
          count: 1,
          items: [fixtures.packages.fake]
        })
        .get('/org/bigco/team')
        .reply(200, fixtures.teams.bigcoOrg);

      var teamMock = nock("https://user-api-example.com")
        .get('/team/bigco/developers')
        .reply(200, fixtures.teams.bigcoOrg)
        .get('/team/bigco/developers/user')
        .reply(200, fixtures.teams.bigcoOrgUsers)
        .get('/team/bigco/developers/package?format=mini')
        .reply(200, fixtures.teams.bigcoteamPackages);

      var options = {
        url: "/org/bigco/team/developers/add-user",
        credentials: fixtures.users.bob
      };

      server.inject(options, function(resp) {
        userMock.done();
        orgMock.done();
        teamMock.done();
        expect(resp.statusCode).to.equal(200);
        expect(resp.request.response.source.template).to.equal('team/add-user');
        done();
      });
    });

  });

  describe('team member management', function() {
    it('takes you to the team member page', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .get('/org/bigco')
        .reply(200, fixtures.orgs.bigco)
        .get('/org/bigco/user?per_page=100&page=0')
        .reply(200, fixtures.orgs.bigcoAddedUsers)
        .get('/org/bigco/package?per_page=100&page=0')
        .reply(200, {
          count: 1,
          items: [fixtures.packages.fake]
        })
        .get('/org/bigco/team')
        .reply(200, fixtures.teams.bigcoOrg)
        .get('/team/bigco/bigcoteam')
        .reply(200, fixtures.teams.bigcoteam)
        .get('/team/bigco/bigcoteam/user')
        .reply(200, fixtures.teams.bigcoteamUsers)
        .get('/team/bigco/bigcoteam/package?format=detailed')
        .reply(200, fixtures.teams.bigcoteamPackages);

      var options = {
        url: "/org/bigco/team/bigcoteam#members",
        method: "GET",
        credentials: fixtures.users.bob,
      };

      server.inject(options, function(resp) {
        userMock.done();
        licenseMock.done();
        orgMock.done();
        expect(resp.statusCode).to.equal(200);
        expect(resp.request.response.source.template).to.equal('team/show');
        done();
      });
    });

    it('allows a super/team-admin to remove a user from a team', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .delete('/team/bigco/bigcoteam/user', {
          user: 'betty'
        })
        .reply(200);

      generateCrumb(server, function(crumb) {

        var options = {
          url: "/org/bigco/team/bigcoteam",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            "name": "betty",
            updateType: 'removeUser',
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
          expect(resp.request.response.headers.location).to.equal('/org/bigco/team/bigcoteam#members');
          done();
        });
      });
    });

    it('does not allow a team member to remove a user from a team', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var orgMock = nock("https://user-api-example.com")
        .delete('/team/bigco/bigcoteam/user', {
          user: 'betty'
        })
        .reply(401);

      generateCrumb(server, function(crumb) {

        var options = {
          url: "/org/bigco/team/bigcoteam",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            "name": "betty",
            updateType: 'removeUser',
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(options, function(resp) {
          userMock.done();
          orgMock.done();
          var redirectPath = resp.headers.location;
          var url = URL.parse(redirectPath);
          var query = url.query;
          var token = qs.parse(query).notice;
          var tokenFacilitator = new TokenFacilitator({
            redis: redisClient
          });
          expect(token).to.be.string();
          expect(token).to.not.be.empty();
          expect(resp.statusCode).to.equal(302);
          tokenFacilitator.read(token, {
            prefix: "notice:"
          }, function(err, notice) {
            expect(err).to.not.exist();
            expect(notice.notices).to.be.array();
            expect(notice.notices[0]).to.equal('user must be admin to perform this operation');
            done();
          });
        });
      });
    });
  });

  describe('team description', function() {
    it('renders an error notice if description is empty', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      generateCrumb(server, function(crumb) {

        var options = {
          url: "/org/bigco/team/bigcoteam",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            "team-description": "",
            updateType: 'updateInfo',
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          expect(resp.statusCode).to.equal(302);
          expect(resp.request.response.headers.location).to.include('/org/bigco/team/bigcoteam?notice=');
          done();
        });
      });
    });

    it('allows super/team admins to update the team description', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      var orgMock = nock("https://user-api-example.com")
        .post('/team/bigco/bigcoteam', {
          description: 'best team ever'
        })
        .reply(200);

      generateCrumb(server, function(crumb) {

        var options = {
          url: "/org/bigco/team/bigcoteam",
          method: "POST",
          credentials: fixtures.users.bob,
          payload: {
            "team-description": "best team ever",
            updateType: 'updateInfo',
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
          expect(resp.request.response.headers.location).to.equal('/org/bigco/team/bigcoteam#settings');
          done();
        });
      });
    });
  });
});

