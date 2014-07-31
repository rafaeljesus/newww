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
  // configure couch
  var couchDB = require('../../../couchDB');
  couchDB.init(config);

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
    server.methods.registry.getPackage('request', function (er, pkg) {
      expect(er).to.not.exist;
      expect(pkg).to.exist;
      expect(pkg.name).to.equal('request');
      done();
    });
  });

  it('returns an error for packages that don\'t exist', function (done) {
    server.methods.registry.getPackage('goober', function (er, pkg) {
      expect(er).to.exist;
      expect(er.output.statusCode).to.equal(404);
      expect(pkg).to.not.exist;
      done();
    })
  });
});

describe('browsing', function () {
  it('gets the top 10 starred packages', function (done) {
    server.methods.registry.getBrowseData('star', null, 0, 10, function (er, data) {
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
    server.methods.registry.packagesCreated(function (er, packages) {
      expect(er).to.not.exist;
      expect(packages).to.be.a.number;
      expect(packages).to.be.gt(0);
      done();
    })
  });
});