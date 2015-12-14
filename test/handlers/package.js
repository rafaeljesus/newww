var fixtures = require("../fixtures"),
  generateCrumb = require("../handlers/crumb.js"),
  nock = require("nock"),
  cheerio = require("cheerio"),
  URL = require('url'),
  Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  beforeEach = lab.beforeEach,
  afterEach = lab.afterEach,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  server;

describe("package handler", function() {

  before(function(done) {
    require('../mocks/server')(function(obj) {
      server = obj;
      done();
    }, require('../../lib/error-handler'));
  });

  after(function(done) {
    server.stop(done);
  });

  describe('global packages', function() {
    var $;
    var resp;
    var options = {
      url: '/package/browserify'
    };

    before(function(done) {
      var packageMock = nock("https://user-api-example.com")
        .get('/package/browserify')
        .reply(200, fixtures.packages.browserify)
        .get('/package?dependency=browserify&limit=50')
        .reply(200, fixtures.dependents);

      var downloadsMock = nock("https://downloads-api-example.com")
        .get('/point/last-day/browserify')
        .reply(200, fixtures.downloads.browserify.day)
        .get('/point/last-week/browserify')
        .reply(200, fixtures.downloads.browserify.week)
        .get('/point/last-month/browserify')
        .reply(200, fixtures.downloads.browserify.month);

      server.inject(options, function(response) {
        packageMock.done();
        downloadsMock.done();
        resp = response;
        $ = cheerio.load(resp.result);
        done();
      });
    });

    it('returns a 200 status code', function(done) {
      expect(resp.statusCode).to.equal(200);
      done();
    });

    it("adds package to the view context", function(done) {
      var source = resp.request.response.source;
      expect(source.context.package.name).to.equal('browserify');
      done();
    });

    it("renders the package template", function(done) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('package/show');
      done();
    });

    it('adds download data to the view context', function(done) {
      var downloads = resp.request.response.source.context.package.downloads;
      expect(downloads).to.be.an.object();
      expect(downloads).to.contain('day');
      expect(downloads).to.contain('week');
      expect(downloads).to.contain('month');
      done();
    });

    it('adds dependents to the view context', function(done) {
      var dependents = resp.request.response.source.context.package.dependents;
      expect(dependents).to.be.an.object();
      expect(dependents).to.contain('results');
      expect(dependents).to.contain('offset');
      expect(dependents).to.contain('hasMore');
      done();
    });

    it('renders download counts', function(done) {
      var downloads = resp.request.response.source.context.package.downloads;
      expect(downloads.day.downloads).to.be.above(0);
      expect(downloads.week.downloads).to.be.above(0);
      expect(downloads.month.downloads).to.be.above(0);
      expect($(".daily-downloads").text()).to.equal(String(downloads.day.downloads));
      expect($(".weekly-downloads").text()).to.equal(String(downloads.week.downloads));
      expect($(".monthly-downloads").text()).to.equal(String(downloads.month.downloads));
      done();
    });

    it('renders dependents', function(done) {
      expect($("p.dependents a").length).to.equal(51);
      done();
    });

    it('renders lastPublishedAt and sets data-date attribute', function(done) {
      var pkg = resp.request.response.source.context.package;
      expect(pkg.lastPublishedAt).to.exist();
      var el = $(".last-publisher span[data-date]");
      expect(el.text().trim()).to.equal(pkg.lastPublishedAt);
      expect(el.data().date).to.equal(pkg.lastPublishedAt);
      expect(el.data().dateFormat).to.equal("relative");
      done();
    });

    it('renders a list of collaborators', function(done) {
      var pkg = resp.request.response.source.context.package;
      expect(Object.keys(pkg.collaborators).length).to.equal(5);
      expect($("ul.collaborators > li").length).to.equal(5);
      expect($("ul.collaborators > li > a[href='/~substack']").length).to.equal(1);
      done();
    });

    it('renders a public label', function(done) {
      expect($('.package-name i').hasClass('icon-public')).to.be.true();
      done();
    });

  });

  describe('scoped private package viewed by paid collaborator', function() {
    var resp;
    var $;
    var options = {
      url: '/package/@wrigley_the_writer/scoped_private',
      credentials: fixtures.users.wrigley_the_writer
    };

    before(function(done) {
      var packageMock = nock("https://user-api-example.com")
        .get('/package/@wrigley_the_writer%2Fscoped_private')
        .reply(200, fixtures.packages.wrigley_scoped_private)
        .get('/package?dependency=%40wrigley_the_writer%2Fscoped_private&limit=50')
        .reply(200);

      var userMock = nock("https://user-api-example.com")
        .get('/user/wrigley_the_writer')
        .reply(200, fixtures.users.wrigley_the_writer);

      var licenseMock = nock("https://license-api-example.com")
        .get("/customer/wrigley_the_writer/stripe")
        .reply(404);

      var downloadsMock = nock("https://downloads-api-example.com")
        .get('/point/last-day/@wrigley_the_writer/scoped_private')
        .reply(404)
        .get('/point/last-week/@wrigley_the_writer/scoped_private')
        .reply(404)
        .get('/point/last-month/@wrigley_the_writer/scoped_private')
        .reply(404);

      server.inject(options, function(response) {
        packageMock.done();
        userMock.done();
        licenseMock.done();
        downloadsMock.done();
        resp = response;
        $ = cheerio.load(resp.result);
        done();
      });
    });

    it('renders a private label', function(done) {
      expect($('.package-name i').hasClass('icon-private')).to.be.true();
      done();
    });
  });

  describe('scoped private package viewed by unpaid collaborator', function() {
    var resp;
    var options = {
      url: '/package/@user/secrets'
    };

    before(function(done) {
      var packageMock = nock("https://user-api-example.com")
        .get('/package/@user%2Fsecrets')
        .reply(402)
        .get('/package?dependency=%40user%2Fsecrets&limit=50')
        .reply(200);

      var downloadsMock = nock("https://downloads-api-example.com")
        .get('/point/last-day/@user/secrets')
        .reply(404)
        .get('/point/last-week/@user/secrets')
        .reply(404)
        .get('/point/last-month/@user/secrets')
        .reply(404);

      server.inject(options, function(response) {
        packageMock.done();
        downloadsMock.done();
        resp = response;
        done();
      });
    });

    it('redirects to the billing page', function(done) {
      expect(resp.statusCode).to.equal(302);
      expect(URL.parse(resp.headers.location).pathname).to.equal("/settings/billing");
      done();
    });

    it('sets a `package` query param so a helpful message can be displayed', function(done) {
      expect(URL.parse(resp.headers.location, true).query.package).to.equal("@user/secrets");
      done();
    });

  });

  describe('nonexistent global packages with valid names', function() {
    var $;
    var resp;
    var context;
    var options = {
      url: '/package/nothingness'
    };

    before(function(done) {
      var packageMock = nock("https://user-api-example.com")
        .get('/package/nothingness')
        .reply(404)
        .get('/package?dependency=nothingness&limit=50')
        .reply(404);

      var downloadsMock = nock("https://downloads-api-example.com")
        .get('/point/last-day/nothingness')
        .reply(404)
        .get('/point/last-week/nothingness')
        .reply(404)
        .get('/point/last-month/nothingness')
        .reply(404);

      server.inject(options, function(response) {
        packageMock.done();
        downloadsMock.done();
        resp = response;
        $ = cheerio.load(resp.result);
        context = resp.request.response.source.context;
        done();
      });
    });

    it('returns a 404 status code', function(done) {
      expect(resp.statusCode).to.equal(404);
      done();
    });

    it('renders the package-not-found template', function(done) {
      expect(resp.request.response.source.template).to.equal('errors/package-not-found');
      done();
    });

    it('includes a nice message about the nonexistent package', function(done) {
      expect(context.package).to.exist();
      expect($("hgroup h2").text()).to.include("nothingness will be yours");
      done();
    });

    it("adds global package init instructions", function(done) {
      expect($("pre code").text()).to.include("mkdir nothingness");
      expect($("pre code").text()).to.include("npm init\n");
      done();
    });
  });

  describe('nonexistent scoped packages for anonymous users', function() {
    var $;
    var resp;
    var options = {
      url: '/package/@user/nope'
    };

    before(function(done) {
      var packageMock = nock("https://user-api-example.com")
        .get('/package/@user%2Fnope')
        .reply(404)
        .get('/package?dependency=%40user%2Fnope&limit=50')
        .reply(404);

      var downloadsMock = nock("https://downloads-api-example.com")
        .get('/point/last-day/@user/nope')
        .reply(404)
        .get('/point/last-week/@user/nope')
        .reply(404)
        .get('/point/last-month/@user/nope')
        .reply(404);

      server.inject(options, function(response) {
        packageMock.done();
        downloadsMock.done();
        resp = response;
        $ = cheerio.load(resp.result);
        done();
      });
    });

    it('renders the package-not-found template', function(done) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/package-not-found');
      done();
    });

    it('encourages user to try logging in for access', function(done) {
      expect($(".content h2").length).to.equal(1);
      expect($(".content h2").text()).to.include("try logging in");
      done();
    });
  });

  describe('nonexistent scoped packages for logged-in users', function() {
    var $;
    var resp;
    var context;
    var options = {
      url: '/package/@user/nope',
      credentials: fixtures.users.bob
    };

    before(function(done) {
      var packageMock = nock("https://user-api-example.com")
        .get('/package/@user%2Fnope')
        .reply(404)
        .get('/package?dependency=%40user%2Fnope&limit=50')
        .reply(404);

      var downloadsMock = nock("https://downloads-api-example.com")
        .get('/point/last-day/@user/nope')
        .reply(404)
        .get('/point/last-week/@user/nope')
        .reply(404)
        .get('/point/last-month/@user/nope')
        .reply(404);

      var userMock = nock("https://user-api-example.com")
        .get('/user/bob')
        .reply(200, fixtures.users.bob);

      var licenseMock = nock("https://license-api-example.com")
        .get('/customer/bob/stripe')
        .reply(404);

      server.inject(options, function(response) {
        packageMock.done();
        downloadsMock.done();
        userMock.done();
        licenseMock.done();
        resp = response;
        $ = cheerio.load(resp.result);
        context = resp.request.response.source.context;
        done();
      });
    });

    it('renders the package/not-found template', function(done) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/package-not-found');
      done();
    });

    it("tells user that package exist but they don't have access", function(done) {
      expect($(".content h2").length).to.equal(1);
      expect($(".content h2").text()).to.include("you may not have permission");
      done();
    });

  });

  describe('nonexistent scoped packages for user in same scope', function() {
    var $;
    var resp;
    var context;
    var options = {
      url: '/package/@bob/nope',
      credentials: fixtures.users.bob
    };

    before(function(done) {
      var packageMock = nock("https://user-api-example.com")
        .get('/package/@bob%2Fnope')
        .reply(404)
        .get('/package?dependency=%40bob%2Fnope&limit=50')
        .reply(404);

      var downloadsMock = nock("https://downloads-api-example.com")
        .get('/point/last-day/@bob/nope')
        .reply(404)
        .get('/point/last-week/@bob/nope')
        .reply(404)
        .get('/point/last-month/@bob/nope')
        .reply(404);

      var userMock = nock("https://user-api-example.com")
        .get('/user/bob')
        .reply(200, fixtures.users.bob);

      var licenseMock = nock("https://license-api-example.com")
        .get('/customer/bob/stripe')
        .reply(404);

      server.inject(options, function(response) {
        packageMock.done();
        downloadsMock.done();
        userMock.done();
        licenseMock.done();
        resp = response;
        $ = cheerio.load(resp.result);
        context = resp.request.response.source.context;
        done();
      });
    });

    it('renders the package-not-found template', function(done) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/package-not-found');
      done();
    });

    it("tells the user that package will be theirs", function(done) {
      expect($("hgroup h2").text()).to.include("@bob/nope will be yours");
      done();
    });

    it("adds scoped package init instructions", function(done) {
      expect($("pre code").text()).to.include("mkdir -p @bob/nope");
      expect($("pre code").text()).to.include("npm init --scope=@bob");
      done();
    });

  });

  describe('nonexistent global packages with invalid names', function() {
    var $;
    var resp;
    var context;
    var options = {
      url: '/package/_.escape'
    };

    before(function(done) {
      var packageMock = nock("https://user-api-example.com")
        .get('/package/_.escape')
        .reply(404)
        .get('/package?dependency=_.escape&limit=50')
        .reply(404);

      var downloadsMock = nock("https://downloads-api-example.com")
        .get('/point/last-day/_.escape')
        .reply(404)
        .get('/point/last-week/_.escape')
        .reply(404)
        .get('/point/last-month/_.escape')
        .reply(404);

      server.inject(options, function(response) {
        packageMock.done();
        downloadsMock.done();
        resp = response;
        $ = cheerio.load(resp.result);
        context = resp.request.response.source.context;
        done();
      });
    });

    it('returns a 400 status code', function(done) {
      expect(resp.statusCode).to.equal(400);
      done();
    });

    it('sets package.available to false', function(done) {
      expect(context.package.available).to.equal(false);
      expect(context.package.scope).to.equal(null);
      done();
    });

    it('renders the package-not-found template', function(done) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/package-not-found');
      done();
    });

  });

  describe("unpublished packages", function() {
    var resp;
    var options = {
      url: '/package/hitler'
    };

    before(function(done) {
      var packageMock = nock("https://user-api-example.com")
        .get('/package/hitler')
        .reply(200, fixtures.packages.hitler)
        .get('/package?dependency=hitler&limit=50')
        .reply(200);

      var downloadsMock = nock("https://downloads-api-example.com")
        .get('/point/last-day/hitler')
        .reply(404)
        .get('/point/last-week/hitler')
        .reply(404)
        .get('/point/last-month/hitler')
        .reply(404);

      server.inject(options, function(response) {
        packageMock.done();
        downloadsMock.done();
        resp = response;
        done();
      });
    });

    it("returns a 404 status code", function(done) {
      expect(resp.statusCode).to.equal(404);
      done();
    });

    it('renders the unpublished template', function(done) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('package/unpublished');
      done();
    });

  });

  describe('star', function() {
    it('is active if the user is logged in and has starred the package', function(done) {
      var options = {
        url: '/package/browserify',
        credentials: fixtures.users.bcoe
      };

      var packageMock = nock("https://user-api-example.com")
        .get('/package/browserify')
        .reply(200, fixtures.packages.browserify)
        .get('/package?dependency=browserify&limit=50')
        .reply(200, fixtures.dependents);

      var downloadsMock = nock("https://downloads-api-example.com")
        .get('/point/last-day/browserify')
        .reply(200, fixtures.downloads.browserify.day)
        .get('/point/last-week/browserify')
        .reply(200, fixtures.downloads.browserify.week)
        .get('/point/last-month/browserify')
        .reply(200, fixtures.downloads.browserify.month);

      var userMock = nock("https://user-api-example.com")
        .get('/user/bcoe')
        .reply(200, fixtures.users.bcoe);

      var licenseMock = nock("https://license-api-example.com")
        .get('/customer/bcoe/stripe')
        .reply(404);

      server.inject(options, function(resp) {
        packageMock.done();
        downloadsMock.done();
        userMock.done();
        licenseMock.done();
        expect(resp.statusCode).to.equal(200);
        var pkg = resp.request.response.source.context.package;
        expect(pkg.name).to.equal('browserify');
        expect(pkg.isStarred).to.be.true();
        expect(resp.result).to.include('<input id="star-input" type="checkbox" name="isStarred" value="true" checked>');
        done();
      });
    });
  });

  describe('add collaborator link', function() {
    it('is displayed if user is a collaborator', function(done) {
      var packageMock = nock("https://user-api-example.com")
        .get('/package/request')
        .reply(200, fixtures.packages.request)
        .get('/package?dependency=request&limit=50')
        .reply(200, fixtures.dependents);

      var downloadsMock = nock("https://downloads-api-example.com")
        .get('/point/last-day/request')
        .reply(200, fixtures.downloads.request.day)
        .get('/point/last-week/request')
        .reply(200, fixtures.downloads.request.week)
        .get('/point/last-month/request')
        .reply(200, fixtures.downloads.request.month);

      var userMock = nock("https://user-api-example.com")
        .get('/user/mikeal')
        .reply(200, fixtures.users.mikeal);

      var licenseMock = nock("https://license-api-example.com")
        .get('/customer/mikeal/stripe')
        .reply(404);

      var options = {
        url: '/package/request',
        credentials: fixtures.users.mikeal
      };

      server.inject(options, function(resp) {
        packageMock.done();
        downloadsMock.done();
        userMock.done();
        licenseMock.done();
        expect(resp.statusCode).to.equal(200);
        var pkg = resp.request.response.source.context.package;
        expect(pkg.name).to.equal('request');
        expect(pkg.isCollaboratedOnByUser).to.be.true();
        var $ = cheerio.load(resp.result);
        expect($("h3[title='collaborators'] a[href='/package/request/access']")).to.have.length(1);
        expect($("ul.collaborators a.add")).to.have.length(1);
        done();
      });

    });

    it('is not displayed if user is logged in but not a collaborator', function(done) {
      var packageMock = nock("https://user-api-example.com")
        .get('/package/request')
        .reply(200, fixtures.packages.request)
        .get('/package?dependency=request&limit=50')
        .reply(200, fixtures.dependents);

      var downloadsMock = nock("https://downloads-api-example.com")
        .get('/point/last-day/request')
        .reply(200, fixtures.downloads.request.day)
        .get('/point/last-week/request')
        .reply(200, fixtures.downloads.request.week)
        .get('/point/last-month/request')
        .reply(200, fixtures.downloads.request.month);

      var userMock = nock("https://user-api-example.com")
        .get('/user/bob')
        .reply(200, fixtures.users.bob);

      var licenseMock = nock("https://license-api-example.com")
        .get('/customer/bob/stripe')
        .reply(404);

      var options = {
        url: '/package/request',
        credentials: fixtures.users.bob
      };

      server.inject(options, function(resp) {
        packageMock.done();
        downloadsMock.done();
        userMock.done();
        licenseMock.done();
        expect(resp.statusCode).to.equal(200);
        var pkg = resp.request.response.source.context.package;
        expect(pkg.name).to.equal('request');
        expect(pkg.isCollaboratedOnByUser).to.equal(false);
        var $ = cheerio.load(resp.result);
        expect($("h3[title='collaborators'] a")).to.have.length(1);
        expect($("ul.collaborators a.add")).to.have.length(0);
        done();
      });
    });


    it('is not displayed if user is not logged in', function(done) {
      var packageMock = nock("https://user-api-example.com")
        .get('/package/request')
        .reply(200, fixtures.packages.request)
        .get('/package?dependency=request&limit=50')
        .reply(200, fixtures.dependents);

      var downloadsMock = nock("https://downloads-api-example.com")
        .get('/point/last-day/request')
        .reply(200, fixtures.downloads.request.day)
        .get('/point/last-week/request')
        .reply(200, fixtures.downloads.request.week)
        .get('/point/last-month/request')
        .reply(200, fixtures.downloads.request.month);

      var options = {
        url: '/package/request',
      };

      server.inject(options, function(resp) {
        packageMock.done();
        downloadsMock.done();
        expect(resp.statusCode).to.equal(200);
        var pkg = resp.request.response.source.context.package;
        expect(pkg.name).to.equal('request');
        expect(pkg.isCollaboratedOnByUser).to.equal(false);
        var $ = cheerio.load(resp.result);
        expect($("h3[title='collaborators'] a")).to.have.length(1);
        expect($("ul.collaborators a.add")).to.have.length(0);
        done();
      });
    });

  });


  describe('updating package access', function() {
    var options;

    beforeEach(function(done) {
      generateCrumb(server, function(crumb) {
        options = {
          method: "post",
          url: "/package/@wrigley_the_writer/scoped_public",
          credentials: fixtures.users.mikeal,
          payload: {
            crumb: crumb,
            package: {
              private: true
            }
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };
        done();
      });
    });

    it('calls back with a JSON object containing the updated package', function(done) {
      var packageMock = nock("https://user-api-example.com")
        .get('/package/request')
        .reply(200, fixtures.packages.request)
        .get('/package?dependency=request&limit=50')
        .reply(200, fixtures.dependents);

      var downloadsMock = nock("https://downloads-api-example.com")
        .get('/point/last-day/request')
        .reply(200, fixtures.downloads.request.day)
        .get('/point/last-week/request')
        .reply(200, fixtures.downloads.request.week)
        .get('/point/last-month/request')
        .reply(200, fixtures.downloads.request.month);

      var userMock = nock("https://user-api-example.com")
        .get('/user/mikeal')
        .reply(200, fixtures.users.mikeal);

      var licenseMock = nock("https://license-api-example.com")
        .get('/customer/mikeal/stripe')
        .reply(404);

      var options = {
        url: '/package/request',
        credentials: fixtures.users.mikeal
      };


      server.inject(options, function(resp) {
        packageMock.done();
        downloadsMock.done();
        userMock.done();
        licenseMock.done();
        expect(resp.statusCode).to.equal(200);
        done();
      });
    });

  });

  describe('error handling', function() {
    it('should handle unexpected error with error page', function(done) {
      var packageMock = nock('https://user-api-example.com')
        .get('/package/browserify')
        .reply(500)
        .get('/package?dependency=browserify&limit=50')
        .reply(200, fixtures.dependents);

      var downloadsMock = nock('https://downloads-api-example.com')
        .get('/point/last-day/browserify')
        .reply(200, fixtures.downloads.browserify.day)
        .get('/point/last-week/browserify')
        .reply(200, fixtures.downloads.browserify.week)
        .get('/point/last-month/browserify')
        .reply(200, fixtures.downloads.browserify.month);

      var options = {
        url: '/package/browserify'
      };

      server.inject(options, function(resp) {
        packageMock.done();
        downloadsMock.done();
        expect(resp.statusCode).to.equal(500);
        var source = resp.request.response.source;
        expect(source.template).to.equal('errors/internal');
        done();
      });
    });
  });
});
