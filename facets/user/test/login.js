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
    fakeusercli = require('./fixtures/users').fakeusercli;

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
    loginUser: function (auth, next) {
      if (auth.name === 'fakeusercli') {
        return next(null, fakeusercli);
      }

      if (auth.password !== '12345' || auth.name !== 'fakeuser') {
        return next('Username and/or Password is wrong')
      }
      return next(null, fakeuser);
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
  };

  done();
});

describe('Getting to the login page', function () {
  it('renders the login page if you are not already logged in', function (done) {
    var options = {
      url: '/login'
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('login');
      done();
    });
  });

  it('redirects already authenticated users to the homepage', function (done) {
    var options = {
      url: '/login',
      credentials: fakeuser
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.equal('http://0.0.0.0:80/');
      done();
    });
  });

  it('renders an error if one of the login fields is empty', function (done) {
    var options = {
      url: '/login',
      method: 'POST',
      payload: {}
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('login');
      expect(source.context).to.have.deep.property('error.type', 'missing')
      done();
    });
  });

  it('renders an error if the username or password is incorrect', function (done) {
    var options = {
      url: '/login',
      method: 'POST',
      payload: {
        name: 'fakeboom',
        password: 'booooom'
      }
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(400);
      expect(source.template).to.equal('login');
      expect(source.context).to.have.deep.property('error.type', 'invalid')
      done();
    });
  });

  it('redirects user to homepage if all goes well', function (done) {
    var options = {
      url: '/login',
      method: 'POST',
      payload: {
        name: 'fakeuser',
        password: '12345'
      }
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.equal('http://0.0.0.0:80/');
      done();
    });
  });

  it('redirects user to password page if user needs to change their password', function (done) {
    var options = {
      url: '/login',
      method: 'POST',
      payload: {
        name: 'fakeusercli',
        password: '12345'
      }
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('password');
      done();
    });
  });

});