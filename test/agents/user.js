var USER_API = 'https://user-api-example.com';

var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  nock = require("nock"),
  sinon = require("sinon"),
  cache = require("../../lib/cache"),
  fixtures = require('../fixtures');

var P = require('bluebird');
var redisPool = require('../../lib/redis-pool');

var User = require("../../agents/user");

before(function(done) {
  process.env.USE_CACHE = 'true';
  process.env.LICENSE_API = "https://license-api-example.com";
  cache.configure({
    redis: "redis://localhost:6379",
    ttl: 5,
    prefix: "cache:"
  });
  done();
});

after(function(done) {
  delete process.env.USE_CACHE;
  cache.disconnect();
  done();
});

describe("User", function() {

  describe("login", function() {

    it("makes an external request for /{user}/login", function(done) {
      var userMock = nock(USER_API)
        .post('/user/bob/login')
        .reply(200, fixtures.users.bob);

      var loginInfo = {
        name: 'bob',
        password: '12345'
      };

      new User().login(loginInfo, function(err, user) {
        try {
          expect(err).to.be.null();
          expect(user).to.exist();
          userMock.done();
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  describe("verifyPassword", function() {
    it("is essentially login with separated params", function(done) {
      var bob = fixtures.users.bob;

      var userMock = nock(USER_API)
        .post('/user/' + bob.name + '/login')
        .reply(200, bob);

      new User().verifyPassword(bob.name, '12345', function(err, user) {
        try {
          expect(err).to.be.null();
          expect(user).to.exist();
          userMock.done();
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  describe("generate options for user ACL", function() {
    it("formats the options object for request/cache", function(done) {
      var obj = new User().generateUserACLOptions('foobar');
      expect(obj).to.be.an.object();
      expect(obj.url).to.equal(USER_API + '/user/foobar');
      expect(obj.json).to.be.true();
      done();
    });
  });

  describe("get()", function() {

    it("makes an external request for /{user} and returns the response body in the callback", function(done) {
      var userMock = nock(USER_API)
        .get('/user/bob')
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      new User().dropCache(fixtures.users.bob.name, function(err) {
        try {
          expect(err).to.not.exist();
          new User().get(fixtures.users.bob.name, function(err, body) {
            try {
              userMock.done();
              licenseMock.done();
              expect(err).to.be.null();
              expect(body).to.exist();
              expect(body.name).to.equal("bob");
              expect(body.email).to.exist();
              expect(body.isPaid).to.be.false();
              done();
            } catch (e) {
              done(e);
            }
          });
        } catch (e) {
          done(e);
        }
      });
    });

    it("doesn't make another external request due to caching", function(done) {
      // no need for nock because no request will be made

      new User().get(fixtures.users.bob.name, function(err, body) {
        try {
          expect(err).to.be.null();
          expect(body).to.exist();

          expect(body.name).to.equal("bob");
          expect(body.email).to.exist();
          expect(body.isPaid).to.exist();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("makes the external request again if the cache is dropped", function(done) {
      var userMock = nock(USER_API)
        .get('/user/bob')
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(200, fixtures.customers.bob);

      new User().dropCache(fixtures.users.bob.name, function(err) {

        try {
          expect(err).to.not.exist();
          new User().get(fixtures.users.bob.name, function(err, body) {
            try {
              expect(err).to.be.null();
              expect(body.name).to.equal("bob");
              expect(body.isPaid).to.be.true();
              userMock.done();
              licenseMock.done();
              done();
            } catch (e) {
              done(e);
            }
          });
        } catch (e) {
          done(e);
        }
      });
    });

    it("returns an error in the callback if the request failed", function(done) {
      var userMock = nock(USER_API)
        .get('/user/foo')
        .reply(404);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/foo/stripe')
        .reply(404);


      new User().get('foo', function(err, body) {
        try {
          expect(err).to.exist();
          expect(err.message).to.equal("unexpected status code 404");
          expect(body).to.not.exist();
          userMock.done();
          licenseMock.done();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("does not require a bearer token", function(done) {
      new User().dropCache('hermione', function(err) {
        try {
          expect(err).to.not.exist();

          var userMock = nock(USER_API, {
            reqheaders: {}
          })
            .get('/user/hermione')
            .reply(200);
          var licenseMock = nock('https://license-api-example.com')
            .get('/customer/hermione/stripe')
            .reply(404);

          new User().get('hermione', function(err, body) {
            try {
              expect(err).to.be.null();
              expect(body).to.exist();
              userMock.done();
              licenseMock.done();
              done();
            } catch (e) {
              done(e);
            }
          });
        } catch (e) {
          done(e);
        }
      });
    });
  });

  describe("getPackages()", function() {

    var body = {
      items: [
        {
          name: "foo",
          description: "It's a foo!",
          access: "restricted"
        },
        {
          name: "bar",
          description: "It's a bar!",
          access: "public"
        }
      ],
      count: 2
    };

    it("makes an external request for /{user}/package", function(done) {
      var packageMock = nock(USER_API)
        .get('/user/bob/package?format=mini&per_page=100&page=0')
        .reply(200, []);

      new User().getPackages(fixtures.users.bob.name, function(err, body) {
        try {
          packageMock.done();
          expect(err).to.be.null();
          expect(body).to.exist();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("returns the response body in the callback", function(done) {
      var packageMock = nock(USER_API)
        .get('/user/bob/package?format=mini&per_page=100&page=0')
        .reply(200, body);

      new User().getPackages(fixtures.users.bob.name, function(err, body) {
        try {
          expect(err).to.be.null();
          expect(body).to.be.an.object();
          expect(body.items).to.be.an.array();
          expect(body.items[0].name).to.equal("foo");
          expect(body.items[1].name).to.equal("bar");
          packageMock.done();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("updates privacy of packages", function(done) {
      var packageMock = nock(USER_API)
        .get('/user/bob/package?format=mini&per_page=100&page=0')
        .reply(200, body);

      new User().getPackages(fixtures.users.bob.name, function(err, body) {
        try {
          expect(err).to.be.null();
          expect(body).to.be.an.object();
          expect(body.items).to.be.an.array();
          expect(body.items[0].isPrivate).to.be.true();
          expect(body.items[1].isPrivate).to.not.exist();
          packageMock.done();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("returns an error in the callback if the request failed", function(done) {
      var packageMock = nock(USER_API)
        .get('/user/foo/package?format=mini&per_page=100&page=0')
        .reply(404);

      new User().getPackages('foo', function(err, body) {
        try {
          expect(err).to.exist();
          expect(err.message).to.equal("error getting packages for user foo");
          expect(err.statusCode).to.equal(404);
          expect(body).to.not.exist();
          packageMock.done();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("includes bearer token in request header if user is logged in", function(done) {

      var packageMock = nock(USER_API, {
        reqheaders: {
          bearer: 'sally'
        }
      })
        .get('/user/sally/package?format=mini&per_page=100&page=0')
        .reply(200, body);

      new User({
        name: "sally"
      }).getPackages('sally', function(err, body) {
        try {
          expect(err).to.be.null();
          expect(body).to.exist();
          packageMock.done();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("does not include bearer token in request header if user is not logged in", function(done) {
      var packageMock = nock(USER_API)
        .get('/user/sally/package?format=mini&per_page=100&page=0')
        .reply(200, body);

      new User().getPackages('sally', function(err, body) {
        expect(err).to.be.null();
        expect(body).to.exist();
        packageMock.done();
        done();
      });
    });

    it("gets a specific page of packages", function(done) {
      var packageMock = nock(USER_API)
        .get('/user/sally/package?format=mini&per_page=100&page=2')
        .reply(200, body);

      new User().getPackages('sally', 2, function(err, body) {
        try {
          expect(err).to.be.null();
          expect(body).to.exist();
          expect(body.hasMore).to.be.undefined();
          packageMock.done();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("adds a `hasMore` key for groups that have more packages hiding", function(done) {
      var arr = [];
      for (var i = 0, l = 100; i < l; ++i) {
        arr.push({
          name: "foo" + i,
          description: "It's a foo!",
          access: "public"
        });
      }

      var body = {
        items: arr,
        count: 150
      };

      var packageMock = nock(USER_API)
        .get('/user/sally/package?format=mini&per_page=100&page=0')
        .reply(200, body);

      new User().getPackages('sally', 0, function(err, body) {
        try {
          expect(err).to.be.null();
          expect(body).to.exist();
          expect(body.hasMore).to.be.true();
          packageMock.done();
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  describe("getOwnedPackages()", function() {
    it('gets all the packages the user has write access to', function(done) {
      var packageMock = nock(USER_API)
        .get('/user/bob/package/owner?per_page=9999')
        .reply(200, fixtures.users.ownedPackages);

      new User().getOwnedPackages('bob')
        .then(function(body) {
          packageMock.done();
          expect(body.items[0].name).to.equal('@bigco/boom');
        }).then(done, done);
    });
  });

  describe("getStars()", function() {

    it("makes an external request for /{user}/stars?format=detailed", function(done) {
      var starMock = nock(USER_API)
        .get('/user/bcoe/stars?format=detailed')
        .reply(200, ['lodash', 'nock', 'yargs']);

      new User().getStars('bcoe', function(err, body) {
        try {
          starMock.done();
          expect(err).to.be.null();
          expect(body).to.exist();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("returns the response body in the callback", function(done) {
      var starMock = nock(USER_API)
        .get('/user/ceej/stars?format=detailed')
        .reply(200, ['blade', 'minimist']);

      new User().getStars('ceej', function(err, body) {
        try {
          expect(err).to.be.null();
          expect(body).to.be.an.array();
          expect(body[0]).to.equal("blade");
          expect(body[1]).to.equal("minimist");
          starMock.done();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("returns an error in the callback if the request failed", function(done) {
      var starMock = nock(USER_API)
        .get('/user/zeke/stars?format=detailed')
        .reply(404);

      new User().getStars('zeke', function(err, body) {
        try {
          starMock.done();
          expect(err).to.exist();
          expect(err.message).to.equal("error getting stars for user zeke");
          expect(err.statusCode).to.equal(404);
          expect(body).to.not.exist();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("includes bearer token in request header if user is logged in", function(done) {

      var starMock = nock(USER_API, {
        reqheaders: {
          bearer: 'rod11'
        }
      })
        .get('/user/rod11/stars?format=detailed')
        .reply(200, 'something');

      new User({
        name: "rod11"
      }).getStars('rod11', function(err, body) {
        try {
          expect(err).to.be.null();
          expect(body).to.exist();
          starMock.done();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("does not include bearer token in request header if user is not logged in", function(done) {
      var starMock = nock(USER_API)
        .get('/user/rod11/stars?format=detailed')
        .reply(200, 'something');

      new User().getStars('rod11', function(err, body) {
        expect(err).to.be.null();
        expect(body).to.exist();
        starMock.done();
        done();
      });
    });
  });

  describe("lookup users by email", function() {
    it("returns an error for invalid email addresses", function(done) {
      new User().lookupEmail('barf', function(err, usernames) {
        try {
          expect(err).to.exist();
          expect(err.statusCode).to.equal(400);
          expect(usernames).to.be.undefined();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("returns an array of email addresses", function(done) {
      var lookupMock = nock(USER_API)
        .get('/user/ohai@boom.com')
        .reply(200, ['user', 'user2']);

      new User().lookupEmail('ohai@boom.com', function(err, usernames) {
        try {
          expect(err).to.not.exist();
          expect(usernames).to.be.an.array();
          expect(usernames[0]).to.equal('user');
          expect(usernames[1]).to.equal('user2');
          lookupMock.done();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("passes any errors on to the controller", function(done) {
      var lookupMock = nock(USER_API)
        .get('/user/ohai@boom.com')
        .reply(400, []);

      new User().lookupEmail('ohai@boom.com', function(err, usernames) {
        try {
          expect(err).to.exist();
          expect(err.statusCode).to.equal(400);
          expect(usernames).to.not.exist();
          lookupMock.done();
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  describe("signup", function() {
    var signupInfo = {
      name: 'hello',
      password: '12345',
      email: 'hello@hi.com'
    };

    var userObj = {
      name: signupInfo.name,
      email: "hello@hi.com"
    };

    it("passes any errors along", function(done) {
      var signupMock = nock(USER_API)
        .put('/user', signupInfo)
        .reply(400);

      new User().signup(signupInfo, function(err, user) {
        try {
          expect(err).to.exist();
          expect(err.statusCode).to.equal(400);
          expect(user).to.not.exist();
          signupMock.done();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("returns a user object when successful", function(done) {
      var signupMock = nock(USER_API)
        .put('/user', signupInfo)
        .reply(200, userObj);

      new User().signup(signupInfo, function(err, user) {
        try {
          expect(err).to.not.exist();
          expect(user).to.exist();
          expect(user.name).to.equal(signupInfo.name);
          signupMock.done();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    describe('the mailing list checkbox', function() {
      var params = {
        id: 'e17fe5d778',
        email: {
          email: 'boom@boom.com'
        }
      };

      it('adds the user to the mailing list when checked', function(done) {

        var userMock = nock(USER_API)
          .put('/user', {
            "name": "boom",
            "password": "12345",
            "verify": "12345",
            "email": "boom@boom.com",
            "npmweekly": "on"
          })
          .reply(201);

        var originalMailchimp = User.prototype.getMailchimp;
        var spy = sinon.spy();

        User.prototype.getMailchimp = function() {
          return {
            lists: {
              subscribe: spy
            }
          };
        };

        new User().signup({
          name: 'boom',
          password: '12345',
          verify: '12345',
          email: 'boom@boom.com',
          npmweekly: "on"
        }, function(er, user) {
          try {
            expect(er).to.not.exist();
            userMock.done();
            expect(spy.calledWith(params)).to.be.true();
            User.prototype.getMailchimp = originalMailchimp;
            done();
          } catch (e) {
            done(e);
          }
        });
      });

      it('does not add the user to the mailing list when unchecked', function(done) {

        var originalMailchimp = User.prototype.getMailchimp;
        var spy = sinon.spy(function(a, b, c) {});

        new User().getMailchimp = function() {
          return {
            lists: {
              subscribe: spy
            }
          };
        };

        new User().signup({
          name: 'boom',
          password: '12345',
          verify: '12345',
          email: 'boom@boom.com'
        }, function(er, user) {
          try {
            expect(spy.called).to.be.false();
            User.prototype.getMailchimp = originalMailchimp;
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });
  });

  describe("save", function() {
    var profile = {
      name: "npmjs",
      resources: {
        twitter: "npmjs",
        github: ""
      }
    };

    var userObj = {
      name: "npmjs",
      email: "support@npmjs.com",
      resources: {
        twitter: "npmjs",
        github: ""
      }
    };

    it("bubbles up any errors that might occur", function(done) {
      var saveMock = nock(USER_API)
        .post('/user/npmjs', profile)
        .reply(400);

      new User().save(profile, function(err, user) {
        try {
          expect(err).to.exist();
          expect(err.statusCode).to.equal(400);
          expect(user).to.not.exist();
          saveMock.done();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("hits the save url", function(done) {
      var saveMock = nock(USER_API)
        .post('/user/npmjs', profile)
        .reply(200, userObj);

      new User().save(profile, function(err, user) {
        try {
          expect(err).to.not.exist();
          expect(user).to.exist();
          expect(user.name).to.equal('npmjs');
          expect(user.email).to.equal('support@npmjs.com');
          saveMock.done();
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  describe("user to org", function() {

    it("needs bearer", function(done) {
      var postOpts = {
        new_username: "npmjs-admin"
      };

      var userMock = nock(USER_API)
        .post('/user/npmjs/to-org', postOpts)
        .reply(400);

      new User().toOrg("npmjs", "npmjs-admin", function(err, data) {
        try {
          userMock.done();
          expect(err).to.exist();
          expect(err.statusCode).to.equal(400);
          expect(err.message).to.equal("you need authentication to give ownership of the new org to another existing user");
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("cannot have org name that already exists", function(done) {
      var postOpts = {
        new_username: "bigco"
      };

      var userMock = nock(USER_API)
        .post('/user/npmjs/to-org', postOpts)
        .reply(409);

      new User({
        name: "npmjs"
      }).toOrg("npmjs", "bigco", function(err, data) {
        try {
          userMock.done();
          expect(err).to.exist();
          expect(err.statusCode).to.equal(409);
          expect(err.message).to.equal("a user or org already exists with the username you're trying to create as an owner");
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("returns an org with the same username", function(done) {
      var postOpts = {
        new_username: "npmjs-admin"
      };

      var orgObj = {
        name: "npmjs",
        description: "",
        resource: {},
        created: "2015-06-19T23:35:42.659Z",
        updated: "2015-06-19T23:35:42.659Z",
        deleted: null
      };

      var userMock = nock(USER_API)
        .post('/user/npmjs/to-org', postOpts)
        .reply(200, orgObj);

      new User({
        name: "npmjs"
      }).toOrg("npmjs", "npmjs-admin", function(err, data) {
        try {
          userMock.done();
          expect(err).to.be.null();
          expect(data.name).to.equal("npmjs");
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  describe('cli tokens', function() {
    it('gets tokens from the user-acl', function(done) {
      var userMock = nock(USER_API)
        .get("/user/bob/tokens")
        .reply(200, fixtures.users.bobTokens);

      new User().getCliTokens("bob")
        .catch(function(err) {
          expect(err).to.be.null();
        })
        .then(function(data) {
          expect(data).to.be.an.array();
          expect(data[0]).to.include('token');
        })
        .finally(function() {
          userMock.done();
          done();
        });
    });

    it('returns an error if there is one while getting tokens', function(done) {
      var userMock = nock(USER_API)
        .get("/user/bob/tokens")
        .reply(404);

      new User().getCliTokens("bob")
        .catch(function(err) {
          expect(err).to.exist();
          expect(err.statusCode).to.equal(404);
          expect(err.message).to.equal('error getting cli tokens for user bob');
        })
        .then(function(data) {
          expect(data).to.be.undefined();
        })
        .finally(function() {
          userMock.done();
          done();
        });
    });

    it('logs out specific tokens', function(done) {
      var token = fixtures.users.bobTokens[0].token;

      var userMock = nock(USER_API)
        .post("/user/-/logout", {
          'auth_token': token
        })
        .reply(200);

      new User().logoutCliToken(token).then(function() {
        userMock.done();
      }).then(done, done);
    });

    it('returns an error if unable to log out a specific token', function(done) {
      var token = fixtures.users.bobTokens[0].token;

      var userMock = nock(USER_API)
        .post("/user/-/logout", {
          'auth_token': token
        })
        .reply(404);

      new User().logoutCliToken(token)
        .catch(function(err) {
          expect(err).to.exist();
          expect(err.statusCode).to.equal(404);
          expect(err.message).to.equal('error logging token out; token=' + token);
        })
        .then(function(body) {
          expect(body).to.be.undefined();
        })
        .finally(function() {
          userMock.done();
          done();
        });
    });
  });

  describe('page view tracking', function() {
    before(done => redisPool.acquireAsync().then(redis => redis.del('pagesSeenThisSession:test')).then(x => done(), done));

    it('increments the token when given a user object with an sid', function(done) {
      P.join(new User({}).incrPagesSeenThisSession({
        sid: 'test'
      }), redisPool.acquireAsync()).spread(function(incr, redis) {
        return redis.getAsync('pagesSeenThisSession:test').then(pages => {
          expect(Number(pages)).to.equal(1);
        })
      }).then(done, done);
    });

    it('fetches that number', function(done) {
      new User({}).getPagesSeenThisSession({
        sid: 'test'
      }).then(function(pages) {
        expect(Number(pages)).to.equal(1)
      }).then(done, done);
    });
  });
});
