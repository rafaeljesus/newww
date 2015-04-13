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

var packageMock, downloadsMock, userMock;

describe("package handler", function(){

  before(function (done) {
    nock.cleanAll();
    packageMock = nock("https://user-api-example.com")
      .get('/package/browserify').twice()
      .reply(200, fixtures.packages.browserify)
      .get('/package?dependency=browserify&limit=50').twice()
      .reply(200, fixtures.dependents)
      .get('/package/nothingness')
      .reply(404)
      .get('/package/@zeke%2Fnope').twice()
      .reply(404)
      .get('/package/@bob%2Fnope')
      .reply(404)
      .get('/package/_.escape')
      .reply(404)
      .get('/package/hitler')
      .reply(200, fixtures.packages.hitler)
      .get('/package/request').times(4)
      .reply(200, fixtures.packages.request)
      .get('/package?dependency=request&limit=50').times(4)
      .reply(200, fixtures.dependents);

    downloadsMock = nock("https://downloads-api-example.com")
      .get('/point/last-day/browserify').twice()
      .reply(200, fixtures.downloads.browserify.day)
      .get('/point/last-week/browserify').twice()
      .reply(200, fixtures.downloads.browserify.week)
      .get('/point/last-month/browserify').twice()
      .reply(200, fixtures.downloads.browserify.month)
      .get('/point/last-day/request').twice()
      .reply(200, fixtures.downloads.request.day)
      .get('/point/last-week/request').twice()
      .reply(200, fixtures.downloads.request.week)
      .get('/point/last-month/request').twice()
      .reply(200, fixtures.downloads.request.month)
      .get('/point/last-day/request').twice()
      .reply(404)
      .get('/point/last-week/request').twice()
      .reply(404)
      .get('/point/last-month/request').twice()
      .reply(404);

    userMock = nock("https://user-api-example.com")
      .get('/user/bob').times(3)
      .reply(200, fixtures.users.bob)
      .get('/user/bcoe')
      .reply(200, fixtures.users.bcoe)
      .get('/user/mikeal').times(3)
      .reply(200, fixtures.users.mikeal);

    require('../mocks/server')(function (obj) {
      server = obj;
      done();
    });
  });

  after(function (done) {
    packageMock.done();
    downloadsMock.done();
    userMock.done();
    server.stop(done);
  });

  describe('global packages', function () {
    var $;
    var resp;
    var options = {url: '/package/browserify'};

    before(function(done){
      server.inject(options, function (response) {
        resp = response;
        $ = cheerio.load(resp.result);
        done();
      });
    });

    it('returns a 200 status code', function (done) {
      expect(resp.statusCode).to.equal(200);
      done();
    });

    it("adds package to the view context", function(done){
      var source = resp.request.response.source;
      expect(source.context.package.name).to.equal('browserify');
      done();
    });

    it("renders the package template", function(done){
      var source = resp.request.response.source;
      expect(source.template).to.equal('package/show');
      done();
    });

    it('adds download data to the view context', function (done) {
      var downloads = resp.request.response.source.context.package.downloads;
      expect(downloads).to.be.an.object();
      expect(downloads).to.contain('day');
      expect(downloads).to.contain('week');
      expect(downloads).to.contain('month');
      done();
    });

    it('adds dependents to the view context', function (done) {
      var dependents = resp.request.response.source.context.package.dependents;
      expect(dependents).to.be.an.object();
      expect(dependents).to.contain('results');
      expect(dependents).to.contain('offset');
      expect(dependents).to.contain('hasMore');
      done();
    });

    it('renders download counts', function (done) {
      var downloads = resp.request.response.source.context.package.downloads;
      expect(downloads.day.downloads).to.be.above(0);
      expect(downloads.week.downloads).to.be.above(0);
      expect(downloads.month.downloads).to.be.above(0);
      expect($(".daily-downloads").text()).to.equal(String(downloads.day.downloads));
      expect($(".weekly-downloads").text()).to.equal(String(downloads.week.downloads));
      expect($(".monthly-downloads").text()).to.equal(String(downloads.month.downloads));
      done();
    });

    it('renders dependents', function (done) {
      expect($("p.dependents a").length).to.equal(51);
      done();
    });

    it('renders lastPublishedAt and sets data-date attribute', function (done) {
      var package = resp.request.response.source.context.package;
      expect(package.lastPublishedAt).to.exist();
      var el = $(".last-publisher span[data-date]");
      expect(el.text().trim()).to.equal(package.lastPublishedAt);
      expect(el.data().date).to.equal(package.lastPublishedAt);
      expect(el.data().dateFormat).to.equal("relative");
      done();
    });

    it('renders a list of collaborators', function (done) {
      var package = resp.request.response.source.context.package;
      expect(Object.keys(package.collaborators).length).to.equal(5);
      expect($("ul.collaborators > li").length).to.equal(5);
      expect($("ul.collaborators > li > a[href='/~substack']").length).to.equal(1);
      done();
    });

  });

  describe('scoped private package viewed by unpaid collaborator', function () {
    var resp;
    var options = {url: '/package/@zeke/secrets'};

    before(function(done){
      var packageMock = nock("https://user-api-example.com")
        .get('/package/@zeke%2Fsecrets')
        .reply(402)

      server.inject(options, function (response) {
        packageMock.done()
        resp = response
        done();
      });
    });

    it('redirects to the billing page', function (done) {
      expect(resp.statusCode).to.equal(302);
      expect(URL.parse(resp.headers.location).pathname).to.equal("/settings/billing");
      done()
    });

    it('sets a `package` query param so a helpful message can be displayed', function (done) {
      expect(URL.parse(resp.headers.location, true).query.package).to.equal("@zeke/secrets");
      done()
    });

  });

  describe('nonexistent global packages with valid names', function () {
    var $;
    var resp;
    var context;
    var options = {url: '/package/nothingness'};

    before(function(done){
      server.inject(options, function (response) {
        resp = response;
        $ = cheerio.load(resp.result);
        context = resp.request.response.source.context;
        done();
      });
    });

    it('returns a 404 status code', function (done) {
      expect(resp.statusCode).to.equal(404);
      done();
    });

    it('renders the package-not-found template', function (done) {
      expect(resp.request.response.source.template).to.equal('errors/package-not-found');
      done();
    });

    it('includes a nice message about the nonexistent package', function (done) {
      expect(context.package).to.exist();
      expect($("hgroup h2").text()).to.include("nothingness will be yours");
      done();
    });

    it("adds global package init instructions", function (done) {
      expect($("pre code").text()).to.include("mkdir nothingness");
      expect($("pre code").text()).to.include("npm init\n");
      done();
    });
  });

  describe('nonexistent scoped packages for anonymous users', function () {
    var $;
    var resp;
    var options = {url: '/package/@zeke/nope'};

    before(function(done){
      server.inject(options, function (response) {
        resp = response;
        $ = cheerio.load(resp.result);
        done();
      });
    });

    it('renders the package-not-found template', function (done) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/package-not-found');
      done();
    });

    it('encourages user to try logging in for access', function (done) {
      expect($(".content h2").length).to.equal(1);
      expect($(".content h2").text()).to.include("try logging in");
      done();
    });
  });

  describe('nonexistent scoped packages for logged-in users', function () {
    var $;
    var resp;
    var context;
    var options = {
      url: '/package/@zeke/nope',
      credentials: fixtures.users.bob
    };

    before(function(done){
      server.inject(options, function (response) {
        resp = response;
        $ = cheerio.load(resp.result);
        context = resp.request.response.source.context;
        done();
      });
    });

    it('renders the package/not-found template', function (done) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/package-not-found');
      done();
    });

    it("tells user that package exist but they don't have access", function (done) {
      expect($(".content h2").length).to.equal(1);
      expect($(".content h2").text()).to.include("you may not have permission");
      done();
    });

  });

  describe('nonexistent scoped packages for user in same scope', function () {
    var $;
    var resp;
    var context;
    var options = {
      url: '/package/@bob/nope',
      credentials: fixtures.users.bob
    };

    before(function(done){
      server.inject(options, function (response) {
        resp = response;
        $ = cheerio.load(resp.result);
        context = resp.request.response.source.context;
        done();
      });
    });

    it('renders the package-not-found template', function (done) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/package-not-found');
      done();
    });

    it("tells the user that package will be theirs", function (done) {
      expect($("hgroup h2").text()).to.include("@bob/nope will be yours");
      done();
    });

    it("adds scoped package init instructions", function (done) {
      expect($("pre code").text()).to.include("mkdir -p @bob/nope");
      expect($("pre code").text()).to.include("npm init --scope=@bob");
      done();
    });

  });

  describe('nonexistent global packages with invalid names', function () {
    var $;
    var resp;
    var context;
    var options = {url: '/package/_.escape'};

    before(function(done){
      server.inject(options, function (response) {
        resp = response;
        $ = cheerio.load(resp.result);
        context = resp.request.response.source.context;
        done();
      });
    });

    it('returns a 400 status code', function (done) {
      expect(resp.statusCode).to.equal(400);
      done();
    });

    it('sets package.available to false', function (done) {
      expect(context.package.available).to.equal(false);
      expect(context.package.scope).to.equal(null);
      done();
    });

    it('renders the package-not-found template', function (done) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/package-not-found');
      done();
    });

  });

  describe("unpublished packages", function(){
    var resp;
    var options = {url: '/package/hitler'};

    before(function(done){
      server.inject(options, function (response) {
        resp = response;
        done();
      });
    });

    it("returns a 404 status code", function(done){
      expect(resp.statusCode).to.equal(404);
      done();
    });

    it('renders the unpublished template', function (done) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('package/unpublished');
      done();
    });

  });

  describe('star', function () {
    it('is active if the user is logged in and has starred the package', function (done) {
      var options = {
        url: '/package/browserify',
        credentials: fixtures.users.bcoe
      };

      server.inject(options, function (resp) {
        expect(resp.statusCode).to.equal(200);
        var package = resp.request.response.source.context.package;
        expect(package.name).to.equal('browserify');
        expect(package.isStarred).to.be.true();
        expect(resp.result).to.include('<input id="star-input" type="checkbox" name="isStarred" value="true" checked>');
        done();
      });
    });
  });

  describe('add collaborator link', function () {
    beforeEach(function(done){
      process.env.FEATURE_ACCESS_PAGE = 'true';
      done();
    });

    afterEach(function(done){
      delete process.env.FEATURE_ACCESS_PAGE;
      done();
    });

    it('is displayed if user is a collaborator', function (done) {
      var options = {
        url: '/package/request',
        credentials: fixtures.users.mikeal
      };

      server.inject(options, function (resp) {
        expect(resp.statusCode).to.equal(200);
        var package = resp.request.response.source.context.package;
        expect(package.name).to.equal('request');
        expect(package.isCollaboratedOnByUser).to.be.true();
        var $ = cheerio.load(resp.result);
        expect($("h3[title='collaborators'] a[href='/package/request/access']")).to.have.length(1);
        expect($("ul.collaborators a.add")).to.have.length(1);
        done();
      });

    });

    it('is not displayed if FEATURE_ACCESS_PAGE is not set', function (done) {
      var options = {
        url: '/package/request',
        credentials: fixtures.users.mikeal
      };

      delete process.env.FEATURE_ACCESS_PAGE;

      server.inject(options, function (resp) {
        expect(resp.statusCode).to.equal(200);
        var context = resp.request.response.source.context;
        var package = context.package;
        expect(package.name).to.equal('request');
        expect(package.isCollaboratedOnByUser).to.be.true();
        var $ = cheerio.load(resp.result);
        expect($("h3[title='collaborators'] a")).to.have.length(0);
        expect($("ul.collaborators a.add")).to.have.length(0);
        done();
      });
    });

    it('is not displayed if user is logged in but not a collaborator', function (done) {
      var options = {
        url: '/package/request',
        credentials: fixtures.users.bob
      };

      server.inject(options, function (resp) {
        expect(resp.statusCode).to.equal(200);
        var package = resp.request.response.source.context.package;
        expect(package.name).to.equal('request');
        expect(package.isCollaboratedOnByUser).to.equal(false);
        var $ = cheerio.load(resp.result);
        expect($("h3[title='collaborators'] a")).to.have.length(1);
        expect($("ul.collaborators a.add")).to.have.length(0);
        done();
      });
    });


    it('is not displayed if user is not logged in', function (done) {
      var options = {
        url: '/package/request',
      };

      server.inject(options, function (resp) {
        expect(resp.statusCode).to.equal(200);
        var package = resp.request.response.source.context.package;
        expect(package.name).to.equal('request');
        expect(package.isCollaboratedOnByUser).to.equal(false);
        var $ = cheerio.load(resp.result);
        expect($("h3[title='collaborators'] a")).to.have.length(1);
        expect($("ul.collaborators a.add")).to.have.length(0);
        done();
      });
    });

  });


  describe('updating package access', function () {
    var options;

    beforeEach(function(done){
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
          headers: {cookie: 'crumb='+crumb}
        };
        done();
      });
    });

    it('calls back with a JSON object containing the updated package', function (done) {
      var mock = nock("https://user-api-example.com")
        .post('/package/@wrigley_the_writer%2Fscoped_public', {private: true})
        .reply(200);

      server.inject(options, function (resp) {
        mock.done();
        expect(resp.statusCode).to.equal(200);
        done();
      });
    });

  });
});
