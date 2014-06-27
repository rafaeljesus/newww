var Lab = require('lab'),
    describe = Lab.experiment,
    before = Lab.before,
    after = Lab.after,
    it = Lab.test,
    expect = Lab.expect;

var server, source, cache, tokenUrl,
    users = require('./fixtures/users'),
    fakeuser = require('./fixtures/users').fakeuser,
    fakeusercli = require('./fixtures/users').fakeusercli;

// prepare the server
before(function (done) {
  server = require('./fixtures/setupServer')(done);

  server.ext('onPreResponse', function (request, next) {
    cache = request.server.app.cache._cache.connection.cache['|sessions'];
    source = request.response.source;
    next();
  });
});

describe('Accessing the forgot password page', function () {
  it('loads the forgot password page', function (done) {
    var options = {
      url: '/forgot'
    };

    server.inject(options, function (resp) {
      expect(source.template).to.equal('password-recovery-form');
      expect(resp.statusCode).to.equal(200);
      done();
    });
  });

  it('renders an error if no name or email is submitted', function (done) {
    var options = {
      url: '/forgot',
      method: 'POST',
      payload: {}
    };

    server.inject(options, function (resp) {
      expect(source.template).to.equal('password-recovery-form');
      expect(source.context.error).to.equal('All fields are required');
      expect(resp.statusCode).to.equal(400);
      done();
    });
  });

  it('renders an error if the username is invalid', function (done) {
    var options = {
      url: '/forgot',
      method: 'POST',
      payload: {
        name_email: '.baduser'
      }
    };

    server.inject(options, function (resp) {
      expect(source.template).to.equal('password-recovery-form');
      expect(source.context.error).to.equal('Need a valid username or email address');
      expect(resp.statusCode).to.equal(400);
      done();
    });
  });

  it('renders an error if the email is invalid', function (done) {
    var options = {
      url: '/forgot',
      method: 'POST',
      payload: {
        name_email: 'bad@email'
      }
    };

    server.inject(options, function (resp) {
      expect(source.template).to.equal('password-recovery-form');
      expect(source.context.error).to.equal('Need a valid username or email address');
      expect(resp.statusCode).to.equal(400);
      done();
    });
  });
});

describe('Looking up a user', function () {
  describe('by username', function () {
    it('renders an error if the username doesn\'t exist', function (done) {
      var name = 'blerg';
      var options = {
        url: '/forgot',
        method: 'POST',
        payload: {
          name_email: name
        }
      };

      server.inject(options, function (resp) {
        expect(source.template).to.equal('password-recovery-form');
        expect(source.context.error).to.equal('Username not found: ' + name);
        expect(resp.statusCode).to.equal(404);
        done();
      });
    });

    it('renders an error if the user does not have an email address', function (done) {
      var name = 'fakeusernoemail';
      var options = {
        url: '/forgot',
        method: 'POST',
        payload: {
          name_email: name
        }
      };

      server.inject(options, function (resp) {
        expect(source.template).to.equal('password-recovery-form');
        expect(source.context.error).to.equal('Username does not have an email address; please contact support');
        expect(resp.statusCode).to.equal(400);
        done();
      });
    });

    it('renders an error if the user\'s email address is invalid', function (done) {
      var name = 'fakeuserbademail';
      var options = {
        url: '/forgot',
        method: 'POST',
        payload: {
          name_email: name
        }
      };

      server.inject(options, function (resp) {
        expect(source.template).to.equal('password-recovery-form');
        expect(source.context.error).to.equal('Username\'s email address is invalid; please contact support');
        expect(resp.statusCode).to.equal(400);
        done();
      });
    });

    it('sends an email when everything finally goes right', function (done) {
      var name = 'fakeuser';
      var options = {
        url: '/forgot',
        method: 'POST',
        payload: {
          name_email: name
        }
      };

      server.inject(options, function (resp) {
        expect(source.to).to.include(name);
        expect(source.subject).to.equal('npm Password Reset');
        expect(resp.statusCode).to.equal(200);
        done();
      });
    });
  });

  describe('by email', function () {
    it('renders an error if the email doesn\'t exist', function (done) {
      var options = {
        url: '/forgot',
        method: 'POST',
        payload: {
          name_email: 'blah@boom.com'
        }
      };

      server.inject(options, function (resp) {
        expect(source.template).to.equal('password-recovery-form');
        expect(source.context.error).to.equal('Bad email, no user found with this email');
        expect(resp.statusCode).to.equal(404);
        done();
      });
    });

    it('renders a list of emails if the email matches more than one username', function (done) {
      var options = {
        url: '/forgot',
        method: 'POST',
        payload: {
          name_email: fakeuser.email
        }
      };

      server.inject(options, function (resp) {
        expect(source.template).to.equal('password-recovery-form');
        expect(resp.statusCode).to.equal(200);
        expect(source.context.error).to.not.exist;
        expect(source.context.users).to.include(fakeuser.name);
        expect(source.context.users).to.include(fakeusercli.name);
        done();
      });
    });

    it('sends an email when a username is chosen from the dropdown', function (done) {
      var options = {
        url: '/forgot',
        method: 'POST',
        payload: {
          selected_name: fakeusercli.name
        }
      };

      server.inject(options, function (resp) {
        expect(source.to).to.include(fakeusercli.name);
        expect(source.subject).to.equal('npm Password Reset');
        expect(resp.statusCode).to.equal(200);
        done();
      });
    });

    it('sends an email when everything finally goes right', function (done) {
      var options = {
        url: '/forgot',
        method: 'POST',
        payload: {
          name_email: fakeusercli.email
        }
      };

      server.inject(options, function (resp) {
        tokenUrl = source.text.match(/\/forgot\/[\/\w \.-]*\/?/)[0];
        expect(source.to).to.include(fakeusercli.name);
        expect(source.subject).to.equal('npm Password Reset');
        expect(resp.statusCode).to.equal(200);
        done();
      });
    });
  });
});

describe('Using a token', function () {
  it('renders an error if the token does not exist', function (done) {
    var options = {
      url: '/forgot/bogus',
      method: 'GET'
    };

    server.inject(options, function (resp) {
      expect(source.template).to.equal('error');
      expect(source.context.errId).to.exist;
      expect(resp.statusCode).to.equal(404);
      done();
    });
  });

  it('changes the password with a proper token', function (done) {
    var options = {
      url: tokenUrl,
      method: 'GET'
    };

    server.inject(options, function (resp) {
      expect(source.template).to.equal('password-changed');
      expect(source.context.password).to.exist;
      expect(resp.statusCode).to.equal(200);
      done();
    });
  });
});

after(function (done) {
  server.app.cache._cache.connection.stop();
  done();
});