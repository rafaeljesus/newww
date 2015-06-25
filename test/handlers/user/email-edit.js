var generateCrumb = require("../crumb"),
    utils = require('../../../lib/utils'),
    Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect,
    nock = require("nock"),
    _ = require('lodash'),
    redis = require('redis'),
    spawn = require('child_process').spawn,
    fixtures = require('../../fixtures'),
    users = fixtures.users,
    emails = fixtures.email_edit;

var server, cookieCrumb,
    client, redisProcess,
    newEmail = 'new@boom.me',
    oldEmail = users.bob.email;

var postEmail = function (emailOpts) {
  return {
    url: '/email-edit',
    method: 'POST',
    credentials: users.bob,
    payload: emailOpts,
    headers: { cookie: 'crumb=' + cookieCrumb }
  };
};

// prepare the server
before(function (done) {
  require('../../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

before(function (done) {
  redisProcess = spawn('redis-server');
  client = require("redis-url").connect();
  client.on("error", function (err) {
    console.log("Error " + err);
  });

  server.app.cache._cache.connection.client = client;

  done();
});

after(function(done) {
  client.flushdb();
  server.stop(function () {
    redisProcess.kill('SIGKILL');
    done();
  });
});

describe('Accessing the email-edit page', function () {
  it('redirects unauthorized users to the login page', function (done) {
    var opts = {
      url: '/email-edit'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  it('takes authorized users to the email-edit page', function (done) {
    var userMock = nock("https://user-api-example.com")
      .get('/user/' + users.bob.name)
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get('/customer/' + users.bob.name + '/stripe')
      .reply(404);

    var opts = {
      url: '/email-edit',
      credentials: users.bob
    };

    server.inject(opts, function (resp) {
      userMock.done();
      licenseMock.done();
      generateCrumb(server, function (crumb){
        cookieCrumb = crumb;
        emails = emails(cookieCrumb);

        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(source.template).to.equal('user/email-edit');
        done();
      });
    });
  });
});

describe('Requesting an email change', function () {
  it('redirects unauthorized users to the login page', function (done) {
    var opts = {
      url: '/email-edit',
      method: 'POST',
      payload: emails.newEmail
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  it('renders an error if the cookie crumb is missing', function (done) {
    var options = {
      url: '/email-edit',
      method: 'POST',
      payload: {},
      credentials: users.bob
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(403);
      done();
    });
  });

  it('renders an error if an email address is not provided', function (done) {
    var userMock = nock("https://user-api-example.com")
      .get('/user/' + users.bob.name)
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get('/customer/' + users.bob.name + '/stripe')
      .reply(404);

    server.inject(postEmail(emails.missingEmail), function (resp) {
      userMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/email-edit');
      expect(source.context.error.email).to.be.true();
      done();
    });
  });

  it('renders an error if an invalid email address is provided', function (done) {
    var userMock = nock("https://user-api-example.com")
      .get('/user/' + users.bob.name)
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get('/customer/' + users.bob.name + '/stripe')
      .reply(404);

    server.inject(postEmail(emails.invalidEmail), function (resp) {
      userMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/email-edit');
      expect(source.context.error.email).to.be.true();
      done();
    });
  });

  it('renders an error if the password is invalid', function (done) {

    var userMock = nock("https://user-api-example.com")
      .get('/user/' + users.bob.name)
      .reply(200, fixtures.users.bob)
      .post("/user/" + emails.invalidPassword.name + "/login", {password: emails.invalidPassword.password})
      .reply(401);

    var licenseMock = nock("https://license-api-example.com")
      .get('/customer/' + users.bob.name + '/stripe')
      .reply(404);

    server.inject(postEmail(emails.invalidPassword), function (resp) {
      userMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(403);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/email-edit');
      expect(source.context.error.password).to.be.true();
      done();
    });
  });

  it('sends two emails if everything goes properly', function (done) {
    var userMock = nock("https://user-api-example.com")
      .get('/user/' + users.bob.name)
      .reply(200, fixtures.users.bob)
      .post("/user/" + emails.newEmail.name + "/login", {password: emails.newEmail.password})
      .reply(200, users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get('/customer/' + users.bob.name + '/stripe')
      .reply(404);

    server.inject(postEmail(emails.newEmail), function (resp) {
      userMock.done();
      licenseMock.done();
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/email-edit');
      done();
    });
  });
});

describe('Confirming an email change', function () {
  it('redirects unauthenticated user to login', function (done) {
    var opts = {
      url: '/email-edit/confirm/something'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  it('renders an error if a token is not included in the url', function (done) {
    var userMock = nock("https://user-api-example.com")
      .get('/user/' + users.bob.name)
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get('/customer/' + users.bob.name + '/stripe')
      .reply(404);

    var opts = {
      url: '/email-edit/confirm',
      credentials: users.bob
    };

    server.inject(opts, function (resp) {
      userMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(404);
      done();
    });
  });

  it('renders an error if the token doesn\'t exist', function (done) {
    var userMock = nock("https://user-api-example.com")
      .get('/user/' + users.bob.name)
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get('/customer/' + users.bob.name + '/stripe')
      .reply(404);

    var opts = {
      url: '/email-edit/confirm/something',
      credentials: users.bob
    };

    server.inject(opts, function (resp) {
      userMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(404);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/token-expired');
      done();
    });
  });

  it('renders an error if the the wrong user is logged in', function (done) {
    var userMock = nock("https://user-api-example.com")
      .get('/user/mikeal')
      .reply(200, fixtures.users.mikeal);

    var licenseMock = nock("https://license-api-example.com")
      .get('/customer/mikeal/stripe')
      .reply(404);

    setEmailHashesInRedis(function (err, tokens) {

      var opts = {
        url: '/email-edit/confirm/' + tokens.confToken,
        credentials: users.mikeal
      };

      server.inject(opts, function (resp) {
        userMock.done();
        licenseMock.done();
        expect(resp.statusCode).to.equal(500);
        var source = resp.request.response.source;
        expect(source.template).to.equal('errors/internal');
        done();
      });
    });
  });

  it('changes the user\'s email when everything works properly', function (done) {
    var userMock = nock("https://user-api-example.com")
      .get('/user/' + users.bob.name)
      .reply(200, fixtures.users.bob)
      .post("/user/" + users.bob.name, {"name":"bob","email":"new@boom.me"})
      .reply(200);

    var licenseMock = nock("https://license-api-example.com")
      .get('/customer/' + users.bob.name + '/stripe')
      .reply(404);

    setEmailHashesInRedis(function (err, tokens) {

      var opts = {
        url: '/email-edit/confirm/' + tokens.confToken,
        credentials: users.bob
      };

      server.inject(opts, function (resp) {
        userMock.done();
        licenseMock.done();
        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(source.context.user.email).to.equal(newEmail);
        expect(source.template).to.equal('user/email-edit-confirmation');
        done();
      });
    });
  });
});

describe('Reverting an email change', function () {
  it('redirects unauthenticated user to login', function (done) {
    var opts = {
      url: '/email-edit/revert/something'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  it('renders an error if a token is not included in the url', function (done) {
    var userMock = nock("https://user-api-example.com")
      .get('/user/bob')
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get('/customer/bob/stripe')
      .reply(404);

    var opts = {
      url: '/email-edit/revert',
      credentials: users.bob
    };

    server.inject(opts, function (resp) {
      userMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(404);
      done();
    });
  });

  it('renders an error if the token doesn\'t exist', function (done) {
    var userMock = nock("https://user-api-example.com")
      .get('/user/bob')
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get('/customer/bob/stripe')
      .reply(404);

    var opts = {
      url: '/email-edit/revert/something',
      credentials: users.bob
    };

    server.inject(opts, function (resp) {
      userMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(404);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/token-expired');
      done();
    });
  });

  it('renders an error if the the wrong user is logged in', function (done) {
    var userMock = nock("https://user-api-example.com")
      .get('/user/mikeal')
      .reply(200, fixtures.users.mikeal);

    var licenseMock = nock("https://license-api-example.com")
      .get('/customer/mikeal/stripe')
      .reply(404);

    setEmailHashesInRedis(function (err, tokens) {
      var opts = {
        url: '/email-edit/revert/' + tokens.revToken,
        credentials: fixtures.users.mikeal
      };

      server.inject(opts, function (resp) {
        userMock.done();
        licenseMock.done();
        expect(resp.statusCode).to.equal(500);
        var source = resp.request.response.source;
        expect(source.template).to.equal('errors/internal');
        done();
      });
    });
  });

  it('changes the user\'s email when everything works properly', function (done) {

    var userMock = nock("https://user-api-example.com")
      .get('/user/bob')
      .reply(200, fixtures.users.bob)
      .post("/user/" + users.bob.name, {"name":"bob","email":"bob@boom.me"})
      .reply(200);

    var licenseMock = nock("https://license-api-example.com")
      .get('/customer/bob/stripe')
      .reply(404);

    setEmailHashesInRedis(function (err, tokens) {
      var opts = {
        url: '/email-edit/revert/' + tokens.revToken,
        credentials: users.bob
      };

      server.inject(opts, function (resp) {
        userMock.done();
        licenseMock.done();
        expect(resp.statusCode).to.equal(200);
        expect(users.bob.email).to.equal(oldEmail);
        var source = resp.request.response.source;
        expect(source.template).to.equal('user/email-edit-confirmation');
        done();
      });
    });
  });
});

function setEmailHashesInRedis (cb) {
  var tokens = {
    confToken: '4a3ba35b2e29219ceaa6e59ff99b1d9cff85',
    revToken: '74e5c84950b75d5393c43ad024f8cbf3b41c'
  };

  var confHash = utils.sha(tokens.confToken),
      revHash = utils.sha(tokens.revToken),
      confKey = 'email_change_conf_' + confHash,
      revKey = 'email_change_rev_' + revHash;

  var data = {
    name: 'bob',
    changeEmailFrom: oldEmail,
    changeEmailTo: newEmail
  };

  var confData = _.extend({}, data, {
    token: tokens.confToken,
    hash: confHash
  });

  var revData = _.extend({}, data, {
    token: tokens.revToken,
    confToken: tokens.confToken,
    hash: revHash
  });

  client.set(revKey, JSON.stringify(revData), function (err) {
    client.set(confKey, JSON.stringify(confData), function (err) {
      return cb(err, tokens);
    });
  });
}
