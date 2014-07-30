var Lab = require('lab')
  , describe = Lab.experiment
  , before = Lab.before
  , it = Lab.test
  , expect = Lab.expect;

var Hapi = require('hapi'),
    nock = require('nock'),
    config = require('../../../config').couch,
    couch = require('../index.js');

var couchdb = require('./fixtures/fake-couch')(config),
    server;

before(function (done) {
  server = Hapi.createServer('localhost', '8000');
  server.pack.register([
    require('./fixtures/fake-metrics'),
    {
      plugin: couch,
      options: config
    }
  ], function () {
    server.start(done);
  });
});

describe('getting packages from couch', function () {
  it('successfully grabs a package', function (done) {
    server.methods.couch.getPackage('request', function (er, pkg) {
      expect(er).to.not.exist;
      expect(pkg).to.exist;
      expect(pkg.name).to.equal('request');
      done();
    });
  });

  it('returns an error for packages that don\'t exist', function (done) {
    server.methods.couch.getPackage('goober', function (er, pkg) {
      expect(er).to.exist;
      expect(er.output.statusCode).to.equal(404);
      expect(pkg).to.not.exist;
      done();
    })
  });
});

describe('getting user info from couch', function () {
  it('successfully grabs a user', function (done) {
    server.methods.couch.getUser('blah', function (er, user) {
      expect(er).to.not.exist;
      expect(user).to.exist;
      expect(user.name).to.equal('blah');
      done();
    });
  });

  it('fails if the user doesn\'t exist', function (done) {
    server.methods.couch.getUser('boop', function (er, user) {
      expect(er).to.exist;
      expect(er.output.statusCode).to.equal(404);
      expect(user).to.not.exist;
      done();
    });
  });
});

describe('signing up a user', function () {
  it('successfully creates a new account', function (done) {
    server.methods.couch.signupUser({
      name: 'boom',
      password: '12345',
      verify: '12345',
      email: 'boom@boom.com'
    }, function (er, user) {
      expect(er).to.not.exist;
      expect(user).to.exist;
      expect(user.name).to.equal('boom');
      done();
    });
  });
});

describe('saving a profile', function () {
  it('successfully saves a profile with proper inputs', function (done) {
    var user = {
      _id: 'blah',
      otherStuff: 'things'
    };

    server.methods.couch.saveProfile(user, function (er, data) {
      expect(er).to.not.exist;
      expect(data).to.exist;
      expect(data.ok).to.equal('updated profile');
      done();
    });
  });
});

describe('changing a password', function () {
  it('successfully changes a password with the proper inputs', function (done) {
    server.methods.couch.changePass({name: 'boom', password: '12345'}, function (er, data) {
      expect(er).to.not.exist;
      expect(data).to.exist;
      expect(data.name).to.equal('boom');
      done();
    })
  });
});

describe('changing email', function () {
  it('successfully changes a user\'s email address', function (done) {
    server.methods.couch.changeEmail('boom', 'boom@boom.net', function (er) {
      expect(er).to.not.exist;
      done();
    });
  });
});

describe('browsing', function () {
  it('gets the top 10 starred packages', function (done) {
    server.methods.couch.getBrowseData('star', null, 0, 10, function (er, data) {
      expect(er).to.not.exist;
      expect(data).to.be.an.Array;
      expect(data).to.have.length(10);
      expect(data[0]).to.have.property('name');
      expect(data[0]).to.have.property('description');
      expect(data[0]).to.have.property('url');
      done();
    })
  });
});

describe('getting recent authors', function () {
  it('gets the top 10 recent authors', function (done) {
    var TWO_WEEKS = 1000 * 60 * 60 * 24 * 14; // in milliseconds

    server.methods.couch.getRecentAuthors(TWO_WEEKS, 0, 10, function (er, authors) {
      expect(er).to.not.exist;
      expect(authors).to.be.an.Array;
      expect(authors).to.have.length(10);
      expect(authors[0]).to.have.property('name');
      expect(authors[0]).to.have.property('description');
      expect(authors[0]).to.have.property('url');
      done();
    })
  });
});

describe('starring a package', function () {
  it('adds a star to a package', function (done) {
    server.methods.couch.star('request', 'boom', function (er, data) {
      expect(er).to.not.exist;
      expect(data).to.exist;
      expect(data.ok).to.equal('starred');
      done();
    });
  });
});

describe('unstarring a package', function () {
  it('removes a star from a package', function (done) {
    server.methods.couch.unstar('request', 'boom', function (er, data) {
      expect(er).to.not.exist;
      expect(data).to.exist;
      expect(data.ok).to.equal('unstarred');
      done();
    });
  });
});

describe('getting total number of packages', function () {
  it('gets the number of packages in the registry', function (done) {
    server.methods.couch.packagesCreated(function (er, packages) {
      expect(er).to.not.exist;
      expect(packages).to.be.a.number;
      expect(packages).to.be.gt(0);
      done();
    })
  });
});

describe('logging in and out', function () {
  it('allows a user to log in with proper credentials', function (done) {
    server.methods.couch.loginUser({name: 'boom', password: '12345'}, function (er, user) {
      expect(er).to.not.exist;
      expect(user).to.exist;
      expect(user.name).to.equal('boom');
      expect(user.token).to.exist;
      done();
    });
  });

  it('allows a user to log out', function (done) {
    server.methods.couch.logoutUser('randomToken', function (er, data) {
      expect(er).to.not.exist;
      expect(data).to.exist;
      expect(data.statusCode).to.equal(200);
      done();
    });
  });
});