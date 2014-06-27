var Lab = require('lab'),
    describe = Lab.experiment,
    before = Lab.before,
    it = Lab.test,
    expect = Lab.expect;

var server, source, cache,
    fakeuser = require('./fixtures/users').fakeuser,
    fakeProfile = require('./fixtures/users').fakeuserNewProfile;

// prepare the server
before(function (done) {
  server = require('./fixtures/setupServer')(done);

  server.ext('onPreResponse', function (request, next) {
    cache = request.server.app.cache._cache.connection.cache['|sessions'];
    source = request.response.source;
    next();
  });

});

describe('Getting to the profile-edit page', function () {
  it('redirects an unauthorized user to the login page', function (done) {
    var options = {
      url: '/profile-edit'
    }

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  it('takes authorized users to the profile-edit page', function (done) {
    var options = {
      url: '/profile-edit',
      credentials: fakeuser
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('profile-edit');
      done();
    });
  });
});

describe('Modifying the profile', function () {
  it('redirects an unauthorized user to the login page', function (done) {
    var options = {
      url: '/profile-edit',
      method: 'POST',
      payload: fakeProfile
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  it('allows authorized profile modifications and redirects to profile page', function (done) {
    var options = {
      url: '/profile-edit',
      method: 'POST',
      payload: fakeProfile,
      credentials: fakeuser
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('profile');
      done();
    });
  });

  it('modifies the profile properly', function (done) {
    var cacheData = JSON.parse(cache['460002dc'].item);
    expect(cacheData.github).to.equal(fakeProfile.github);
    expect(cacheData.fields[3].value).to.equal(fakeProfile.twitter);
    done();
  })
});




