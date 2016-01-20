var generateCrumb = require("../crumb"),
  nock = require('nock'),
  Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  afterEach = lab.afterEach,
  it = lab.test,
  expect = Code.expect,
  fixtures = require('../../fixtures'),
  forms = require('../../fixtures/signup'),
  server,
  emailMock,
  cookieCrumb;

before(function(done) {
  require('../../mocks/server')(function(obj) {
    server = obj;
    emailMock = server.methods.email.send.mailConfig.mailTransportModule;
    server.app.cache._cache.connection.client = {};
    done();
  });
});

afterEach(function(done) {
  emailMock.sentMail = [];
  done();
});

after(function(done) {
  delete server.app.cache._cache.connection.client;
  server.stop(done);
});

var postSignup = function(payload) {
  return {
    url: '/signup',
    method: 'POST',
    payload: payload,
    headers: {
      cookie: 'crumb=' + cookieCrumb
    }
  };
};

function assertEmail () {
  var expectedName = 'mikeal';
  var expectedEmail = 'mikeal@president-of-javascript.com';
  var expectedTo = '"' + expectedName + '" <' + expectedEmail + '>';
  var expectedFrom = 'website@npmjs.com';
  var expectedSupportEmail = 'support@npmjs.com';

  var msg = emailMock.sentMail[0];
  expect(msg.data.to).to.equal(expectedTo);
  expect(msg.message._headers.find(function (header) {
    return header.key === 'To';
  }).value).to.equal(expectedTo);
  expect(msg.data.from).to.equal(expectedFrom);
  expect(msg.message._headers.find(function (header) {
    return header.key === 'From';
  }).value).to.equal(expectedFrom);
  expect(msg.data.name).to.equal(expectedName);
  expect(msg.data.support_email).to.equal(expectedSupportEmail);
  expect(msg.message.content).to.match(new RegExp(expectedName));
  expect(msg.message.content).to.match(new RegExp(expectedSupportEmail));
}

describe('Signing up a new user', function() {

  it('renders the signup template', function(done) {
    var options = {
      url: '/signup'

    };

    server.inject(options, function(resp) {
      generateCrumb(server, function(crumb) {
        cookieCrumb = crumb;
        forms = forms(cookieCrumb);

        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(source.template).to.equal('user/signup-form');
        done();
      });
    });
  });

  it('renders an error if the cookie crumb is missing', function(done) {
    var options = {
      url: '/signup',
      method: 'POST',
      payload: {}
    };

    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(403);
      done();
    });
  });

  it('renders an error if the username already exists', function(done) {

    var mock = nock("https://user-api-example.com")
      .get("/scope/bob")
      .reply(200, fixtures.scopes.bob);

    server.inject(postSignup(forms.alreadyExists), function(resp) {
      mock.done();
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/signup-form');
      expect(source.context.errors[0]).to.contain({
        message: 'username already exists'
      });
      done();
    });
  });

  it('fails validation with incomplete form fields', function(done) {

    var mock = nock("https://user-api-example.com")
      .get("/scope/fakeusercli")
      .reply(404);


    server.inject(postSignup(forms.incomplete), function(resp) {
      mock.done();
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/signup-form');
      expect(source.context.errors[0]).to.contain({
        message: 'verify is required'
      });
      done();
    });
  });

  it('fails validation with a bad email address', function(done) {
    var mock = nock("https://user-api-example.com")
      .get("/scope/fakeusercli")
      .reply(404);

    server.inject(postSignup(forms.badEmail), function(resp) {
      mock.done();
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/signup-form');
      expect(source.context.errors[0]).to.contain({
        message: 'email must be a valid email'
      });
      done();
    });
  });

  it('fails validation with a bad username (dot)', function(done) {
    var mock = nock("https://user-api-example.com")
      .get("/scope/.fakeusercli")
      .reply(404);


    server.inject(postSignup(forms.badUsernameDot), function(resp) {
      mock.done();
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/signup-form');
      expect(source.context.errors[0]).to.contain({
        message: 'Username may not start with "."'
      });
      done();
    });
  });

  it('fails validation with a bad username (uppercase)', function(done) {
    var mock = nock("https://user-api-example.com")
      .get("/scope/FAkeusercli")
      .reply(404);


    server.inject(postSignup(forms.badUsernameCaps), function(resp) {
      mock.done();
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/signup-form');
      expect(source.context.errors[0]).to.contain({
        message: 'Username must be lowercase'
      });
      done();
    });
  });

  it('fails validation with a bad username (encodeURI)', function(done) {
    var mock = nock("https://user-api-example.com")
      .get("/scope/blärgh")
      .reply(404);


    server.inject(postSignup(forms.badUsernameEncodeURI), function(resp) {
      mock.done();
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/signup-form');
      expect(source.context.errors[0]).to.contain({
        message: 'Username may not contain non-url-safe chars'
      });
      done();
    });
  });

  it('fails validation with non-matching passwords', function(done) {
    var mock = nock("https://user-api-example.com")
      .get("/scope/fakeusercli")
      .reply(404);


    server.inject(postSignup(forms.invalidPassMatch), function(resp) {
      mock.done();
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/signup-form');
      expect(source.context.errors[0]).to.contain({
        message: 'passwords don\'t match'
      });
      done();
    });
  });

  it('passes validation with a valid form', function(done) {

    var mock = nock("https://user-api-example.com")
      .get("/scope/newuser")
      .reply(404)
      .put("/user", {
        name: 'newuser',
        password: '12345',
        verify: '12345',
        email: 'fakeusercli@boom.com'
      })
      .reply(200, fixtures.users.mikeal);

    server.inject(postSignup(forms.good), function(resp) {
      mock.done();
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('profile-edit');
      assertEmail();
      done();
    });
  });

  it('passes validation with an umlaut in the password', function(done) {

    var mock = nock("https://user-api-example.com")
      .get("/scope/newuser")
      .reply(404)
      .put("/user", {
        name: 'newuser',
        password: 'one two threë',
        verify: 'one two threë',
        email: 'fakeusercli@boom.com'
      })
      .reply(200, fixtures.users.mikeal);


    server.inject(postSignup(forms.goodPassWithUmlaut), function(resp) {
      mock.done();
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('profile-edit');
      assertEmail();
      done();
    });
  });
});
