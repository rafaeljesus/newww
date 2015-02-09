var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect;

var server, cookieCrumb,
    forms = require('../fixtures/signup');

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

var postSignup = function (payload) {
  return {
    url: '/signup',
    method: 'POST',
    payload: payload,
    headers: { cookie: 'crumb=' + cookieCrumb }
  }
}

describe('Signing up a new user', function () {

  it('renders the signup template', function (done) {
    var options = {
      url: '/signup'

    };

    server.inject(options, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];
      forms = forms(cookieCrumb);

      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/signup-form');
      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');
      done();
    });
  });

  it('renders an error if the cookie crumb is missing', function (done) {
    var options = {
      url: '/signup',
      method: 'POST',
      payload: {}
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(403);
      done();
    });
  });

  it('renders an error if the username already exists', function (done) {
    server.inject(postSignup(forms.alreadyExists), function (resp) {
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/signup-form');
      expect(source.context.errors[0]).to.contain({ message: 'username already exists' });
      done();
    });
  });

  it('fails validation with incomplete form fields', function (done) {
    server.inject(postSignup(forms.incomplete), function (resp) {
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/signup-form');
      expect(source.context.errors[0]).to.contain({ message: 'verify is required' });
      done();
    });
  });

  it('fails validation with a bad email address', function (done) {
    server.inject(postSignup(forms.badEmail), function (resp) {
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/signup-form');
      expect(source.context.errors[0]).to.contain({ message: 'email must be a valid email' });
      done();
    });
  });

  it('fails validation with a bad username (dot)', function (done) {
    server.inject(postSignup(forms.badUsernameDot), function (resp) {
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/signup-form');
      expect(source.context.errors[0]).to.contain({ message: 'Username may not start with "."' });
      done();
    });
  });

  it('fails validation with a bad username (uppercase)', function (done) {
    server.inject(postSignup(forms.badUsernameCaps), function (resp) {
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/signup-form');
      expect(source.context.errors[0]).to.contain({ message: 'Username must be lowercase' });
      done();
    });
  });

  it('fails validation with a bad username (encodeURI)', function (done) {
    server.inject(postSignup(forms.badUsernameEncodeURI), function (resp) {
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/signup-form');
      expect(source.context.errors[0]).to.contain({ message: 'Username may not contain non-url-safe chars' });
      done();
    });
  });

  it('fails validation with non-matching passwords', function (done) {
    server.inject(postSignup(forms.invalidPassMatch), function (resp) {
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/signup-form');
      expect(source.context.errors[0]).to.contain({ message: 'passwords don\'t match' });
      done();
    });
  });

  it('passes validation with a valid form', function (done) {
    server.inject(postSignup(forms.good), function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('profile-edit');
      done();
    });
  });

  it('passes validation with an umlaut in the password', function (done) {
    server.inject(postSignup(forms.goodPassWithUmlaut), function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('profile-edit');
      done();
    });
  });
});
