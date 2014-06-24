var Lab = require('lab'),
    describe = Lab.experiment,
    before = Lab.before,
    after = Lab.after,
    it = Lab.test,
    expect = Lab.expect;

var Hapi = require('hapi'),
    config = require('../../../config').user,
    user = require('../'),
    murmurhash = require('murmurhash');

var server, source, cache, revUrl, confUrl,
    fakeuser = require('./fixtures/users').fakeuser,
    fakeusercli = require('./fixtures/users').fakeusercli,
    newEmail = 'new@fakeuser.com',
    oldEmail = fakeuser.email;

// prepare the server
before(function (done) {
  process.env.NODE_ENV = 'dev';

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
    changeEmail: function (name, email, next) {
      if (name !== 'fakeuser') {
        return next(Hapi.error.notFound('Username not found: ' + username));
      }

      fakeuser.email = email;
      return next(null);
    }
  };

  done();
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
      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('email-edit');
      done();
    });
  });
});

describe('Requesting an email change', function () {
  it('redirects unauthorized users to the login page', function (done) {
    var opts = {
      url: '/email-edit',
      method: 'POST',
      payload: {
        _id: fakeuser._id,
        name: fakeuser.name,
        password: '12345',
        email: newEmail
      }
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  it('renders an error if an email address is not provided', function (done) {
    var opts = {
      url: '/email-edit',
      method: 'POST',
      credentials: fakeuser,
      payload: {
        _id: fakeuser._id,
        name: fakeuser.name,
        password: '12345'
      }
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(400);
      expect(source.template).to.equal('email-edit');
      expect(source.context.error).to.equal('Must provide a valid email address');
      done();
    });
  });

  it('renders an error if an invalid email address is provided', function (done) {
    var opts = {
      url: '/email-edit',
      method: 'POST',
      credentials: fakeuser,
      payload: {
        _id: fakeuser._id,
        name: fakeuser.name,
        password: '12345',
        email: 'blarg@boom'
      }
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(400);
      expect(source.template).to.equal('email-edit');
      expect(source.context.error).to.equal('Must provide a valid email address');
      done();
    });
  });

  it('renders an error if the password is invalid', function (done) {
    var opts = {
      url: '/email-edit',
      method: 'POST',
      credentials: fakeuser,
      payload: {
        _id: fakeuser._id,
        name: fakeuser.name,
        password: 'password',
        email: newEmail
      }
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(403);
      expect(source.template).to.equal('email-edit');
      expect(source.context.error).to.equal('Invalid password');
      done();
    });
  });

  it('sends two emails if everything goes properly', function (done) {
    var opts = {
      url: '/email-edit',
      method: 'POST',
      credentials: fakeuser,
      payload: {
        _id: fakeuser._id,
        name: fakeuser.name,
        password: '12345',
        email: newEmail
      }
    };

    server.inject(opts, function (resp) {
      confUrl = source.confirm.text.match(/\/email-edit\/confirm\/[\/\w \.-]*\/?/)[0];
      revUrl = source.revert.text.match(/\/email-edit\/revert\/[\/\w \.-]*\/?/)[0];

      expect(resp.statusCode).to.equal(200);
      expect(source).to.have.deep.property('confirm.subject', 'npm Email Confirmation');
      expect(source).to.have.deep.property('revert.subject', 'npm Email Change Alert');
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
      expect(source.template).to.equal('error');
      expect(source.context.errId).to.exist;
      done();
    });
  });

  it('renders an error if the the wrong user is logged in', function (done) {
    var opts = {
      url: confUrl,
      credentials: fakeusercli
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(403);
      expect(source.template).to.equal('error');
      expect(source.context.errId).to.exist;
      done();
    });
  });

  it('changes the user\'s email when everything works properly', function (done) {
    var opts = {
      url: confUrl,
      credentials: fakeuser
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(fakeuser.email).to.equal(newEmail);
      expect(source.template).to.equal('email-edit-confirmation');
      done();
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
      expect(source.template).to.equal('error');
      expect(source.context.errId).to.exist;
      done();
    });
  });

  it('renders an error if the the wrong user is logged in', function (done) {
    var opts = {
      url: revUrl,
      credentials: fakeusercli
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(403);
      expect(source.template).to.equal('error');
      expect(source.context.errId).to.exist;
      done();
    });
  });

  it('changes the user\'s email when everything works properly', function (done) {
    var opts = {
      url: revUrl,
      credentials: fakeuser
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(fakeuser.email).to.equal(oldEmail);
      expect(source.template).to.equal('email-edit-confirmation');
      done();
    });
  });
});

after(function (done) {
  server.app.cache._cache.connection.stop();
  done();
});