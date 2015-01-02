var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    beforeEach = lab.beforeEach,
    it = lab.test,
    expect = Lab.expect,
    cheerio = require("cheerio");

var server, p, source, cookieCrumb;
var oriReadme = require('../fixtures/fake.json').readme;

beforeEach(function (done) {
  server = require('../fixtures/setupServer')(done);

  server.ext('onPreResponse', function (request, next) {
    source = request.response.source;
    p = source.context.package;
    next();
  });
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
      expect(source.context.package.name).to.equal(pkgName);
      expect(resp.result).to.include('value="' + cookieCrumb + '"');
      done();
    });
  });

  it('sends the package to the package-page template', function (done) {
    expect(source.template).to.equal('registry/package-page');
    done();
  });
});

describe('Modifying the package before sending to the template', function () {
  it('adds publisher is in the maintainers list', function (done) {
    expect(p.publisherIsInMaintainersList).to.exist;
    done();
  });

  it('adds avatar information to author and maintainers', function (done) {
    expect(p._npmUser.avatar).to.exist;
    expect(p.maintainers[0].avatar).to.exist;
    expect(p._npmUser.avatar).to.include('gravatar');
    done();
  });

  it('adds an OSS license', function (done) {
    expect(p.license).to.be.an('object');
    expect(p.license.url).to.include('opensource.org');
    done();
  });

  it('turns the readme into HTML for viewing on the website', function (done) {
    expect(p.readme).to.not.equal(oriReadme);
    expect(p.readmeSrc).to.equal(oriReadme);
    expect(p.readme).to.include('<a href=');
    done();
  });

  it('includes the dependencies', function (done) {
    expect(p.dependencies).to.exist;
    done();
  });

  it('includes the dependents', function (done) {
    expect(p.dependents).to.exist;
    done();
  });

  it('treats unpublished packages specially', function (done) {
    var options = {
      url: '/package/unpub'
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('registry/unpublished-package-page');
      expect(source.context.package.unpubFromNow).to.exist;
      done();
    });
  });
});

describe('getting package download information', function () {
  it('sends an object of data if the user is not logged in', function (done) {
    var options = {
      url: '/package/fake'
    };

    server.inject(options, function () {
      expect(source.context.package.downloads).to.be.an('object');
      expect(source.context.package.downloads).to.have.property('day');
      expect(source.context.package.downloads).to.have.property('week');
      expect(source.context.package.downloads).to.have.property('month');
      done();
    });
  });
});

describe('requesting nonexistent packages', function () {
  var name = 'a-package-that-does-not-exist';
  var options = {
    url: '/package/' + name
  }

  it('returns a 404', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(404);
      done();
    });
  });

  it('adds package.name to view context', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(404);
      expect(source.context.package.name).to.exist
      done();
    });
  });

  it('renders the 404 template', function (done) {
    server.inject(options, function (resp) {
      expect(source.template).to.equal('errors/not-found');
      done();
    });
  });
});

describe('requesting invalid packages', function () {
  var name = '_.escape';
  var options = {
    url: '/package/' + name
  }

  it('returns a 404', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(404);
      done();
    });
  });

  it('does NOT add package.name to view context', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(404);
      expect(source.context.package).to.not.exist
      done();
    });
  });

  it('renders the 404 template', function (done) {
    server.inject(options, function (resp) {
      expect(source.template).to.equal('errors/not-found');
      done();
    });
  });
});
