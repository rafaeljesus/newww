var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect;

var server, source, u = {};
var users = require('../fixtures/users'),
    fakeBrowse = require('../fixtures/browseData');

var username1 = 'fakeuser',
    username2 = 'fakeusercli';

// prepare the server
before(function (done) {
  server = require('../fixtures/setupServer')(done);

  server.ext('onPreResponse', function (request, next) {
    source = request.response.source;
    if (source.context.profile) {
      var username = source.context.profile.title;
      u[username] = source.context.profile;
    }
    next();
  });
});

describe('Retreiving profiles from the registry', function () {

  it('gets a website-registered user from the registry', function (done) {
    var options = {
      url: '/~' + username1
    }

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      done();
    });
  });

  it('gets a cli-registered user from the registry', function (done) {
    var options = {
      url: '/~' + username2
    }

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      done();
    });
  });

  it('sends the profile to the profile template', function (done) {
    expect(source.template).to.equal('user/profile');
    done();
  });

  it('renders an error page with a user that doesn\'t exist', function (done) {
    var options = {
      url: '/~blerg'
    }

    server.inject(options, function (resp) {
      expect(source.template).to.equal('user/profile-not-found');
      done();
    });
  });
});


// TODO: Move this to test/presenters/user.js
describe('Modifying the profile before sending it to the template', function () {
  it('sends the transformed profile', function (done) {
    expect(u[username1].name).to.equal(username1);
    expect(u[username2].name).to.equal(username2);
    done();
  });

  it('includes stars', function (done) {
    expect(fakeBrowse['userstar'].length).to.be.gt(20);
    done();
  });

  it('includes avatar links', function (done) {
    expect(u[username1].avatar).to.exist;
    expect(u[username1].avatar).to.contain('gravatar');
    // expect(u[username2].avatar).to.exist;
    // expect(u[username2].avatar).to.contain('gravatar');
    done();
  });
});

after(function (done) {
  server.app.cache._cache.connection.stop();
  done();
});
