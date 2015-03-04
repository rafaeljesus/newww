var generateCrumb = require("../crumb"),
    utils = require('../../../lib/utils'),
    Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect;

var _ = require('lodash'),
    redis = require('redis'),
    spawn = require('child_process').spawn,
    config = require('../../../config').server.cache,
    fixtures = require('../../fixtures.js');

    config.port = 6379;
    config.password = '';

var server, cookieCrumb,
    client, redisProcess,
    fakeuser = fixtures.users.fakeusercouch,
    fakeusercli = fixtures.users.mikeal,
    newEmail = 'new@fakeuser.com',
    oldEmail = fakeuser.email,
    emailEdits = require('../../fixtures/email_edit');

var postEmail = function (emailOpts) {
  return {
    url: '/email-edit',
    method: 'POST',
    credentials: fakeuser,
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
  var redisConfig = '--port ' + config.port;
  redisProcess = spawn('redis-server', [redisConfig]);
  client = redis.createClient(config.port, config.host);
  client.auth(config.password, function () {});
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
    var opts = {
      url: '/email-edit',
      credentials: fakeuser
    };

    server.inject(opts, function (resp) {
      generateCrumb(server, function (crumb){
        cookieCrumb = crumb;
        emailEdits = emailEdits(cookieCrumb);

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
      payload: emailEdits.newEmail
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
      credentials: fakeuser
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(403);
      done();
    });
  });

  it('renders an error if an email address is not provided', function (done) {
    server.inject(postEmail(emailEdits.missingEmail), function (resp) {
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/email-edit');
      expect(source.context.error.email).to.be.true();
      done();
    });
  });

  it('renders an error if an invalid email address is provided', function (done) {
    server.inject(postEmail(emailEdits.invalidEmail), function (resp) {
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/email-edit');
      expect(source.context.error.email).to.be.true();
      done();
    });
  });

  it('renders an error if the password is invalid', function (done) {
    server.inject(postEmail(emailEdits.invalidPassword), function (resp) {
      expect(resp.statusCode).to.equal(403);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/email-edit');
      expect(source.context.error.password).to.be.true();
      done();
    });
  });

  it('sends two emails if everything goes properly', function (done) {
    server.inject(postEmail(emailEdits.newEmail), function (resp) {
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
    var opts = {
      url: '/email-edit/confirm',
      credentials: fakeuser
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(404);
      done();
    });
  });

  it('renders an error if the token doesn\'t exist', function (done) {
    var opts = {
      url: '/email-edit/confirm/something',
      credentials: fakeuser
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(404);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/not-found');
      done();
    });
  });

  it('renders an error if the the wrong user is logged in', function (done) {
    setEmailHashesInRedis(function (err, tokens) {

      var opts = {
        url: '/email-edit/confirm/' + tokens.confToken,
        credentials: fakeusercli
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(500);
        var source = resp.request.response.source;
        expect(source.template).to.equal('errors/internal');
        done();
      });
    });
  });

  it('changes the user\'s email when everything works properly', function (done) {
    setEmailHashesInRedis(function (err, tokens) {

      var opts = {
        url: '/email-edit/confirm/' + tokens.confToken,
        credentials: fakeuser
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(fakeuser.email).to.equal(newEmail);
        var source = resp.request.response.source;
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
    var opts = {
      url: '/email-edit/revert',
      credentials: fakeuser
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(404);
      done();
    });
  });

  it('renders an error if the token doesn\'t exist', function (done) {
    var opts = {
      url: '/email-edit/revert/something',
      credentials: fakeuser
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(404);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/not-found');
      done();
    });
  });

  it('renders an error if the the wrong user is logged in', function (done) {
    setEmailHashesInRedis(function (err, tokens) {
      var opts = {
        url: '/email-edit/revert/' + tokens.revToken,
        credentials: {
         name: "noone",
         email: "f@boom.me",
        }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(500);
        var source = resp.request.response.source;
        expect(source.template).to.equal('errors/internal');
        done();
      });
    });
  });

  it('changes the user\'s email when everything works properly', function (done) {
    setEmailHashesInRedis(function (err, tokens) {
      var opts = {
        url: '/email-edit/revert/' + tokens.revToken,
        credentials: fakeuser
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(fakeuser.email).to.equal(oldEmail);
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
    name: 'fakeusercouch',
    changeEmailFrom: 'b@fakeuser.com',
    changeEmailTo: 'new@fakeuser.com'
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
