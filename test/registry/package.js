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
var oriReadme = require('../fixtures/fake.json').readme;

// prepare the server
beforeEach(function (done) {
  require('../fixtures/setupServer')(function (obj) {
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
      expect(p._npmUser.avatar).to.include('gravatar');

      // adds an OSS license
      expect(p.license).to.be.an.object();
      expect(p.license.url).to.include('opensource.org');

      // turns the readme into HTML for viewing on the website', function (done) {
      expect(p.readme).to.not.equal(oriReadme);
      expect(p.readmeSrc).to.equal(oriReadme);
      expect(p.readme).to.include('<a href=');

      // marks first H1 element as superfluous, if similar to package name
      expect(p.readmeSrc).to.include("# fake");
      expect(p.readmeSrc).to.include("# Another H1");
      var $ = cheerio.load(p.readme);
      expect($("h1.superfluous").length).to.equal(1);
      expect($("h1.superfluous").text()).to.equal("fake");
      expect($("h1:not(.superfluous)").length).to.equal(1);
      expect($("h1:not(.superfluous)").text()).to.equal("Another H1");

      // removes shields.io badges from the README
      expect(p.readmeSrc).to.include("img.shields.io");
      expect($("p:has(img[src*='img.shields.io'])").hasClass("superfluous")).to.be.true;

      // removes nodei.co badges from the README
      expect(p.readmeSrc).to.include("nodei.co");
      expect($("p:has(img[src*='nodei.co'])").hasClass("superfluous")).to.be.true;

      // turns relative URLs into real URLs
      expect(p.readme).to.include('/blob/master');

      // includes the dependencies
      expect(p.dependencies).to.exist();

      // includes the dependents
      expect(p.dependents).to.exist();
      done();
    });
  });

  it('treats unpublished packages specially', function (done) {
    var options = {
      url: '/package/unpub'
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('registry/unpublished-package-page');
      expect(source.context.package.unpubFromNow).to.exist();
      done();
    });
  });
});

describe('readmes are always sanitized', function () {
  it('even if they are not on the top level', function (done) {
    var options = {
      url: '/package/no_top_level_readme'
    };

    server.inject(options, function (resp) {
      var source = resp.request.response.source;
      var p = source.context.package;
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

    server.inject(options, function (resp) {
      var source = resp.request.response.source;
      var p = source.context.package;
      expect(p.name).to.equal('benchmark');
      expect(p.readme).to.equal('');
      done();
    });
  });

  it('even if it causes marked to throw', function (done) {
    var options = {
      url: '/package/throw_marked'
    };

    server.inject(options, function (resp) {
      var source = resp.request.response.source;
      var p = source.context.package;
      expect(p.name).to.equal('benchmark');
      expect(p.readme).to.equal('');
      done();
    });
  });

  it('even if it is not markdown', function (done) {
    var options = {
      url: '/package/not_markdown'
    };

    server.inject(options, function (resp) {
      var source = resp.request.response.source;
      var p = source.context.package;
      expect(p.name).to.equal('benchmark');
      expect(p.readme).to.equal('<p></p><p>hello</p><p></p>\n');
      done();
    });
  });

  it('even if it is a non-markdown readme from a file', function (done) {
    var options = {
      url: '/package/not_markdown_readme_from_file'
    };

    server.inject(options, function (resp) {
      var source = resp.request.response.source;
      var p = source.context.package;
      expect(p.name).to.equal('benchmark');
      expect(p.readme).to.equal('<pre>&lt;p&gt;hello&lt;/p&gt;&lt;script&gt;console.log(&apos;boom&apos;)&lt;/script&gt;</pre>');
      done();
    });
  });

  it('even if it is a markdown readme from a file', function (done) {
    var options = {
      url: '/package/markdown_readme_from_file'
    };

    server.inject(options, function (resp) {
      var source = resp.request.response.source;
      var p = source.context.package;
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
      expect(source.context.package.isStarred).to.be.true;
      expect(resp.result).to.include('<input id="star-input" type="checkbox" name="isStarred" value="true" checked>');
      done();
    });
  });
});
