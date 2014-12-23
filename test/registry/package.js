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

  it('marks first H1 element as superfluous, if similar to package name', function (done) {
    expect(p.readmeSrc).to.include("# fake");
    expect(p.readmeSrc).to.include("# Another H1");
    var $ = cheerio.load(p.readme);
    expect($("h1.superfluous").length).to.equal(1);
    expect($("h1.superfluous").text()).to.equal("fake");
    expect($("h1:not(.superfluous)").length).to.equal(1);
    expect($("h1:not(.superfluous)").text()).to.equal("Another H1");
    done();
  });

  it('removes shields.io badges from the README', function (done) {
    expect(p.readmeSrc).to.include("img.shields.io");
    var $ = cheerio.load(p.readme);
    expect($("p:has(img[src*='img.shields.io'])").hasClass("superfluous")).to.be.true;
    done();
  });

  it('removes nodei.co badges from the README', function (done) {
    expect(p.readmeSrc).to.include("nodei.co");
    var $ = cheerio.load(p.readme);
    expect($("p:has(img[src*='nodei.co'])").hasClass("superfluous")).to.be.true;
    done();
  });

  it('turns relative URLs into real URLs', function (done) {
    expect(p.readme).to.include('/blob/master');
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

describe('readmes are always sanitized', function () {
  it('even if they are not on the top level', function (done) {
    var options = {
      url: '/package/no_top_level_readme'
    };

    server.inject(options, function () {
      expect(p.name).to.equal('benchmark');
      expect(p.readme).to.include('<h1 id="benchmark');
      expect(p.readme).to.not.include('# Benchmark');
      done();
    });
  });

  it('even if there is no readme', function (done) {
    var options = {
      url: '/package/no_readme'
    };

    server.inject(options, function () {
      expect(p.name).to.equal('benchmark');
      expect(p.readme).to.equal('');
      done();
    });
  });

  it('even if it causes marked to throw', function (done) {
    var options = {
      url: '/package/throw_marked'
    };

    server.inject(options, function () {
      expect(p.name).to.equal('benchmark');
      expect(p.readme).to.equal('');
      done();
    });
  });

  it('even if it is not markdown', function (done) {
    var options = {
      url: '/package/not_markdown'
    };

    server.inject(options, function () {
      expect(p.name).to.equal('benchmark');
      expect(p.readme).to.equal('<p></p><p>hello</p><p></p>\n');
      done();
    });
  });

  it('even if it is a non-markdown readme from a file', function (done) {
    var options = {
      url: '/package/not_markdown_readme_from_file'
    };

    server.inject(options, function () {
      expect(p.name).to.equal('benchmark');
      expect(p.readme).to.equal('<pre>&lt;p&gt;hello&lt;/p&gt;&lt;script&gt;console.log(&apos;boom&apos;)&lt;/script&gt;</pre>');
      done();
    });
  });

  it('even if it is a markdown readme from a file', function (done) {
    var options = {
      url: '/package/markdown_readme_from_file'
    };

    server.inject(options, function () {
      expect(p.name).to.equal('benchmark');
      expect(p.readme).to.equal('<p>hello</p>\n<h2 id=\"boom\">boom</h2>\n');
      done();
    });
  });
});

describe('getting package download information', function () {
  it('send a downloads data object', function (done) {
    var options = {
      url: '/package/fake'
    };

    server.inject(options, function () {

      expect(source.context.package).to.have.property('downloads');
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

  it('returns a 400', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(400);
      done();
    });
  });

  it('does NOT add package.name to view context', function (done) {
    server.inject(options, function (resp) {
      expect(source.context.package).to.not.exist
      done();
    });
  });

  it('renders the invalid input template', function (done) {
    server.inject(options, function (resp) {
      expect(source.template).to.equal('errors/invalid');
      done();
    });
  });
});
