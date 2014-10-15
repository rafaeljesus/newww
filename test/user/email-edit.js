var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect;

var server, source, cache, revUrl, confUrl, cookieCrumb,
    fakeuser = require('../fixtures/users').fakeuser,
    fakeusercli = require('../fixtures/users').fakeusercli,
    newEmail = 'new@fakeuser.com',
    oldEmail = fakeuser.email,
    emailEdits = require('../fixtures/emailEdits');

var postEmail = function (emailOpts) {
  return {
    url: '/email-edit',
    method: 'POST',
    credentials: fakeuser,
    payload: emailOpts,
    headers: { cookie: 'crumb=' + cookieCrumb }
  }
};

// prepare the server
before(function (done) {
  server = require('../fixtures/setupServer')(done);

  server.ext('onPreResponse', function (request, next) {
    cache = request.server.app.cache._cache.connection.cache['|sessions'];
    source = request.response.source;
    next();
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
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      emailEdits = emailEdits(cookieCrumb);

      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('user/email-edit');
      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');
      done();
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
      expect(source.template).to.equal('user/email-edit');
      expect(source.context.error.email).to.be.true;
      done();
    });
  });

  it('renders an error if an invalid email address is provided', function (done) {
    server.inject(postEmail(emailEdits.invalidEmail), function (resp) {
      expect(resp.statusCode).to.equal(400);
      expect(source.template).to.equal('user/email-edit');
      expect(source.context.error.email).to.be.true;
      done();
    });
  });

  it('renders an error if the password is invalid', function (done) {
    server.inject(postEmail(emailEdits.invalidPassword), function (resp) {
      expect(resp.statusCode).to.equal(403);
      expect(source.template).to.equal('user/email-edit');
      expect(source.context.error.password).to.be.true;
      done();
    });
  });

  it('sends two emails if everything goes properly', function (done) {
    server.inject(postEmail(emailEdits.newEmail), function (resp) {
      var confJSON = JSON.parse(source.context.confirm);
      var revJSON = JSON.parse(source.context.revert);
      confUrl = confJSON.text.match(/\/email-edit\/confirm\/[\/\w \.-]*\/?/)[0];
      revUrl = revJSON.text.match(/\/email-edit\/revert\/[\/\w \.-]*\/?/)[0];
      expect(resp.statusCode).to.equal(200);
      expect(confJSON).to.have.deep.property('subject', 'npm Email Confirmation');
      expect(revJSON).to.have.deep.property('subject', 'npm Email Change Alert');
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
      expect(resp.statusCode).to.equal(500);
      expect(source.template).to.equal('errors/internal');
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
      expect(resp.statusCode).to.equal(500);
      expect(source.template).to.equal('errors/internal');
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
      expect(source.template).to.equal('user/email-edit-confirmation');
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
      expect(resp.statusCode).to.equal(500);
      expect(source.template).to.equal('errors/internal');
      expect(source.context.errId).to.exist;
      done();
    });
  });

  it('renders an error if the the wrong user is logged in', function (done) {
    var opts = {
      url: revUrl,
      credentials: {
       name: "noone",
       email: "f@boom.me",
      }
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(500);
      expect(source.template).to.equal('errors/internal');
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
      expect(source.template).to.equal('user/email-edit-confirmation');
      done();
    });
  });
});

after(function (done) {
  fakeuser.email = oldEmail;
  server.app.cache._cache.connection.stop();
  done();
});