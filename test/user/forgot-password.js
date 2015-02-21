var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect;

var server, tokenUrl, cookieCrumb,
    fakeuser = require('../fixtures/users').fakeusercouch,
    fakeusercli = require('../fixtures/users').fakeusercli;

var postName = function (name_email) {
  return {
    url: '/forgot',
    method: 'POST',
    payload: {
      name_email: name_email,
      crumb: cookieCrumb
    },
    headers: { cookie: 'crumb=' + cookieCrumb }
  };
};

// prepare the server
before(function (done) {
  require('../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

after(function (done) {
  server.stop(done);
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

      var source = resp.request.response.source;
      expect(source.template).to.equal('user/password-recovery-form');
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
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/password-recovery-form');
      expect(source.context.error).to.equal('All fields are required');
      expect(resp.statusCode).to.equal(400);
      done();
    });
  });

  it('renders an error if the username is invalid', function (done) {
    server.inject(postName('.baduser'), function (resp) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/password-recovery-form');
      expect(source.context.error).to.equal('Need a valid username or email address');
      expect(resp.statusCode).to.equal(400);
      done();
    });
  });

  it('renders an error if the email is invalid', function (done) {
    server.inject(postName('bad@email'), function (resp) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/password-recovery-form');
      expect(source.context.error).to.equal('Need a valid username or email address');
      expect(resp.statusCode).to.equal(400);
      done();
    });
  });
});

describe('Looking up a user', function () {
  describe('by username', function () {
    it('renders an error if the username doesn\'t exist', function (done) {
      var name = 'mr-perdido';
      server.inject(postName(name), function (resp) {
        var source = resp.request.response.source;
        expect(source.template).to.equal('user/password-recovery-form');
        expect(source.context.error).to.equal('user ' + name + ' not found');
        expect(resp.statusCode).to.equal(404);
        done();
      });
    });

    it('renders an error if the user does not have an email address', function (done) {
      var name = 'forrestnoemail';
      server.inject(postName(name), function (resp) {
        var source = resp.request.response.source;
        expect(source.template).to.equal('user/password-recovery-form');
        expect(source.context.error).to.equal('Username does not have an email address; please contact support');
        expect(resp.statusCode).to.equal(400);
        done();
      });
    });

    it('renders an error if the user\'s email address is invalid', function (done) {
      var name = 'forrestbademail';
      server.inject(postName(name), function (resp) {
        var source = resp.request.response.source;
        expect(source.template).to.equal('user/password-recovery-form');
        expect(source.context.error).to.equal('Username\'s email address is invalid; please contact support');
        expect(resp.statusCode).to.equal(400);
        done();
      });
    });

    it('sends an email when everything finally goes right', function (done) {
      var name = 'fakeuser';
      server.inject(postName(name), function (resp) {
        expect(resp.request.response.source.template).to.equal('user/password-recovery-form');
        expect(resp.statusCode).to.equal(200);
        done();
      });
    });
  });

  describe('by email', function () {
    it('renders an error if the email doesn\'t exist', function (done) {
      server.inject(postName('doesnotexist@boom.com'), function (resp) {
        var source = resp.request.response.source;
        expect(source.template).to.equal('user/password-recovery-form');
        expect(source.context.error).to.equal('No user found with email address doesnotexist@boom.com');
        expect(resp.statusCode).to.equal(400);
        done();
      });
    });

    it('renders a list of emails if the email matches more than one username', function (done) {
      server.inject(postName("forrest@example.com"), function (resp) {
        var source = resp.request.response.source;
        expect(source.template).to.equal('user/password-recovery-form');
        expect(resp.statusCode).to.equal(200);
        expect(source.context.error).to.not.exist();
        expect(source.context.users).to.include("forrest");
        expect(source.context.users).to.include("forrest2");
        done();
      });
    });

    it('sends an email when a username is chosen from the dropdown', function (done) {
      var options = {
        url: '/forgot',
        method: 'POST',
        payload: {
          selected_name: "forrest",
          crumb: cookieCrumb
        },
        headers: { cookie: 'crumb=' + cookieCrumb }
      };

      server.inject(options, function (resp) {
        expect(resp.request.response.source.template).to.equal('user/password-recovery-form');
        expect(resp.statusCode).to.equal(200);
        done();
      });
    });

    it('sends an email when everything finally goes right', function (done) {
      server.inject(postName("onlyone@boom.com"), function (resp) {
        expect(resp.request.response.source.template).to.equal('user/password-recovery-form');
        expect(resp.statusCode).to.equal(200);
        done();
      });
    });
  });
});

describe('Using a token', function () {
  it('renders an error if the token does not exist'/*, function (done) {
    server.inject('/forgot/bogus', function (resp) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/internal');
      expect(resp.statusCode).to.equal(500);
      done();
    });
  }*/);

  it('changes the password with a proper token'/*, function (done) {
    server.inject(tokenUrl, function (resp) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/password-changed');
      expect(source.context.password).to.exist();
      expect(resp.statusCode).to.equal(200);
      done();
    });
  }*/);
});
