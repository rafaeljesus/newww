var Lab = require('lab'),
    describe = Lab.experiment,
    before = Lab.before,
    it = Lab.test,
    expect = Lab.expect;

var Hapi = require('hapi'),
    config = require('../../../config').user,
    user = require('../'),
    murmurhash = require('murmurhash');

var server, source, cache,
    fakeuser = require('./fixtures/users').fakeuser,
    fakeChangePass = require('./fixtures/users').fakeuserChangePassword;

// prepare the server
before(function (done) {
  var serverOptions = {
    views: {
      engines: {hbs: require('handlebars')},
      partialsPath: '../../hbs-partials',
      helpersPath: '../../hbs-helpers'
    }
  };

  server = Hapi.createServer(serverOptions);

  server.ext('onPreResponse', function (request, next) {
    cache = request.server.app.cache._cache.connection.cache['|sessions'];
    source = request.response.source;
    next();
  });

  server.pack.register(require('hapi-auth-cookie'), function (err) {
    if (err) throw err;

    server.app.cache = server.cache('sessions', {
      expiresIn: 30
    });

    server.auth.strategy('session', 'cookie', 'try', {
      password: '12345'
    });

    server.pack.register({
      plugin: user,
      options: config
    }, function (err) {

      // manually start the cache
      server.app.cache._cache.connection.start(done);
    });
  });
});

before(function (done) {
  server.methods = {
    saveProfile: function (user, next) {
      return next(null, "yep, it's cool");
    },
    changePass: function (auth, next) {
      return next(null);
    },
    loginUser: function (auth, next) {
      return next(null, fakeuser)
    },
    setSession: function (request) {
      return function (user, next) {
        var sid = murmurhash.v3(user.name, 55).toString(16);

        user.sid = sid;

        server.app.cache.set(sid, user, 0, function (err) {
          if (err) {
            return next(Hapi.error.internal('there was an error setting the cache'));
          }

          request.auth.session.set({sid: sid});
          return next(null);
        });
      }
    }
  }

  done();
});

describe('Getting to the password page', function () {
  it('redirects an unauthorized user to the login page', function (done) {
    var options = {
      url: '/password'
    }

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  it('takes authorized users to the password page', function (done) {
    var options = {
      url: '/password',
      credentials: fakeuser
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('password');
      done();
    });
  });
});

describe('Changing the password', function () {
  it('redirects an unauthorized user to the login page', function (done) {
    var options = {
      url: '/password',
      method: 'post',
      payload: fakeChangePass
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  it('allows authorized password changes to go through', function (done) {
    var options = {
      url: '/password',
      method: 'post',
      payload: fakeChangePass,
      credentials: fakeuser
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('profile');
      done();
    });

  });
});