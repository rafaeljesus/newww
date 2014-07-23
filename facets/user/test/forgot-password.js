var Lab = require('lab'),
    describe = Lab.experiment,
    before = Lab.before,
    after = Lab.after,
    it = Lab.test,
    expect = Lab.expect;

var server, source, cache, tokenUrl, cookieCrumb,
    users = require('./fixtures/users'),
    fakeuser = require('./fixtures/users').fakeuser,
    fakeusercli = require('./fixtures/users').fakeusercli;

var postName = function (name_email) {
  return {
    url: '/forgot',
    method: 'POST',
    payload: {
      name_email: name_email,
      crumb: cookieCrumb
    },
    headers: { cookie: 'crumb=' + cookieCrumb }
  }
};

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
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(source.template).to.equal('password-recovery-form');
      expect(resp.statusCode).to.equal(200);
      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');
      done();
    });
  });

  it('renders an error if the cookie crumb is missing', function (done) {
    var options = {
      url: '/forgot',
      method: 'POST',
      payload: {}
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(403);
      done();
    });
  });

  it('renders an error if no name or email is submitted', function (done) {
    server.inject(postName(), function (resp) {
      expect(source.template).to.equal('password-recovery-form');
      expect(source.context.error).to.equal('All fields are required');
      expect(resp.statusCode).to.equal(400);
      done();
    });
  });

  it('renders an error if the username is invalid', function (done) {
    server.inject(postName('.baduser'), function (resp) {
      expect(source.template).to.equal('password-recovery-form');
      expect(source.context.error).to.equal('Need a valid username or email address');
      expect(resp.statusCode).to.equal(400);
      done();
    });
  });

  it('renders an error if the email is invalid', function (done) {
    server.inject(postName('bad@email'), function (resp) {
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
      server.inject(postName(name), function (resp) {
        expect(source.template).to.equal('password-recovery-form');
        expect(source.context.error).to.equal('Username not found: ' + name);
        expect(resp.statusCode).to.equal(404);
        done();
      });
    });

    it('renders an error if the user does not have an email address', function (done) {
      var name = 'fakeusernoemail';
      server.inject(postName(name), function (resp) {
        expect(source.template).to.equal('password-recovery-form');
        expect(source.context.error).to.equal('Username does not have an email address; please contact support');
        expect(resp.statusCode).to.equal(400);
        done();
      });
    });

    it('renders an error if the user\'s email address is invalid', function (done) {
      var name = 'fakeuserbademail';
      server.inject(postName(name), function (resp) {
        expect(source.template).to.equal('password-recovery-form');
        expect(source.context.error).to.equal('Username\'s email address is invalid; please contact support');
        expect(resp.statusCode).to.equal(400);
        done();
      });
    });

    it('sends an email when everything finally goes right', function (done) {
      var name = 'fakeuser';
      server.inject(postName(name), function (resp) {
        expect(source.to).to.include(name);
        expect(source.subject).to.equal('npm Password Reset');
        expect(resp.statusCode).to.equal(200);
        done();
      });
    });
  });

  describe('by email', function () {
    it('renders an error if the email doesn\'t exist', function (done) {
      server.inject(postName('blah@boom.com'), function (resp) {
        expect(source.template).to.equal('password-recovery-form');
        expect(source.context.error).to.equal('Bad email, no user found with this email');
        expect(resp.statusCode).to.equal(404);
        done();
      });
    });

    it('renders a list of emails if the email matches more than one username', function (done) {
      server.inject(postName(fakeuser.email), function (resp) {
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
          selected_name: fakeusercli.name,
          crumb: cookieCrumb
        },
        headers: { cookie: 'crumb=' + cookieCrumb }
      };

      server.inject(options, function (resp) {
        expect(source.to).to.include(fakeusercli.name);
        expect(source.subject).to.equal('npm Password Reset');
        expect(resp.statusCode).to.equal(200);
        done();
      });
    });

    it('sends an email when everything finally goes right', function (done) {
      server.inject(postName(fakeusercli.email), function (resp) {
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