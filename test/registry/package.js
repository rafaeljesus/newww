var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    it = lab.test,
    expect = Code.expect,
    cheerio = require("cheerio");

var server, cookieCrumb;
var oriReadme = require('../fixtures/packages/fake.json').readme;

// prepare the server
beforeEach(function (done) {
  require('../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

afterEach(function (done) {
  server.stop(done);
});

describe('Retreiving packages from the registry', function () {
  it('gets a package from the registry', function (done) {
    var pkgName = 'fake';

    var options = {
      url: '/package/' + pkgName
    };
    server.inject(options, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.context.package.name).to.equal(pkgName);
      expect(resp.result).to.include('value="' + cookieCrumb + '"');
      expect(source.template).to.equal('registry/package-page');

      // Modifying the package before sending to the template

      // adds publisher is in the maintainers list
      var p = source.context.package;
      expect(p.publisherIsInMaintainersList).to.exist();

      // adds avatar information to author and maintainers
      expect(p._npmUser.avatar).to.exist();
      expect(p.maintainers[0].avatar).to.exist();
      expect(p._npmUser.avatar).to.be.an.object();
      expect(p._npmUser.avatar.small).to.exist();
      expect(p._npmUser.avatar.medium).to.exist();
      expect(p._npmUser.avatar.large).to.exist();

      // adds an OSS license
      expect(p.license).to.be.an.object();
      expect(p.license.url).to.include('opensource.org');


      // includes the dependencies
      expect(p.dependencies).to.exist();

      // includes the dependents
      expect(p.dependents).to.exist();
      done();
    });
  });

  it('treats unpublished packages specially', function (done) {
    var options = {
      url: '/package/unpublished'
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(410);
      var source = resp.request.response.source;
      expect(source.template).to.equal('registry/unpublished-package-page');
      expect(source.context.package.unpubFromNow).to.exist();
      done();
    });
  });
});

describe('getting package download information', function () {
  it('send a downloads data object', function (done) {
    var options = {
      url: '/package/fake'
    };

    server.inject(options, function (resp) {
      var source = resp.request.response.source;
      expect(source.context.package).to.contain('downloads');
      expect(source.context.package.downloads).to.be.an.object();
      expect(source.context.package.downloads).to.contain('day');
      expect(source.context.package.downloads).to.contain('week');
      expect(source.context.package.downloads).to.contain('month');
      done();
    });
  });
});

describe('requesting nonexistent packages', function () {
  var name = 'a-package-that-does-not-exist';
  var options = {
    url: '/package/' + name
  };

  it('returns a 404', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(404);
      done();
    });
  });

  it('adds package.name to view context', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(404);
      var source = resp.request.response.source;
      expect(source.context.package.name).to.exist();
      done();
    });
  });

  it('renders the 404 template', function (done) {
    server.inject(options, function (resp) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/not-found');
      done();
    });
  });
});

describe('requesting invalid packages', function () {
  var name = '_.escape';
  var options = {
    url: '/package/' + name
  };

  it('returns a 400', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(404);
      done();
    });
  });

  it('does NOT add package.name to view context', function (done) {
    server.inject(options, function (resp) {
      var source = resp.request.response.source;
      expect(source.context.package).to.not.exist();
      done();
    });
  });

  it('renders the invalid input template', function (done) {
    server.inject(options, function (resp) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/not-found');
      done();
    });
  });
});

describe('seeing stars', function () {
  it('highlights the star if the user is logged in and has starred the package', function (done) {
    var pkgName = 'fake';

    var options = {
      url: '/package/' + pkgName,
      credentials: { name: 'fakeuser' }
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.context.package.name).to.equal(pkgName);
      expect(source.context.package.isStarred).to.be.true();
      expect(resp.result).to.include('<input id="star-input" type="checkbox" name="isStarred" value="true" checked>');
      done();
    });
  });
});
