var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect;

var server, cookieCrumb,
    fakeuser = require('../fixtures/users').fakeuser,
    fakeProfile = require('../fixtures/users').fakeuserNewProfile;

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
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/profile-edit');
      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');
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

  it('rejects profile modifications that don\'t include CSRF data', function (done) {
    var options = {
      url: '/profile-edit',
      method: 'POST',
      payload: fakeProfile,
      credentials: fakeuser
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(403);
      done();
    });
  });

  it('allows authorized profile modifications and redirects to profile page', function (done) {
    var options = {
      url: '/profile-edit',
      method: 'POST',
      payload: fakeProfile,
      credentials: fakeuser,
      headers: { cookie: 'crumb=' + cookieCrumb }
    };

    options.payload.crumb = cookieCrumb;

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('profile');
      var cache = resp.request.server.app.cache._cache.connection.cache['|sessions'];
      // modifies the profile properly
      var cacheData = JSON.parse(cache['460002dc'].item);
      expect(cacheData.github).to.equal(fakeProfile.github);
      expect(cacheData.fields[3].value).to.equal(fakeProfile.twitter);
      done();
    });
  });

  it('rejects _id, name, and email from the payload', function (done) {
    var options = {
      url: '/profile-edit',
      method: 'POST',
      payload: fakeProfile,
      credentials: fakeuser,
      headers: { cookie: 'crumb=' + cookieCrumb }
    };

    options.payload.crumb = cookieCrumb;

    options.payload._id = 'org.couchdb.user:badguy';
    options.payload.name = 'badguy';
    options.payload.email = 'badguy@bad.com';

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.context.user).to.exist();
      expect(source.context.error).to.exist();
      expect(source.context.error.details).to.be.an.array;
      var names = source.context.error.details.map(function(detail){
        return detail.path
      })
      expect(names).to.include('_id');
      expect(names).to.include('name');
      expect(names).to.include('email');
      expect(source.template).to.equal('user/profile-edit');
      done();
    });

  });
});
