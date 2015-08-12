var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  beforeEach = lab.beforeEach,
  afterEach = lab.afterEach,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  nock = require("nock"),
  sinon = require("sinon"),
  cache = require("../../lib/cache"),
  fixtures = require('../fixtures');

var User, spy;

beforeEach(function(done) {
  User = new (require("../../models/user"))({
    host: "https://user.com"
  });
  spy = sinon.spy(function(a, b, c) {});
  User.getMailchimp = function() {
    return {
      lists: {
        subscribe: spy
      }
    };
  };
  done();
});

afterEach(function(done) {
  User = null;
  done();
});

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

  describe("initialization", function() {
    it("defaults to process.env.USER_API as host", function(done) {
      var USER_API_OLD = process.env.USER_API;
      process.env.USER_API = "https://envy.com/";
      expect(new (require("../../models/user"))().host).to.equal('https://envy.com/');
      process.env.USER_API = USER_API_OLD;
      done();
    });

    it("accepts a custom host", function(done) {
      expect(User.host).to.equal('https://user.com');
      done();
    });

  });

  describe("login", function() {

    it("makes an external request for /{user}/login", function(done) {
      var userMock = nock(User.host)
        .post('/user/bob/login')
        .reply(200, fixtures.users.bob);

      var loginInfo = {
        name: 'bob',
        password: '12345'
      };

      User.login(loginInfo, function(err, user) {
        expect(err).to.be.null();
        expect(user).to.exist();
        userMock.done();
        done();
      });
    });
  });

  describe("verifyPassword", function() {
    it("is essentially login with separated params", function(done) {
      var bob = fixtures.users.bob;

      var userMock = nock(User.host)
        .post('/user/' + bob.name + '/login')
        .reply(200, bob);

      User.verifyPassword(bob.name, '12345', function(err, user) {
        expect(err).to.be.null();
        expect(user).to.exist();
        userMock.done();
        done();
      });
    });
  });

  describe("generate options for user ACL", function() {
    it("formats the options object for request/cache", function(done) {
      var obj = User.generateUserACLOptions('foobar');
      expect(obj).to.be.an.object();
      expect(obj.url).to.equal('https://user.com/user/foobar');
      expect(obj.json).to.be.true();
      done();
    });
  });

  describe("get()", function() {

    it("makes an external request for /{user} and returns the response body in the callback", function(done) {
      var userMock = nock(User.host)
        .get('/user/bob')
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(404);

      User.dropCache(fixtures.users.bob.name, function(err) {
        expect(err).to.not.exist();
        User.get(fixtures.users.bob.name, function(err, body) {
          userMock.done();
          licenseMock.done();
          expect(err).to.be.null();
          expect(body).to.exist();
          expect(body.name).to.equal("bob");
          expect(body.email).to.exist();
          expect(body.isPaid).to.be.false();
          done();
        });
      });
    });

    it("doesn't make another external request due to caching", function(done) {
      // no need for nock because no request will be made

      User.get(fixtures.users.bob.name, function(err, body) {
        expect(err).to.be.null();
        expect(body).to.exist();

        expect(body.name).to.equal("bob");
        expect(body.email).to.exist();
        expect(body.isPaid).to.exist();
        done();
      });
    });

    it("makes the external request again if the cache is dropped", function(done) {
      var userMock = nock(User.host)
        .get('/user/bob')
        .reply(200, fixtures.users.bob);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/bob/stripe')
        .reply(200, fixtures.customers.bob)
        // .get('/customer/bob/stripe/subscription')
        // .reply(200, fixtures.customers.bob_subscriptions);

      User.dropCache(fixtures.users.bob.name, function(err) {
        User.get(fixtures.users.bob.name, function(err, body) {
          expect(err).to.be.null();
          expect(body.name).to.equal("bob");
          expect(body.isPaid).to.be.true();
          userMock.done();
          licenseMock.done();
          done();
        });
      });
    });

    it("returns an error in the callback if the request failed", function(done) {
      var userMock = nock(User.host)
        .get('/user/foo')
        .reply(404);

      var licenseMock = nock('https://license-api-example.com')
        .get('/customer/foo/stripe')
        .reply(404);


      User.get('foo', function(err, body) {
        expect(err).to.exist();
        expect(err.message).to.equal("unexpected status code 404");
        expect(body).to.not.exist();
        userMock.done();
        licenseMock.done();
        done();
      });
    });

    it("does not require a bearer token", function(done) {
      User.dropCache('hermione', function(err) {
        expect(err).to.not.exist();

        var userMock = nock(User.host, {
          reqheaders: {}
        })
          .get('/user/hermione')
          .reply(200);
        var licenseMock = nock('https://license-api-example.com')
          .get('/customer/hermione/stripe')
          .reply(404);

        User.get('hermione', function(err, body) {
          expect(err).to.be.null();
          expect(body).to.exist();
          userMock.done();
          licenseMock.done();
          done();
        });
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
      var packageMock = nock(User.host)
        .get('/user/bob/package?format=mini&per_page=100&page=0')
        .reply(200, []);

      User.getPackages(fixtures.users.bob.name, function(err, body) {
        packageMock.done();
        expect(err).to.be.null();
        expect(body).to.exist();
        done();
      });
    });

    it("returns the response body in the callback", function(done) {
      var packageMock = nock(User.host)
        .get('/user/bob/package?format=mini&per_page=100&page=0')
        .reply(200, body);

      User.getPackages(fixtures.users.bob.name, function(err, body) {
        expect(err).to.be.null();
        expect(body).to.be.an.object();
        expect(body.items).to.be.an.array();
        expect(body.items[0].name).to.equal("foo");
        expect(body.items[1].name).to.equal("bar");
        packageMock.done();
        done();
      });
    });

    it("updates privacy of packages", function(done) {
      var packageMock = nock(User.host)
        .get('/user/bob/package?format=mini&per_page=100&page=0')
        .reply(200, body);

      User.getPackages(fixtures.users.bob.name, function(err, body) {
        expect(err).to.be.null();
        expect(body).to.be.an.object();
        expect(body.items).to.be.an.array();
        expect(body.items[0].isPrivate).to.be.true();
        expect(body.items[1].isPrivate).to.not.exist();
        packageMock.done();
        done();
      });
    });

    it("returns an error in the callback if the request failed", function(done) {
      var packageMock = nock(User.host)
        .get('/user/foo/package?format=mini&per_page=100&page=0')
        .reply(404);

      User.getPackages('foo', function(err, body) {
        expect(err).to.exist();
        expect(err.message).to.equal("error getting packages for user foo");
        expect(err.statusCode).to.equal(404);
        expect(body).to.not.exist();
        packageMock.done();
        done();
      });
    });

    it("includes bearer token in request header if user is logged in", function(done) {

      User = new (require("../../models/user"))({
        host: "https://user.com",
        bearer: "sally"
      });

      var packageMock = nock(User.host, {
        reqheaders: {
          bearer: 'sally'
        }
      })
        .get('/user/sally/package?format=mini&per_page=100&page=0')
        .reply(200, body);

      User.getPackages('sally', function(err, body) {
        expect(err).to.be.null();
        expect(body).to.exist();
        packageMock.done();
        done();
      });
    });

    it("does not include bearer token in request header if user is not logged in", function(done) {
      var packageMock = nock(User.host)
        .get('/user/sally/package?format=mini&per_page=100&page=0')
        .reply(200, body);

      User.getPackages('sally', function(err, body) {
        expect(err).to.be.null();
        expect(body).to.exist();
        packageMock.done();
        done();
      });
    });

    it("gets a specific page of packages", function(done) {
      var packageMock = nock(User.host)
        .get('/user/sally/package?format=mini&per_page=100&page=2')
        .reply(200, body);

      User.getPackages('sally', 2, function(err, body) {
        expect(err).to.be.null();
        expect(body).to.exist();
        expect(body.hasMore).to.be.undefined();
        packageMock.done();
        done();
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

      var packageMock = nock(User.host)
        .get('/user/sally/package?format=mini&per_page=100&page=0')
        .reply(200, body);

      User.getPackages('sally', 0, function(err, body) {
        expect(err).to.be.null();
        expect(body).to.exist();
        expect(body.hasMore).to.be.true();
        packageMock.done();
        done();
      });
    });
  });

  describe("getStars()", function() {

    it("makes an external request for /{user}/stars?format=detailed", function(done) {
      var starMock = nock(User.host)
        .get('/user/bcoe/stars?format=detailed')
        .reply(200, ['lodash', 'nock', 'yargs']);

      User.getStars('bcoe', function(err, body) {
        starMock.done();
        expect(err).to.be.null();
        expect(body).to.exist();
        done();
      });
    });

    it("returns the response body in the callback", function(done) {
      var starMock = nock(User.host)
        .get('/user/ceej/stars?format=detailed')
        .reply(200, ['blade', 'minimist']);

      User.getStars('ceej', function(err, body) {
        expect(err).to.be.null();
        expect(body).to.be.an.array();
        expect(body[0]).to.equal("blade");
        expect(body[1]).to.equal("minimist");
        starMock.done();
        done();
      });
    });

    it("returns an error in the callback if the request failed", function(done) {
      var starMock = nock(User.host)
        .get('/user/zeke/stars?format=detailed')
        .reply(404);

      User.getStars('zeke', function(err, body) {
        starMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal("error getting stars for user zeke");
        expect(err.statusCode).to.equal(404);
        expect(body).to.not.exist();
        done();
      });
    });

    it("includes bearer token in request header if user is logged in", function(done) {

      User = new (require("../../models/user"))({
        host: "https://user.com",
        bearer: "rod11"
      });

      var starMock = nock(User.host, {
        reqheaders: {
          bearer: 'rod11'
        }
      })
        .get('/user/rod11/stars?format=detailed')
        .reply(200, 'something');

      User.getStars('rod11', function(err, body) {
        expect(err).to.be.null();
        expect(body).to.exist();
        starMock.done();
        done();
      });
    });

    it("does not include bearer token in request header if user is not logged in", function(done) {
      var starMock = nock(User.host)
        .get('/user/rod11/stars?format=detailed')
        .reply(200, 'something');

      User.getStars('rod11', function(err, body) {
        expect(err).to.be.null();
        expect(body).to.exist();
        starMock.done();
        done();
      });
    });
  });

  describe("lookup users by email", function() {
    it("returns an error for invalid email addresses", function(done) {
      User.lookupEmail('barf', function(err, usernames) {
        expect(err).to.exist();
        expect(err.statusCode).to.equal(400);
        expect(usernames).to.be.undefined();
        done();
      });
    });

    it("returns an array of email addresses", function(done) {
      var lookupMock = nock(User.host)
        .get('/user/ohai@boom.com')
        .reply(200, ['user', 'user2']);

      User.lookupEmail('ohai@boom.com', function(err, usernames) {
        expect(err).to.not.exist();
        expect(usernames).to.be.an.array();
        expect(usernames[0]).to.equal('user');
        expect(usernames[1]).to.equal('user2');
        lookupMock.done();
        done();
      });
    });

    it("passes any errors on to the controller", function(done) {
      var lookupMock = nock(User.host)
        .get('/user/ohai@boom.com')
        .reply(400, []);

      User.lookupEmail('ohai@boom.com', function(err, usernames) {
        expect(err).to.exist();
        expect(err.statusCode).to.equal(400);
        expect(usernames).to.not.exist();
        lookupMock.done();
        done();
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
      var signupMock = nock(User.host)
        .put('/user', signupInfo)
        .reply(400);

      User.signup(signupInfo, function(err, user) {
        expect(err).to.exist();
        expect(err.statusCode).to.equal(400);
        expect(user).to.not.exist();
        signupMock.done();
        done();
      });
    });

    it("returns a user object when successful", function(done) {
      var signupMock = nock(User.host)
        .put('/user', signupInfo)
        .reply(200, userObj);

      User.signup(signupInfo, function(err, user) {
        expect(err).to.not.exist();
        expect(user).to.exist();
        expect(user.name).to.equal(signupInfo.name);
        signupMock.done();
        done();
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

        var userMock = nock("https://user.com")
          .put('/user', {
            "name": "boom",
            "password": "12345",
            "verify": "12345",
            "email": "boom@boom.com"
          })
          .reply(404)
          .put('/user', {
            "name": "boom",
            "password": "12345",
            "verify": "12345",
            "email": "boom@boom.com",
            "resource": {
              "npmweekly": "on"
            }
          })
          .reply(201);

        spy.reset();
        User.signup({
          name: 'boom',
          password: '12345',
          verify: '12345',
          email: 'boom@boom.com',
          resource: {
            npmweekly: "on"
          }
        }, function(er, user) {
          expect(er).to.not.exist();
          // userMock.done();
          expect(spy.calledWith(params)).to.be.true();
          done();
        });
      });

      it('does not add the user to the mailing list when unchecked', function(done) {

        spy.reset();
        User.getMailchimp = function() {
          return {
            lists: {
              subscribe: spy
            }
          };
        };

        User.signup({
          name: 'boom',
          password: '12345',
          verify: '12345',
          email: 'boom@boom.com'
        }, function(er, user) {
          expect(spy.called).to.be.false();
          done();
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
      var saveMock = nock(User.host)
        .post('/user/npmjs', profile)
        .reply(400);

      User.save(profile, function(err, user) {
        expect(err).to.exist();
        expect(err.statusCode).to.equal(400);
        expect(user).to.not.exist();
        saveMock.done();
        done();
      });
    });

    it("hits the save url", function(done) {
      var saveMock = nock(User.host)
        .post('/user/npmjs', profile)
        .reply(200, userObj);

      User.save(profile, function(err, user) {
        expect(err).to.not.exist();
        expect(user).to.exist();
        expect(user.name).to.equal('npmjs');
        expect(user.email).to.equal('support@npmjs.com');
        saveMock.done();
        done();
      });
    });
  });
});
