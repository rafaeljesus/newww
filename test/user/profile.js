var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect;

var server;
var users = require('../fixtures/users'),
    fakeBrowse = require('../fixtures/browseData');

var username1 = 'fakeuser',
    username2 = 'fakeusercli';

// prepare the server
before(function (done) {
  require('../fixtures/setupServer')(function (obj) {
    server = obj;
    done();
  });
});

after(function (done) {
  server.stop(done);
});

describe('Retreiving profiles from the registry', function () {

  it('gets a website-registered user from the registry', function (done) {
    server.inject('/~' + username1, function (resp) {
      expect(resp.statusCode).to.equal(200);

      // Modifying the profile before sending it to the template
      var source = resp.request.response.source;
      var profile = source.context.profile;

      // sends the transformed profile
      expect(profile.title).to.equal(username1);
      expect(profile.name).to.equal(username1);

      // includes stars
      expect(fakeBrowse.userstar.length).to.be.above(20);

      // includes avatar links
      expect(profile.avatar).to.exist();
      expect(profile.avatar).to.contain('gravatar');

      done();
    });
  });

  it('gets a cli-registered user from the registry', function (done) {
    server.inject('/~' + username2, function (resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;

      // sends the profile to the profile template
      expect(source.template).to.equal('user/profile');

      // Modifying the profile before sending it to the template
      var profile = source.context.profile;

      // sends the transformed profile
      expect(profile.title).to.equal(username2);
      expect(profile.name).to.equal(username2);

      // includes stars
      expect(fakeBrowse.userstar.length).to.be.above(20);

      // includes avatar links
      expect(profile.avatar).to.exist();
      expect(profile.avatar).to.contain('gravatar');

      done();
    });
  });


  it('renders an error page with a user that doesn\'t exist', function (done) {
    server.inject('/~blerg', function (resp) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/profile-not-found');
      expect(source.context.correlationID).to.exist();
      expect(resp.payload).to.include(source.context.correlationID);
      done();
    });
  });

  describe("JSON responses", function() {
    before(function (done) {
      process.env.NODE_ENV = 'production';
      done();
    });

    after(function (done) {
      process.env.NODE_ENV = 'dev';
      done();
    });


    it('allows logged-in npm employees to request the view context with a `json` query param', function (done) {
      var options = {
        url: '/~' + username1 + '?json',
        credentials: users.npmEmployee
      };
      expect(process.env.NODE_ENV).to.equal("production");
      server.inject(options, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(resp.headers['content-type']).to.match(/json/);
        expect(resp.result).to.be.an.object();
        done();
      });
    });


    it('does not allow logged-in non-employees to request the view context', function (done) {
      var options = {
        url: '/~' + username1 + '?json',
        credentials: users.fakeuser
      };
      expect(process.env.NODE_ENV).to.equal("production");
      server.inject(options, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(resp.headers['content-type']).to.match(/html/);
        var source = resp.request.response.source;
        expect(source.template).to.equal('user/profile');
        done();
      });
    });

    it('does not allow anonymous users to request the view context', function (done) {
      var options = {
        url: '/~' + username1 + '?json',
        credentials: users.fakeuser
      };
      expect(process.env.NODE_ENV).to.equal("production");
      server.inject(options, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(resp.headers['content-type']).to.match(/html/);
        var source = resp.request.response.source;
        expect(source.template).to.equal('user/profile');
        done();
      });
    });

    it('allows anyone to request the view context if NODE_ENV is `dev`', function (done) {
      process.env.NODE_ENV = "dev";
      expect(process.env.NODE_ENV).to.equal("dev");
      var options = {
        url: '/~' + username1 + '?json',
        credentials: null
      };
      server.inject(options, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(resp.headers['content-type']).to.match(/json/);
        expect(resp.result).to.be.an.object();
        done();
      });
    });
  });
});
