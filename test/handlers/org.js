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

var URL = require('url');
var qs = require('qs');


var requireInject = require('require-inject');
var redisMock = require('redis-mock');
var client = redisMock.createClient();

var TokenFacilitator = require('token-facilitator');

before(function(done) {
  process.env.FEATURE_ORG_BILLING = 'bob';
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

describe('getting to the org marketing page', function() {
  it('takes you to the test-orgs signup if you are not logged in or invited to the beta', function(done) {
    var options = {
      url: "/org"
    };

    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('/test-orgs');
      done();
    });
  });

  it('takes you to the test-orgs signup if you are logged in but not whitelisted for the beta', function(done) {
    var userMock = nock("https://user-api-example.com")
      .get("/user/bcoe")
      .reply(200, fixtures.users.bcoe);

    var options = {
      url: "/org",
      credentials: fixtures.users.bcoe
    };

    server.inject(options, function(resp) {
      userMock.done();
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('/test-orgs');
      done();
    });
  });

  it('takes you to the login page (with redirect to the org marketing page) if you are not logged in but have been invited to the beta', function(done) {
    var options = {
      url: "/org?join-beta"
    };

    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.equal('/login?done=%2Forg');
      done();
    });
  });

  it('takes you to the marketing page if you are logged in and whitelisted for the beta', function(done) {
    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, fixtures.users.bob);

    var options = {
      url: "/org?join-beta",
      credentials: fixtures.users.bob
    };

    server.inject(options, function(resp) {
      userMock.done();
      expect(resp.statusCode).to.equal(200);
      expect(resp.request.response.source.template).to.equal('org/index');
      done();
    });
  });

  it('redirects from /orgs properly', function(done) {
    var options = {
      url: "/orgs"
    };

    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(301);
      expect(resp.headers.location).to.equal('/org');
      done();
    });
  });

  it('redirects from /orgs?join-beta properly', function(done) {
    var options = {
      url: "/orgs?join-beta"
    };

    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(301);
      expect(resp.headers.location).to.equal('/org?join-beta');
      done();
    });
  });
});

describe('getting an org', function() {
  it('does not include sponsorships if the org has not sponsored anyone', function(done) {
    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com:443")
      .get("/customer/bob@boom.me")
      .reply(200, fixtures.customers.fetched_happy);

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
      url: "/org/bigco",
      credentials: fixtures.users.bob
    };

    server.inject(options, function(resp) {
      userMock.done();
      licenseMock.done();
      orgMock.done();
      expect(resp.statusCode).to.equal(200);
      expect(resp.request.response.source.template).to.equal('org/info');
      var users = resp.request.response.source.context.org.users.items;
      var sponsoredByOrg = users.filter(function(user) {
        return user.sponsoredByOrg;
      });
      expect(sponsoredByOrg.length).to.equal(0);
      done();
    });
  });

  it('includes sponsorships if the org has sponsored someone', function(done) {
    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get("/customer/bob@boom.me")
      .reply(200, fixtures.customers.fetched_happy);

    var orgMock = nock("https://user-api-example.com")
      .get('/org/bigco')
      .reply(200, fixtures.orgs.bigco)
      .get('/org/bigco/user')
      .reply(200, fixtures.orgs.bigcoAddedUsers)
      .get('/org/bigco/package')
      .reply(200, {
        count: 1,
        items: [fixtures.packages.fake]
      });

    var options = {
      url: "/org/bigco",
      credentials: fixtures.users.bob
    };

    server.inject(options, function(resp) {
      userMock.done();
      licenseMock.done();
      orgMock.done();
      expect(resp.statusCode).to.equal(200);
      expect(resp.request.response.source.template).to.equal('org/info');
      var users = resp.request.response.source.context.org.users.items;
      var sponsoredByOrg = users.filter(function(user) {
        return user.sponsoredByOrg;
      });
      expect(sponsoredByOrg.length).to.not.equal(0);
      done();
    });
  });

  it('does not show org if org does not exist', function(done) {
    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get("/customer/bob@boom.me")
      .reply(200, fixtures.customers.fetched_happy);

    var orgMock = nock("https://user-api-example.com")
      .get("/org/bigconotthere")
      .reply(404)
      .get("/org/bigconotthere/user")
      .reply(404)
      .get("/org/bigconotthere/package")
      .reply(404);


    var options = {
      url: "/org/bigconotthere",
      credentials: fixtures.users.bob
    };

    server.inject(options, function(resp) {
      userMock.done();
      orgMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(404);
      expect(resp.request.response.source.template).to.equal('errors/not-found');
      done();
    });
  });
});

describe('creating an org', function() {
  it('returns an error if the org scope name is in use by another org', function(done) {
    generateCrumb(server, function(crumb) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var orgMock = nock("https://user-api-example.com")
        .get("/org/bigco")
        .reply(200, fixtures.orgs.bigco)
        .get("/org/bigco/user")
        .reply(200, fixtures.orgs.bigcoAddedUsers)
        .get("/org/bigco/package")
        .reply(200, fixtures.packages.fake);

      var options = {
        url: "/org/create/step-2",
        method: "post",
        credentials: fixtures.users.bob,
        payload: {
          crumb: crumb,
          orgScope: 'bigco',
          fullname: "Bob's big co"
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(options, function(resp) {
        userMock.done();
        orgMock.done();
        expect(resp.request.response.source.template).to.equal('org/create');
        expect(resp.request.response.source.context.notices.length).to.equal(1);
        expect(resp.request.response.source.context.notices[0]).to.equal('The provided org\'s @scope name is already in use');
        done();
      });
    });

  });

  it('returns an error if the org scope name is in use by somebody else\'s name', function(done) {
    generateCrumb(server, function(crumb) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob)
        .get("/user/bigco")
        .reply(200, fixtures.users.bigco);

      var orgMock = nock("https://user-api-example.com")
        .get("/org/bigco")
        .reply(404, fixtures.orgs.bigco)
        .get("/org/bigco/user")
        .reply(404, fixtures.orgs.bigcoAddedUsers)
        .get("/org/bigco/package")
        .reply(404, fixtures.packages.fake);

      var options = {
        url: "/org/create/step-2",
        method: "post",
        credentials: fixtures.users.bob,
        payload: {
          crumb: crumb,
          orgScope: 'bigco',
          fullname: "Bob's big co"
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(options, function(resp) {
        userMock.done();
        orgMock.done();
        expect(resp.request.response.source.template).to.equal('org/create');
        expect(resp.request.response.source.context.notices.length).to.equal(1);
        expect(resp.request.response.source.context.notices[0]).to.equal('The provided org\'s @scope name is already in use');
        done();
      });
    });
  });

  it('returns an error if the org scope name is in use by the current user\'s name', function(done) {
    generateCrumb(server, function(crumb) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var options = {
        url: "/org/create/step-2",
        method: "post",
        credentials: fixtures.users.bob,
        payload: {
          crumb: crumb,
          orgScope: 'bob',
          fullname: "Bob's big co"
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(options, function(resp) {
        userMock.done();
        expect(resp.request.response.source.template).to.equal('org/create');
        expect(resp.request.response.source.context.notices.length).to.equal(1);
        expect(resp.request.response.source.context.notices[0]).to.equal('The provided org\'s @scope name is already in use by your username');
        done();
      });
    });
  });

  it('validates that an org is available when its name is not taken by a current user or org', function(done) {
    generateCrumb(server, function(crumb) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob)
        .get("/user/bigco")
        .reply(404, fixtures.users.bigco);

      var orgMock = nock("https://user-api-example.com")
        .get("/org/bigco")
        .reply(404, fixtures.orgs.bigco)
        .get("/org/bigco/user")
        .reply(404, fixtures.orgs.bigcoAddedUsers)
        .get("/org/bigco/package")
        .reply(404, fixtures.packages.fake);

      var options = {
        url: "/org/create/step-2",
        method: "post",
        credentials: fixtures.users.bob,
        payload: {
          crumb: crumb,
          orgScope: 'bigco',
          fullname: "Bob's big co"
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(options, function(resp) {
        userMock.done();
        orgMock.done();
        expect(resp.request.response.source.template).to.equal('org/billing');
        expect(resp.request.response.source.context.notices).to.not.exist();
        done();
      });
    });
  });
});

describe('updating an org', function() {
  describe('adding a user', function() {
    it('renders a redirect if a user cannot be added to an org', function(done) {
      generateCrumb(server, function(crumb) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var orgMock = nock("https://user-api-example.com")
          .put('/org/bigco/user', {
            user: 'betty',
            role: 'developer'
          })
          .reply(404);

        var options = {
          url: "/org/bigco",
          method: "post",
          credentials: fixtures.users.bob,
          payload: {
            username: 'betty',
            role: 'developer',
            updateType: 'addUser',
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
            expect(notice.notices[0]).to.equal('org or user not found');
            done();
          });
        });
      });
    });

    it('renders an error if the license of the org cannot be retrieved', function(done) {
      generateCrumb(server, function(crumb) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe")
          .reply(200, fixtures.customers.happy)
          .get("/customer/bob/stripe/subscription")
          .reply(200, []);

        var orgMock = nock("https://user-api-example.com")
          .put('/org/bigco/user', {
            user: 'betty',
            role: 'developer'
          })
          .reply(200, {
            "created": "2015-08-05T15:26:46.970Z",
            "deleted": null,
            "org_id": 1,
            "role": "developer",
            "updated": "2015-08-05T15:26:46.970Z",
            "user_id": 15
          });

        var options = {
          url: "/org/bigco",
          method: "post",
          credentials: fixtures.users.bob,
          payload: {
            username: 'betty',
            role: 'developer',
            updateType: 'addUser',
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
          expect(resp.request.response.source.template).to.equal('errors/internal');
          done();
        });
      });
    });

    it('renders an eror if a sponsorship cannot be extended', function(done) {
      generateCrumb(server, function(crumb) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe")
          .reply(200, fixtures.customers.happy)
          .get("/customer/bob/stripe/subscription")
          .reply(200, fixtures.users.bobsubscriptions)
          .put("/sponsorship/1", {
            "npm_user": "betty"
          })
          .reply(404);

        var orgMock = nock("https://user-api-example.com")
          .put('/org/bigco/user', {
            user: 'betty',
            role: 'developer'
          })
          .reply(200, {
            "created": "2015-08-05T15:26:46.970Z",
            "deleted": null,
            "org_id": 1,
            "role": "developer",
            "updated": "2015-08-05T15:26:46.970Z",
            "user_id": 15
          });

        var options = {
          url: "/org/bigco",
          method: "post",
          credentials: fixtures.users.bob,
          payload: {
            username: 'betty',
            role: 'developer',
            updateType: 'addUser',
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
          expect(resp.request.response.source.template).to.equal('errors/internal');
          done();
        });
      });
    });

    it('renders an error if a sponsorship cannot be accepted', function(done) {
      generateCrumb(server, function(crumb) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe")
          .reply(200, fixtures.customers.happy)
          .get("/customer/bob/stripe/subscription")
          .reply(200, fixtures.users.bobsubscriptions)
          .put("/sponsorship/1", {
            "npm_user": "betty"
          })
          .reply(200, {
            "created": "2015-08-05T20:55:54.759Z",
            "deleted": null,
            "id": 15,
            "license_id": 1,
            "npm_user": "betty",
            "updated": "2015-08-05T20:55:54.759Z",
            "verification_key": "f56dffef-b136-429a-97dc-57a6ef035829",
            "verified": null
          })
          .post("/sponsorship/f56dffef-b136-429a-97dc-57a6ef035829")
          .reply(404);

        var orgMock = nock("https://user-api-example.com")
          .put('/org/bigco/user', {
            user: 'betty',
            role: 'developer'
          })
          .reply(200, {
            "created": "2015-08-05T15:26:46.970Z",
            "deleted": null,
            "org_id": 1,
            "role": "developer",
            "updated": "2015-08-05T15:26:46.970Z",
            "user_id": 15
          });

        var options = {
          url: "/org/bigco",
          method: "post",
          credentials: fixtures.users.bob,
          payload: {
            username: 'betty',
            role: 'developer',
            updateType: 'addUser',
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
          expect(resp.request.response.source.template).to.equal('errors/internal');
          done();
        });
      });
    });

    it('continues successfully if the user is already paid for', function(done) {
      generateCrumb(server, function(crumb) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock("https://license-api-example.com")
          .get("/customer/bob@boom.me")
          .reply(200, fixtures.customers.fetched_happy)
          .get("/customer/bob/stripe/subscription")
          .reply(200, fixtures.users.bobsubscriptions)
          .put("/sponsorship/1", {
            "npm_user": "betty"
          })
          .reply(200, {
            "created": "2015-08-05T20:55:54.759Z",
            "deleted": null,
            "id": 15,
            "license_id": 1,
            "npm_user": "betty",
            "updated": "2015-08-05T20:55:54.759Z",
            "verification_key": "f56dffef-b136-429a-97dc-57a6ef035829",
            "verified": null
          })
          .post("/sponsorship/f56dffef-b136-429a-97dc-57a6ef035829")
          .reply(409, "duplicate key value violates unique constraint \"sponsorships_npm_user\"");

        var orgMock = nock("https://user-api-example.com")
          .put('/org/bigco/user', {
            user: 'betty',
            role: 'developer'
          })
          .reply(200, {
            "created": "2015-08-05T15:26:46.970Z",
            "deleted": null,
            "org_id": 1,
            "role": "developer",
            "updated": "2015-08-05T15:26:46.970Z",
            "user_id": 15
          })
          .get("/org/bigco")
          .reply(200, fixtures.orgs.bigco)
          .get("/org/bigco/user")
          .reply(200, fixtures.orgs.bigcoAddedUsers)
          .get("/org/bigco/package")
          .reply(200, fixtures.packages.fake);

        var options = {
          url: "/org/bigco",
          method: "post",
          credentials: fixtures.users.bob,
          payload: {
            username: 'betty',
            role: 'developer',
            updateType: 'addUser',
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
          expect(resp.request.response.source.template).to.equal('org/info');
          done();
        });
      });
    });

    it('successfully adds the user to the org', function(done) {
      generateCrumb(server, function(crumb) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock("https://license-api-example.com")
          .get("/customer/bob@boom.me")
          .reply(200, fixtures.customers.fetched_happy)
          .get("/customer/bob/stripe/subscription")
          .reply(200, fixtures.users.bobsubscriptions)
          .put("/sponsorship/1", {
            "npm_user": "betty"
          })
          .reply(200, {
            "created": "2015-08-05T20:55:54.759Z",
            "deleted": null,
            "id": 15,
            "license_id": 1,
            "npm_user": "betty",
            "updated": "2015-08-05T20:55:54.759Z",
            "verification_key": "f56dffef-b136-429a-97dc-57a6ef035829",
            "verified": null
          })
          .post("/sponsorship/f56dffef-b136-429a-97dc-57a6ef035829")
          .reply(200, {
            "created": "2015-08-05T20:59:32.707Z",
            "deleted": null,
            "id": 15,
            "license_id": 1,
            "npm_user": "betty",
            "updated": "2015-08-05T20:59:41.538Z",
            "verification_key": "f56dffef-b136-429a-97dc-57a6ef035829",
            "verified": true
          });

        var orgMock = nock("https://user-api-example.com")
          .put('/org/bigco/user', {
            user: 'betty',
            role: 'developer'
          })
          .reply(200, {
            "created": "2015-08-05T15:26:46.970Z",
            "deleted": null,
            "org_id": 1,
            "role": "developer",
            "updated": "2015-08-05T15:26:46.970Z",
            "user_id": 15
          })
          .get("/org/bigco")
          .reply(200, fixtures.orgs.bigco)
          .get("/org/bigco/user")
          .reply(200, fixtures.orgs.bigcoAddedUsers)
          .get("/org/bigco/package")
          .reply(200, fixtures.packages.fake);

        var options = {
          url: "/org/bigco",
          method: "post",
          credentials: fixtures.users.bob,
          payload: {
            username: 'betty',
            role: 'developer',
            updateType: 'addUser',
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
          expect(resp.request.response.source.template).to.equal('org/info');
          done();
        });
      });
    });
  });

  describe('removing a user', function() {
    it('renders an error if the org license cannot be retrieved', function(done) {
      generateCrumb(server, function(crumb) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe")
          .reply(200, fixtures.customers.happy)
          .get("/customer/bob/stripe/subscription")
          .reply(404);

        var options = {
          url: "/org/bigco",
          method: "post",
          credentials: fixtures.users.bob,
          payload: {
            username: 'betty',
            role: 'developer',
            updateType: 'deleteUser',
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          expect(resp.statusCode).to.equal(404);
          expect(resp.request.response.source.template).to.equal('errors/internal');
          done();
        });
      });
    });

    it('renders an error if the sponsorship cannot be revoked', function(done) {
      generateCrumb(server, function(crumb) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe")
          .reply(200, fixtures.customers.happy)
          .get("/customer/bob/stripe/subscription")
          .reply(200, fixtures.users.bobsubscriptions)
          .delete("/sponsorship/1/betty")
          .reply(404);

        var options = {
          url: "/org/bigco",
          method: "post",
          credentials: fixtures.users.bob,
          payload: {
            username: 'betty',
            role: 'developer',
            updateType: 'deleteUser',
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          expect(resp.statusCode).to.equal(404);
          expect(resp.request.response.source.template).to.equal('errors/internal');
          done();
        });
      });
    });

    it('renders an error if the org is unable to remove the user', function(done) {
      generateCrumb(server, function(crumb) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe")
          .reply(200, fixtures.customers.happy)
          .get("/customer/bob/stripe/subscription")
          .reply(200, fixtures.users.bobsubscriptions)
          .delete("/sponsorship/1/betty")
          .reply(200, {
            "created": "2015-08-05T20:55:54.759Z",
            "deleted": "2015-08-05T15:30:46.970Z",
            "id": 15,
            "license_id": 1,
            "npm_user": "betty",
            "updated": "2015-08-05T20:55:54.759Z",
            "verification_key": "f56dffef-b136-429a-97dc-57a6ef035829",
            "verified": null
          });

        var orgMock = nock("https://user-api-example.com")
          .delete('/org/bigco/user/betty')
          .reply(404);

        var options = {
          url: "/org/bigco",
          method: "post",
          credentials: fixtures.users.bob,
          payload: {
            username: 'betty',
            role: 'developer',
            updateType: 'deleteUser',
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
          expect(resp.request.response.source.template).to.equal('errors/internal');
          done();
        });
      });
    });

    it('successfully deletes the user from the organization', function(done) {
      generateCrumb(server, function(crumb) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock("https://license-api-example.com")
          .get("/customer/bob@boom.me")
          .reply(200, fixtures.customers.fetched_happy)
          .get("/customer/bob/stripe/subscription")
          .reply(200, fixtures.users.bobsubscriptions)
          .delete("/sponsorship/1/betty")
          .reply(200, {
            "created": "2015-08-05T20:55:54.759Z",
            "deleted": "2015-08-05T15:30:46.970Z",
            "id": 15,
            "license_id": 1,
            "npm_user": "betty",
            "updated": "2015-08-05T20:55:54.759Z",
            "verification_key": "f56dffef-b136-429a-97dc-57a6ef035829",
            "verified": null
          });

        var orgMock = nock("https://user-api-example.com")
          .delete('/org/bigco/user/betty')
          .reply(200, {
            "created": "2015-08-05T15:26:46.970Z",
            "deleted": "2015-08-05T15:30:46.970Z",
            "org_id": 1,
            "role": "developer",
            "updated": "2015-08-05T15:26:46.970Z",
            "user_id": 15
          })
          .get("/org/bigco")
          .reply(200, fixtures.orgs.bigco)
          .get("/org/bigco/user")
          .reply(200, fixtures.orgs.bigcoAddedUsers)
          .get('/org/bigco/package')
          .reply(200, {
            count: 1,
            items: [fixtures.packages.fake]
          });

        var options = {
          url: "/org/bigco",
          method: "post",
          credentials: fixtures.users.bob,
          payload: {
            username: 'betty',
            role: 'developer',
            updateType: 'deleteUser',
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
          expect(resp.request.response.source.template).to.equal('org/info');
          done();
        });
      });
    });
  });

  describe('updating paid status of user', function() {
    it('adds paid for status when prompted', function(done) {
      generateCrumb(server, function(crumb) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var orgMock = nock("https://user-api-example.com")
          .get("/org/bigco")
          .reply(200, fixtures.orgs.bigco)
          .get("/org/bigco/user")
          .reply(200, fixtures.orgs.bigcoAddedUsers)
          .get("/org/bigco/package")
          .reply(200, fixtures.packages.fake);

        var licenseMock = nock("https://license-api-example.com:443")
          .get("/customer/bob@boom.me")
          .reply(200, fixtures.customers.fetched_happy)
          .get("/customer/bob/stripe/subscription")
          .reply(200, fixtures.users.bobsubscriptions)
          .put("/sponsorship/1", {
            "npm_user": "betty"
          })
          .reply(200, {
            "id": 15,
            "npm_user": "betty",
            "created": "2015-08-05T20:55:54.759Z",
            "updated": "2015-08-05T20:55:54.759Z",
            "deleted": null,
            "verification_key": "f56dffef-b136-429a-97dc-57a6ef035829",
            "verified": null
          })
          .post("/sponsorship/f56dffef-b136-429a-97dc-57a6ef035829")
          .reply(200, {
            "id": 15,
            "npm_user": "betty",
            "created": "2015-08-05T20:55:54.759Z",
            "updated": "2015-08-05T20:55:54.759Z",
            "deleted": null,
            "verification_key": "f56dffef-b136-429a-97dc-57a6ef035829",
            "verified": true
          });

        var options = {
          url: "/org/bigco",
          method: "post",
          credentials: fixtures.users.bob,
          payload: {
            username: 'betty',
            payStatus: 'on',
            updateType: 'updatePayStatus',
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };


        server.inject(options, function(resp) {
          userMock.done();
          orgMock.done();
          licenseMock.done();
          expect(resp.statusCode).to.equal(200);
          expect(resp.request.response.source.template).to.equal('org/info');
          var betty = resp.request.response.source.context.org.users.items.filter(function(user) {
            return user.name === 'betty';
          })[0];
          expect(betty.sponsoredByOrg).to.equal(true);
          done();
        });
      });
    });

    it('removes paid for status when prompted', function(done) {
      generateCrumb(server, function(crumb) {
        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var orgMock = nock("https://user-api-example.com")
          .get("/org/bigco")
          .reply(200, fixtures.orgs.bigco)
          .get("/org/bigco/user")
          .reply(200, fixtures.orgs.bigcoAddedUsersNotPaid)
          .get("/org/bigco/package")
          .reply(200, fixtures.packages.fake);

        var licenseMock = nock("https://license-api-example.com")
          .get("/customer/bob@boom.me")
          .reply(200, fixtures.customers.fetched_happy)
          .get("/customer/bob/stripe/subscription")
          .reply(200, fixtures.users.bobsubscriptions)
          .delete("/sponsorship/1/betty")
          .reply(200, {
            "created": "2015-08-05T20:55:54.759Z",
            "deleted": "2015-08-05T15:30:46.970Z",
            "id": 15,
            "license_id": 1,
            "npm_user": "betty",
            "updated": "2015-08-05T20:55:54.759Z",
            "verification_key": "f56dffef-b136-429a-97dc-57a6ef035829",
            "verified": null
          });

        var options = {
          url: "/org/bigco",
          method: "post",
          credentials: fixtures.users.bob,
          payload: {
            username: 'betty',
            updateType: 'updatePayStatus',
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(options, function(resp) {
          userMock.done();
          orgMock.done();
          licenseMock.done();
          var betty = resp.request.response.source.context.org.users.items.filter(function(user) {
            return user.name === 'betty';
          })[0];
          expect(resp.statusCode).to.equal(200);
          expect(betty.sponsored).to.equal(false);
          done();
        });
      });
    });
  });
});

describe('deleting an org', function() {
  it('unsubscribes from an org when it is asked to be deleted', function(done) {
    generateCrumb(server, function(crumb) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var licenseMock = nock("https://license-api-example.com")
        .get("/customer/bob/stripe/subscription")
        .reply(200, fixtures.users.bobsubscriptions)
        .delete("/customer/bob/stripe/subscription/sub_abcd")
        .reply(200, {
          "id": "sub_abcd",
          "current_period_end": 1439766874,
          "current_period_start": 1437088474,
          "quantity": 2,
          "status": "active",
          "interval": "month",
          "amount": 700,
          "license_id": 1,
          "npm_org": "bigco",
          "npm_user": "bob",
          "product_id": "1031405a-70b7-4a3f-b557-8609d9e1428a"
        });

      var options = {
        url: "/org/bigco",
        method: "POST",
        payload: {
          updateType: "deleteOrg",
          crumb: crumb,
        },
        credentials: fixtures.users.bob,
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(options, function(resp) {
        userMock.done();
        licenseMock.done();
        expect(resp.statusCode).to.equal(200);
        done();
      });
    });
  });
});