var Lab = require('lab'),
    describe = Lab.experiment,
    before = Lab.before,
    it = Lab.test,
    expect = Lab.expect;

var Hapi = require('hapi'),
    nock = require('nock'),
    config = require('../../../config').couch,
    metricsConfig = require('../../../config').metrics,
    couch = require('../index.js'),
    MetricsClient = require('newww-metrics');

var server;

before(function (done) {
  // configure couch
  var couchDB = require('../../../adapters/couchDB');
  couchDB.init(config);

  var metrics = new MetricsClient(metricsConfig);

  server = Hapi.createServer('localhost', '7110');
  server.pack.register([
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

    var couch = nock(config.registryCouch)
        .get('/registry/request')
        .reply(200, require('./fixtures/request'))

    server.methods.registry.getPackage('request', function (er, pkg) {
      expect(er).to.not.exist;
      expect(pkg).to.exist;
      expect(pkg.name).to.equal('request');
      done();
    });
  });

  it('returns an error for packages that don\'t exist', function (done) {
    var couch = nock(config.registryCouch)
        .get('/registry/goober')
        .reply(404, {"error":"not_found","reason":"missing"})

    server.methods.registry.getPackage('goober', function (er, pkg) {
      expect(er).to.exist;
      expect(er.output.statusCode).to.equal(404);
      expect(pkg).to.not.exist;
      done();
    })
  });
});

describe('browsing', function () {
  it('gets all the packages', function (done) {
    var couch = nock(config.registryCouch)
        .get('/registry/_design/app/_view/browseAll?group_level=2&skip=0&limit=10&stale=update_after')
        .reply(200, require('./fixtures/browse').browseAll)

    server.methods.registry.getAllPackages(0, 10, function (er, data) {
      expect(er).to.not.exist;
      expect(data).to.be.an.Array;
      expect(data).to.have.length(10);
      done();
    });
  });

  it('gets the top 10 most recently updated packages', function (done) {
    var couch = nock(config.registryCouch)
        .get('/registry/_design/app/_view/browseUpdated?group_level=5&skip=0&limit=10&descending=true&stale=update_after')
        .reply(200, require('./fixtures/browse').updated)

    server.methods.registry.getUpdated(0, 10, function (er, data) {
      expect(er).to.not.exist;
      expect(data).to.be.an.Array;
      expect(data).to.have.length(10);
      done();
    });
  });

  describe('by keyword', function () {
    it('gets the first 10 keywords', function (done) {
      var couch = nock(config.registryCouch)
          .get('/registry/_design/app/_view/byKeyword?group_level=1&stale=update_after')
          .reply(200, require('./fixtures/browse').allKeywords)

      server.methods.registry.getAllByKeyword(false, 0, 10, function (er, data) {
        expect(er).to.not.exist;
        expect(data).to.be.an.Array;
        expect(data).to.have.length(10);
        done();
      });
    });

    it('gets the first 10 packages matching a keyword', function (done) {
      var keyword = 'angular';

      var couch = nock(config.registryCouch)
          .get('/registry/_design/app/_view/byKeyword?group_level=3&startkey=%5B%22' + keyword +'%22%5D&endkey=%5B%22' + keyword +'%22%2C%7B%7D%5D&skip=0&limit=10&stale=update_after')
          .reply(200, require('./fixtures/browse').byKeyword)

      server.methods.registry.getAllByKeyword(keyword, 0, 10, function (er, data) {
        expect(er).to.not.exist;
        expect(data).to.be.an.Array;
        expect(data).to.have.length(10);
        done();
      });
    });
  });

  describe('by author', function () {
    it('gets the first 10 authors', function (done) {
      var couch = nock(config.registryCouch)
          .get('/registry/_design/app/_view/browseAuthors?group_level=1&stale=update_after')
          .reply(200, require('./fixtures/browse').allAuthors)

      server.methods.registry.getAuthors(false, 0, 10, function (er, data) {
        expect(er).to.not.exist;
        expect(data).to.be.an.Array;
        expect(data).to.have.length(10);
        done();
      });
    });

    it('gets the first 10 packages matching an author', function (done) {
      var author = 'substack';

      var couch = nock(config.registryCouch)
          .get('/registry/_design/app/_view/browseAuthors?group_level=3&startkey=%5B%22' + author + '%22%5D&endkey=%5B%22' + author + '%22%2C%7B%7D%5D&skip=0&limit=10&stale=update_after')
          .reply(200, require('./fixtures/browse').byAuthor)

      server.methods.registry.getAuthors(author, 0, 10, function (er, data) {
        expect(er).to.not.exist;
        expect(data).to.be.an.Array;
        expect(data).to.have.length(10);
        done();
      });
    });
  });

  describe('by depended upon', function () {
    it('gets the first 10 depended upon', function (done) {
      var couch = nock(config.registryCouch)
          .get('/registry/_design/app/_view/dependedUpon?group_level=1&stale=update_after')
          .reply(200, require('./fixtures/browse').allDepended)

      server.methods.registry.getDependedUpon(false, 0, 10, function (er, data) {
        expect(er).to.not.exist;
        expect(data).to.be.an.Array;
        expect(data).to.have.length(10);
        done();
      });
    });

    it('gets the first 10 packages that depend upon a specific package', function (done) {
      var pkg = 'underscore';

      var couch = nock(config.registryCouch)
          .get('/registry/_design/app/_view/dependedUpon?group_level=5&startkey=%5B%22' + pkg + '%22%5D&endkey=%5B%22' + pkg + '%22%2C%7B%7D%5D&skip=0&limit=10&stale=update_after')
          .reply(200, require('./fixtures/browse').byDependedUpon)

      server.methods.registry.getDependedUpon(pkg, 0, 10, function (er, data) {
        expect(er).to.not.exist;
        expect(data).to.be.an.Array;
        expect(data).to.have.length(10);
        done();
      });
    });
  });

  describe('by starred packages', function () {
    it('gets the top 10 starred packages', function (done) {
      var couch = nock(config.registryCouch)
          .get('/registry/_design/app/_view/browseStarPackage?group_level=2&stale=update_after')
          .reply(200, require('./fixtures/browse').stars)

      server.methods.registry.getStarredPackages(false, 0, 10, function (er, data) {
        expect(er).to.not.exist;
        expect(data).to.be.an.Array;
        expect(data).to.have.length(10);
        expect(data[0]).to.have.property('name');
        expect(data[0]).to.have.property('description');
        expect(data[0]).to.have.property('url');
        done();
      })
    });

    it('gets the first 10 packages that depend upon a specific package', function (done) {
      var pkg = 'underscore';

      var couch = nock(config.registryCouch)
          .get('/registry/_design/app/_view/browseStarPackage?group_level=5&startkey=%5B%22' + pkg + '%22%5D&endkey=%5B%22' + pkg + '%22%2C%7B%7D%5D&skip=0&limit=10&stale=update_after')
          .reply(200, require('./fixtures/browse').usersWhoStarredPackage)

      server.methods.registry.getStarredPackages(pkg, 0, 10, function (er, data) {
        expect(er).to.not.exist;
        expect(data).to.be.an.Array;
        expect(data).to.have.length(10);
        done();
      });
    });
  });

  describe('by user stars', function () {
    it('gets the top 10 users who have starred packages', function (done) {
      var couch = nock(config.registryCouch)
          .get('/registry/_design/app/_view/browseStarUser?group_level=1&stale=update_after')
          .reply(200, require('./fixtures/browse').userstars)

      server.methods.registry.getUserStars(false, 0, 10, function (er, data) {
        expect(er).to.not.exist;
        expect(data).to.be.an.Array;
        expect(data).to.have.length(10);
        expect(data[0]).to.have.property('name');
        expect(data[0]).to.have.property('description');
        expect(data[0]).to.have.property('url');
        done();
      })
    });

    it('gets the first 10 packages that have been starred by a specific user', function (done) {
      var user = 'substack';

      var couch = nock(config.registryCouch)
          .get('/registry/_design/app/_view/browseStarUser?group_level=3&startkey=%5B%22' + user + '%22%5D&endkey=%5B%22' + user + '%22%2C%7B%7D%5D&skip=0&limit=10&stale=update_after')
          .reply(200, require('./fixtures/browse').starsByUser)

      server.methods.registry.getUserStars(user, 0, 10, function (er, data) {
        expect(er).to.not.exist;
        expect(data).to.be.an.Array;
        expect(data).to.have.length(10);
        done();
      });
    });
  });
});

describe('getting recent authors', function () {
  it('gets the top 10 recent authors', function (done) {
    var TWO_WEEKS = 1000 * 60 * 60 * 24 * 14; // in milliseconds

    var couch = nock(config.registryCouch)
        .filteringPath(/startkey=[^&]*/g, 'startkey=XXX')
        .get('/registry/_design/app/_view/browseAuthorsRecent?group_level=2&startkey=XXX&stale=update_after').twice()
        .reply(200, require('./fixtures/browse').authors)


    server.methods.registry.getRecentAuthors(TWO_WEEKS, 0, 10, function (er, authors) {
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
    var couch = nock(config.registryCouch)
        .put('/registry/_design/app/_update/star/request', 'boom')
        .reply(201, { ok: 'starred'})

    server.methods.registry.star('request', 'boom', function (er, data) {
      expect(er).to.not.exist;
      expect(data).to.exist;
      expect(data.ok).to.equal('starred');
      done();
    });
  });
});

describe('unstarring a package', function () {
  it('removes a star from a package', function (done) {
    var couch = nock(config.registryCouch)
        .put('/registry/_design/app/_update/unstar/request', 'boom')
        .reply(201, { ok: 'unstarred'})

    server.methods.registry.unstar('request', 'boom', function (er, data) {
      expect(er).to.not.exist;
      expect(data).to.exist;
      expect(data.ok).to.equal('unstarred');
      done();
    });
  });
});

describe('getting total number of packages', function () {
  it('gets the number of packages in the registry', function (done) {

    var couch = nock(config.registryCouch)
        .filteringPath(/startkey=[^&]*/g, 'startkey=XXX')
        .get('/registry/_design/app/_view/fieldsInUse?group_level=1&startkey=XXX&endkey=%22name%22&stale=update_after')
        .reply(200, { rows: [ { key: 'name', value: 3681 } ] })

    server.methods.registry.packagesCreated(function (er, packages) {
      expect(er).to.not.exist;
      expect(packages).to.be.a.number;
      expect(packages).to.be.gt(0);
      done();
    })
  });
});