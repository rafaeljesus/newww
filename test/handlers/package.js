var fixtures = require("../fixtures"),
    nock = require("nock"),
    cheerio = require("cheerio"),
    Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    it = lab.test,
    expect = Code.expect,
    server,
    cookieCrumb;

describe("package handler", function(){

  before(function (done) {
    require('../mocks/server')(function (obj) {
      server = obj;
      done();
    });
  });

  after(function (done) {
    server.stop(done);
  });

  describe('normal package', function () {
    var resp;
    var options = {url: '/package/browserify'};
    var packageMock = nock("https://user-api-example.com")
      .get('/package/browserify')
      .reply(200, fixtures.packages.browserify);
    var downloadsMock = nock("https://downloads-api-example.com")
      .get('/point/last-day/browserify')
      .reply(200, fixtures.downloads.browserify['last-day'])
      .get('/point/last-week/browserify')
      .reply(200, fixtures.downloads.browserify['last-week'])
      .get('/point/last-month/browserify')
      .reply(200, fixtures.downloads.browserify['last-month']);

    before(function(done){
      server.inject(options, function (response) {
        resp = response
        packageMock.done()
        downloadsMock.done()
        done()
      })
    })

    it('returns a 200 status code', function (done) {
      expect(resp.statusCode).to.equal(200);
      done()
    })

    it("adds package to the view context", function(done){
      var source = resp.request.response.source;
      expect(source.context.package.name).to.equal('browserify');
      done()
    })

    it('adds download data to the view context', function (done) {
      var package = resp.request.response.source.context.package;
      expect(package.downloads).to.be.an.object();
      expect(package.downloads).to.contain('last-day');
      expect(package.downloads).to.contain('last-week');
      expect(package.downloads).to.contain('last-month');
      done();
    });

    it("renders the package template", function(done){
      var source = resp.request.response.source;
      expect(source.template).to.equal('package/show');
      done();
    });

  });

  describe('nonexistent packages with valid names', function () {
    var resp
    var options = {url: '/package/nothingness'}
    var packageMock = nock("https://user-api-example.com")
      .get('/package/nothingness')
      .reply(404);

    before(function(done){
      server.inject(options, function (response) {
        resp = response
        packageMock.done()
        done()
      })
    })

    it('returns a 404 status code', function (done) {
      expect(resp.statusCode).to.equal(404);
      done()
    })

    it('renders the not-found template', function (done) {
      expect(resp.request.response.source.template).to.equal('errors/not-found')
      done()
    })


    it('includes a nice message about the nonexistent package', function (done) {
      expect(resp.request.response.source.context.package).to.exist()
      expect(resp.result).to.include("nothingness will be yours")
      done()
    })
  })

  describe('nonexistent packages with invalid names', function () {
    var resp
    var options = {url: '/package/_.escape'}
    var packageMock = nock("https://user-api-example.com")
      .get('/package/_.escape')
      .reply(404)

    before(function(done){
      server.inject(options, function (response) {
        resp = response
        packageMock.done()
        done()
      })
    })

    it('returns a 400 status code', function (done) {
      expect(resp.statusCode).to.equal(400);
      done();
    });

    it('does NOT add package.name to view context', function (done) {
      var source = resp.request.response.source
      expect(source.context.package).to.not.exist()
      expect(resp.result).to.not.include("will be yours")
      done()
    })

    it('renders the not-found template', function (done) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/not-found')
      done()
    })

  });

  describe("unpublished packages", function(){
    var resp
    var options = {url: '/package/hitler'}
    var packageMock = nock("https://user-api-example.com")
      .get('/package/hitler')
      .reply(200, fixtures.packages.hitler)

    before(function(done){
      server.inject(options, function (response) {
        resp = response
        packageMock.done()
        done()
      })
    })

    it("returns a 404 status code", function(done){
      expect(resp.statusCode).to.equal(404);
      done()
    })

    it('renders the unpublished template', function (done) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('package/unpublished');
      done();
    });

  })

  describe('star', function () {
    it('is active if the user is logged in and has starred the package', function (done) {
      var options = {
        url: '/package/browserify',
        credentials: fixtures.users.fakeuser
      };

      var packageMock = nock("https://user-api-example.com")
        .get('/package/browserify')
        .reply(200, fixtures.packages.browserify);

      var downloadsMock = nock("https://downloads-api-example.com")
        .get('/point/last-day/browserify')
        .reply(200, fixtures.downloads.browserify['last-day'])
        .get('/point/last-week/browserify')
        .reply(200, fixtures.downloads.browserify['last-week'])
        .get('/point/last-month/browserify')
        .reply(200, fixtures.downloads.browserify['last-month']);

      server.inject(options, function (resp) {
        packageMock.done()
        downloadsMock.done()
        // console.log(resp)
        expect(resp.statusCode).to.equal(200);
        var package = resp.request.response.source.context.package;
        expect(package.name).to.equal('browserify');
        expect(package.isStarred).to.be.true();
        expect(resp.result).to.include('<input id="star-input" type="checkbox" name="isStarred" value="true" checked>');
        done();
      });
    });
  });

  describe('package nav', function () {
    var packageMock
    var downloadsMock

    beforeEach(function(done){
      packageMock = nock("https://user-api-example.com")
        .get('/package/request')
        .reply(200, fixtures.packages.request);

      downloadsMock = nock("https://downloads-api-example.com")
        .get('/point/last-day/request')
        .reply(200, fixtures.downloads.request['last-day'])
        .get('/point/last-week/request')
        .reply(200, fixtures.downloads.request['last-week'])
        .get('/point/last-month/request')
        .reply(200, fixtures.downloads.request['last-month']);
      done()
    })

    it('is displayed if user is a collaborator', function (done) {
      var options = {
        url: '/package/request',
        credentials: fixtures.users.mikeal
      };

      server.inject(options, function (resp) {
        packageMock.done()
        downloadsMock.done()
        expect(resp.statusCode).to.equal(200);
        var package = resp.request.response.source.context.package;
        expect(package.name).to.equal('request');
        expect(package.isCollaboratedOnByUser).to.be.true();
        var $ = cheerio.load(resp.result)
        expect($(".secondary-nav")).to.have.length(1);
        done();
      });

    });

    it('is not displayed if user is logged in but not a collaborator', function (done) {
      var options = {
        url: '/package/request',
        credentials: fixtures.users.fakeuser
      };

      server.inject(options, function (resp) {
        packageMock.done()
        downloadsMock.done()
        expect(resp.statusCode).to.equal(200);
        var package = resp.request.response.source.context.package;
        expect(package.name).to.equal('request');
        expect(package.isCollaboratedOnByUser).to.equal(false);
        var $ = cheerio.load(resp.result)
        expect($(".secondary-nav")).to.have.length(0);
        done();
      });
    });


    it('is not displayed if user is not logged in', function (done) {
      var options = {
        url: '/package/request',
      };

      server.inject(options, function (resp) {
        packageMock.done()
        downloadsMock.done()
        expect(resp.statusCode).to.equal(200);
        var package = resp.request.response.source.context.package;
        expect(package.name).to.equal('request');
        expect(package.isCollaboratedOnByUser).to.equal(false);
        var $ = cheerio.load(resp.result)
        expect($(".secondary-nav")).to.have.length(0);
        done();
      });
    });


  });
})
