var fixtures = require("../../fixtures"),
    nock = require("nock"),
    cheerio = require("cheerio"),
    URL = require('url'),
    expect = require('code').expect,
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,

    server,
    mocks = require('../../helpers/mocks');

describe('scoped private package', function() {

  before(function (done) {
    require('../../mocks/server')(function (obj) {
      server = obj;
      done();
    });
  });

  after(function (done) {
    server.stop(done);
  });

  var $;
  var resp;
  var context;
  var options = {
    url: '/package/@wrigley_the_writer/scoped_private/access'
  };

  describe('anonymous user', function () {

    before(function(done) {
      process.env.FEATURE_ACCESS_PAGE = 'true';
      var packageMock = mocks.scopedPrivatePackageWithCollaborators();

      server.inject(options, function(response) {
        packageMock.done();
        resp = response;
        context = resp.request.response.source.context;
        $ = cheerio.load(resp.result);
        done();
      });
    });

    it("returns a 404", function(done){
      expect(resp.statusCode).to.equal(404);
      done();
    });

    it("renders the generic not-found template", function(done){
      expect(resp.request.response.source.template).to.equal('errors/not-found');
      done();
    });
  });

  describe('logged-in non-collaborator', function () {
    var options = {
      url: '/package/@wrigley_the_writer/scoped_private/access',
      credentials: fixtures.users.bob,
    };

    before(function(done) {
      var userMock = mocks.loggedInUnpaidUser('bob');
      var packageMock = mocks.scopedPrivatePackageWithCollaborators();

      process.env.FEATURE_ACCESS_PAGE = 'true';
      server.inject(options, function(response) {
        userMock.done();
        packageMock.done();
        resp = response;
        context = resp.request.response.source.context;
        $ = cheerio.load(resp.result);
        done();
      });
    });

    it("returns a 404", function(done){
      expect(resp.statusCode).to.equal(404);
      done();
    });

    it("renders the generic not-found template", function(done){
      expect(resp.request.response.source.template).to.equal('errors/not-found');
      done();
    });
  });

  describe('logged-in collaborator with read access', function () {
    var options = {
      url: '/package/@wrigley_the_writer/scoped_private/access',
      credentials: fixtures.users.ralph_the_reader,
    };

    before(function(done) {
      process.env.FEATURE_ACCESS_PAGE = 'true';
      var userMock = mocks.loggedInPaidUser(fixtures.users.ralph_the_reader);
      var packageMock = mocks.scopedPrivatePackageWithCollaborators();

      server.inject(options, function(response) {
        userMock.done();
        packageMock.done();
        resp = response;
        context = resp.request.response.source.context;
        $ = cheerio.load(resp.result);
        done();
      });
    });

    it("returns a 200", function(done){
      expect(resp.statusCode).to.equal(200);
      done();
    });
  });

  describe('logged-in paid collaborator with write access', function () {

    var options = {
      url: '/package/@wrigley_the_writer/scoped_private/access',
      credentials: fixtures.users.wrigley_the_writer,
    };

    before(function(done) {
      process.env.FEATURE_ACCESS_PAGE = 'true';
      var userMock = mocks.loggedInPaidUser(fixtures.users.wrigley_the_writer);
      var packageMock = mocks.scopedPrivatePackageWithCollaborators();

      server.inject(options, function(response) {
        userMock.done();
        packageMock.done();
        resp = response;
        context = resp.request.response.source.context;
        $ = cheerio.load(resp.result);
        done();
      });
    });

    it("returns a 200", function(done){
      expect(resp.statusCode).to.equal(200);
      done();
    });

    it("defaults to `read` permissions when adding new collaborators", function(done){
      expect($("#add-collaborator input[name='collaborator.permissions'][type='hidden']").val())
        .to.equal("read");
      done();
    });
  });

  describe('logged-in unpaid collaborator', function () {

    var resp;
    var options = {
      url: '/package/@wrigley_the_writer/scoped_private/access',
      credentials: fixtures.users.wrigley_the_writer,
    };

    before(function(done) {
      process.env.FEATURE_ACCESS_PAGE = 'true';
      var userMock = mocks.loggedInPaidUser(fixtures.users.wrigley_the_writer);
      var packageMock = nock("https://user-api-example.com")
        .get('/package/@wrigley_the_writer%2Fscoped_private')
        .reply(402);

      server.inject(options, function(response) {
        userMock.done();
        packageMock.done();
        resp = response;
        delete process.env.FEATURE_ACCESS_PAGE;
        done();
      });
    });

    it('redirects to the billing page', function (done) {
      expect(resp.statusCode).to.equal(302);
      expect(URL.parse(resp.headers.location).pathname).to.equal("/settings/billing");
      done();
    });

    it('sets a `package` query param so a helpful message can be displayed', function (done) {
      expect(URL.parse(resp.headers.location, true).query.package).to.equal("@wrigley_the_writer/scoped_private");
      done();
    });

  });


});
