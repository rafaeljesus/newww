var generateCrumb = require("../crumb"),
    Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect,
    nock = require('nock'),
    users = require('../../fixtures').users;

var server;

var postName = function (name_email, crumb) {
  return {
    url: '/forgot',
    method: 'POST',
    payload: {
      name_email: name_email,
      crumb: crumb
    },
    headers: { cookie: 'crumb=' + crumb }
  };
};


before(function (done) {
  require('../../mocks/server')(function (obj) {
    server = obj;
    server.app.cache._cache.connection.client = {};
    done();
  });
});

after(function (done) {
  delete server.app.cache._cache.connection.client;
  server.stop(done);
});

describe('Accessing the forgot password page', function () {
  it('loads the forgot password page', function (done) {
    var options = {
      url: '/forgot'
    };

    server.inject(options, function (resp) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/password-recovery-form');
      expect(resp.statusCode).to.equal(200);
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
    generateCrumb(server, function (crumb){
      server.inject(postName(null, crumb), function (resp) {
        var source = resp.request.response.source;
        expect(source.template).to.equal('user/password-recovery-form');
        expect(source.context.error).to.equal('All fields are required');
        expect(resp.statusCode).to.equal(400);
        done();
      });
    });
  });

  it('renders an error if the username is invalid', function (done) {
    generateCrumb(server, function (crumb){
      server.inject(postName('.baduser', crumb), function (resp) {
        var source = resp.request.response.source;
        expect(source.template).to.equal('user/password-recovery-form');
        expect(source.context.error).to.equal('Need a valid username or email address');
        expect(resp.statusCode).to.equal(400);
        done();
      });
    });
  });

  it('renders an error if the email is invalid', function (done) {
    generateCrumb(server, function (crumb){
      server.inject(postName('bad@email', crumb), function (resp) {
        var source = resp.request.response.source;
        expect(source.template).to.equal('user/password-recovery-form');
        expect(source.context.error).to.equal('Need a valid username or email address');
        expect(resp.statusCode).to.equal(400);
        done();
      });
    });
  });
});

describe('Looking up a user', function () {
  describe('by username', function () {
    it('renders an error if the username doesn\'t exist', function (done) {

      var name = 'mr-perdido';
      var mock = nock("https://user-api-example.com")
        .get("/user/" + name)
        .reply(404);

      generateCrumb(server, function (crumb){
        server.inject(postName(name, crumb), function (resp) {
          mock.done();
          var source = resp.request.response.source;
          expect(source.template).to.equal('user/password-recovery-form');
          expect(source.context.error).to.equal('404 - not found');
          expect(resp.statusCode).to.equal(404);
          done();
        });
      });
    });

    it('renders an error if the user does not have an email address', function (done) {
      var name = 'early_user';

      var mock = nock("https://user-api-example.com")
        .get("/user/" + name)
        .reply(200, users.no_email);

      generateCrumb(server, function (crumb){
        server.inject(postName(name, crumb), function (resp) {
          mock.done();
          var source = resp.request.response.source;
          expect(source.template).to.equal('user/password-recovery-form');
          expect(source.context.error).to.equal('Username does not have an email address; please contact support');
          expect(resp.statusCode).to.equal(400);
          done();
        });
      });
    });

    it('renders an error if the user\'s email address is invalid', function (done) {
      var name = 'lolbademail';

      var mock = nock("https://user-api-example.com")
        .get("/user/" + name)
        .reply(200, users.bad_email);

      generateCrumb(server, function (crumb){
        server.inject(postName(name, crumb), function (resp) {
          mock.done();
          var source = resp.request.response.source;
          expect(source.template).to.equal('user/password-recovery-form');
          expect(source.context.error).to.equal("Username's email address is invalid; please contact support");
          expect(resp.statusCode).to.equal(400);
          done();
        });
      });
    });

    it('sends an email when everything finally goes right', function (done) {
      var name = 'bob';

      var mock = nock("https://user-api-example.com")
        .get("/user/" + name)
        .reply(200, users.bob);

      generateCrumb(server, function (crumb){
        server.inject(postName(name, crumb), function (resp) {
          mock.done();
          expect(resp.request.response.source.template).to.equal('user/password-recovery-form');
          expect(resp.statusCode).to.equal(200);
          done();
        });
      });
    });
  });

  describe('by email', function () {
    it('renders an error if the email doesn\'t exist', function (done) {
      var email = 'doesnotexist@boom.com';

      var mock = nock("https://user-api-example.com")
        .get("/user/" + email)
        .reply(200, []);

      generateCrumb(server, function (crumb){
        server.inject(postName(email, crumb), function (resp) {
          mock.done();
          var source = resp.request.response.source;
          expect(source.template).to.equal('user/password-recovery-form');
          expect(source.context.error).to.equal('No user found with email address doesnotexist@boom.com');
          expect(resp.statusCode).to.equal(400);
          done();
        });
      });
    });

    it('renders a list of usernames if the email matches more than one username', function (done) {
      var email = "bob@boom.me";

      var mock = nock("https://user-api-example.com")
        .get("/user/" + email)
        .reply(200, ['bob', 'bobUpdated']);

      generateCrumb(server, function (crumb){
        server.inject(postName(email, crumb), function (resp) {
          mock.done();
          var source = resp.request.response.source;
          expect(source.template).to.equal('user/password-recovery-form');
          expect(resp.statusCode).to.equal(200);
          expect(source.context.error).to.not.exist();
          expect(source.context.users).to.include("bob");
          expect(source.context.users).to.include("bobUpdated");
          done();
        });
      });
    });

    it('sends an email when a username is chosen from the dropdown', function (done) {

      var mock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, users.bob);

      generateCrumb(server, function (crumb){
        var options = {
          url: '/forgot',
          method: 'POST',
          payload: {
            selected_name: "bob",
            crumb: crumb
          },
          headers: { cookie: 'crumb=' + crumb }
        };

        server.inject(options, function (resp) {
          mock.done();
          expect(resp.request.response.source.template).to.equal('user/password-recovery-form');
          expect(resp.statusCode).to.equal(200);
          done();
        });
      });
    });

    it('sends an email when everything finally goes right', function (done) {

      var email = "bob@boom.me";

      var mock = nock("https://user-api-example.com")
        .get("/user/" + email)
        .reply(200, ['bob'])
        .get("/user/bob")
        .reply(200, users.bob);

      generateCrumb(server, function (crumb){
        server.inject(postName(email, crumb), function (resp) {
          mock.done();
          expect(resp.request.response.source.template).to.equal('user/password-recovery-form');
          expect(resp.statusCode).to.equal(200);
          done();
        });
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
