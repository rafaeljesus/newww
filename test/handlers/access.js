var fixtures = require("../fixtures"),
    nock = require("nock"),
    cheerio = require("cheerio"),
    URL = require('url'),
    Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect,
    server, userMock, licenseMock,
    users = require('../fixtures').users;

describe("package access", function(){

  before(function (done) {
    require('../mocks/server')(function (obj) {
      server = obj;
      done();
    });
  });

  after(function (done) {
    server.stop(done);
  });

  describe('features.feature_page disabled', function() {

    before(function(done){
      delete process.env.FEATURE_ACCESS_PAGE;
      done();
    });

    it("returns a 404 for global packages", function(done){
      server.inject({url: "/package/browserify/access"}, function(resp) {
        expect(resp.statusCode).to.equal(404);
        done();
      });
    });

    it("returns a 404 for scoped packages", function(done){
      server.inject({url: "/package/@wrigley_the_writer/scoped_public/access'"}, function(resp) {
        expect(resp.statusCode).to.equal(404);
        done();
      });
    });

  });

  describe('global package', function() {

    var $;
    var resp;
    var context;
    var options = {url: '/package/browserify/access'};
    var mock;

    before(function (done) {
      mock = nock("https://user-api-example.com")
        .get('/package/browserify')
        .times(3)
        .reply(200, fixtures.packages.browserify)
        .get('/package/browserify/collaborators')
        .times(3)
        .reply(200, fixtures.collaborators);

      done();
    });

    after(function (done) {
      mock.done();
      done();
    });

    describe('anonymous user', function () {

      before(function(done) {
        process.env.FEATURE_ACCESS_PAGE = 'true';
        server.inject(options, function(response) {
          resp = response;
          context = resp.request.response.source.context;
          $ = cheerio.load(resp.result);
          done();
        });
      });

      it("renders a please-log-in prompt", function(done) {
        expect($("p.notice.please-log-in").length).to.equal(1);
        done();
      });

      it("does not render a public/private toggle", function(done){
        expect($("#package-access-toggle").length).to.equal(0);
        done();
      });

      it("renders disabled read-only/read-write collaborator toggles", function(done){
        expect($("#collaborators > tbody > tr").length).to.equal(2);
        expect($("#collaborators").data('enablePermissionTogglers')).to.equal(false);
        done();
      });

      it("does not render new collaborator form", function(done){
        expect($("#add-collaborator").length).to.equal(0);
        done();
      });

      it("does not render collaborator removal links", function(done){
        expect($("#collaborators").data('enableDeletion')).to.equal(false);
        done();
      });

    });

    describe('logged-in non-collaborator', function () {
      var options = {
        url: '/package/browserify/access',
        credentials: fixtures.users.bob
      };

      before(function(done) {
        process.env.FEATURE_ACCESS_PAGE = 'true';

        userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, users.bob);

        licenseMock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe")
          .reply(200, {});

        server.inject(options, function(response) {
          userMock.done();
          licenseMock.done();
          resp = response;
          context = resp.request.response.source.context;
          $ = cheerio.load(resp.result);
          done();
        });
      });

      it("renders an ask-for-access prompt"); // aspirational

      it("does not render a public/private toggle", function(done){
        expect($("#package-access-toggle").length).to.equal(0);
        done();
      });

      it("renders disabled read-only/read-write collaborator toggles", function(done){
        expect($("#collaborators > tbody > tr").length).to.equal(2);
        expect($("#collaborators").data('enablePermissionTogglers')).to.equal(false);
        done();
      });

      it("does not render new collaborator form", function(done){
        expect($("#add-collaborator").length).to.equal(0);
        done();
      });

      it("does not render collaborator removal links", function(done){
        expect($("#collaborators").data('enableDeletion')).to.equal(false);
        done();
      });
    });

    describe('logged-in collaborator', function () {

      var options = {
        url: '/package/browserify/access',
        credentials: fixtures.users.wrigley_the_writer
      };

      before(function(done) {

        userMock = nock("https://user-api-example.com")
          .get("/user/wrigley_the_writer")
          .reply(200, users.wrigley_the_writer);

        licenseMock = nock("https://license-api-example.com")
          .get("/customer/wrigley_the_writer/stripe")
          .reply(200, {});

        process.env.FEATURE_ACCESS_PAGE = 'true';
        server.inject(options, function(response) {
          userMock.done();
          licenseMock.done();
          resp = response;
          context = resp.request.response.source.context;
          $ = cheerio.load(resp.result);
          done();
        });
      });

      it("does not render a public/private toggle", function(done){
        expect($("#package-access-toggle").length).to.equal(0);
        done();
      });

      it("renders disabled read-only/read-write collaborator toggles", function(done){
        expect($("tr.collaborator").length).to.equal(2);
        expect($("#collaborators").data('enablePermissionTogglers')).to.equal(false);
        done();
      });

      describe("new collaborator form", function() {

        it("is rendered", function(done){
          expect($("#add-collaborator").length).to.equal(1);
          done();
        });

        it("adds collaborator creation URL as form action", function(done){
          expect($("#add-collaborator").attr("action"))
            .to.equal("/package/browserify/collaborators");
          done();
        });

        it("makes collaborator name a required input", function(done){
          expect($("#add-collaborator input[name='collaborator.name'][required='required']").length)
            .to.equal(1);
          done();
        });

        it("defaults to `write` permissions when adding new collaborators", function(done){
          expect($("#add-collaborator input[name='collaborator.permissions'][type='hidden']").val())
            .to.equal("write");
          done();
        });
      });

      it("renders collaborator removal links with data attributes required by front-end", function(done){
        expect($("#collaborators").data('enableDeletion')).to.equal(true);
        expect($(".remove-collaborator[data-collaborator-name][data-package-url]").length).to.equal(2);
        done();
      });
    });

  });

  describe('scoped public package', function() {

    var $;
    var resp;
    var context;
    var options = {url: '/package/@wrigley_the_writer/scoped_public/access'};
    var mock = nock("https://user-api-example.com")
      .get('/package/@wrigley_the_writer%2Fscoped_public')
      .times(10)
      .reply(200, fixtures.packages.wrigley_scoped_public)
      .get('/package/@wrigley_the_writer%2Fscoped_public/collaborators')
      .times(10)
      .reply(200, fixtures.collaborators);

    describe('anonymous user', function () {

      before(function(done) {
        process.env.FEATURE_ACCESS_PAGE = 'true';
        server.inject(options, function(response) {
          resp = response;
          context = resp.request.response.source.context;
          $ = cheerio.load(resp.result);
          done();
        });
      });

      it("renders a please-log-in prompt", function(done) {
        expect($("p.notice.please-log-in").length).to.equal(1);
        done();
      });

      it("renders a disabled public/private toggle", function(done){
        expect($("#package-access-toggle:disabled").length).to.equal(1);
        done();
      });

      it("renders disabled read-only/read-write collaborator toggles", function(done){
        expect($("tr.collaborator").length).to.equal(2);
        expect($("#collaborators").data('enablePermissionTogglers')).to.equal(false);
        done();
      });

      it("does not render new collaborator form", function(done){
        expect($("#add-collaborator").length).to.equal(0);
        done();
      });

      it("does not render collaborator removal links", function(done){
        expect($("#collaborators").data('enableDeletion')).to.equal(false);
        done();
      });
    });

    describe('logged-in non-collaborator', function () {

      var options = {
        url: '/package/@wrigley_the_writer/scoped_public/access',
        credentials: fixtures.users.bob,
      };

      before(function(done) {
        process.env.FEATURE_ACCESS_PAGE = 'true';

        userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, users.bob);

        licenseMock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe")
          .reply(200, {});

        server.inject(options, function(response) {
          userMock.done();
          licenseMock.done();
          resp = response;
          context = resp.request.response.source.context;
          $ = cheerio.load(resp.result);
          done();
        });
      });

      it("renders an ask-for-access prompt"); // aspirational

      it("renders a disabled public/private toggle", function(done){
        expect($("#package-access-toggle:disabled").length).to.equal(1);
        done();
      });

      it("renders disabled read-only/read-write collaborator toggles", function(done){
        expect($("tr.collaborator").length).to.equal(2);
        expect($("#collaborators").data('enablePermissionTogglers')).to.equal(false);
        done();
      });

      it("does not render new collaborator form", function(done){
        expect($("#add-collaborator").length).to.equal(0);
        done();
      });

      it("does not render collaborator removal links", function(done){
        expect($("#collaborators").data('enableDeletion')).to.equal(false);
        done();
      });
    });

    describe('logged-in collaborator with read access', function () {

      var options = {
        url: '/package/@wrigley_the_writer/scoped_public/access',
        credentials: fixtures.users.ralph_the_reader,
      };

      before(function(done) {
        process.env.FEATURE_ACCESS_PAGE = 'true';

        userMock = nock("https://user-api-example.com")
          .get("/user/ralph_the_reader")
          .reply(200, users.ralph_the_reader);

        licenseMock = nock("https://license-api-example.com")
          .get("/customer/ralph_the_reader/stripe")
          .reply(200, {});

        server.inject(options, function(response) {
          userMock.done();
          licenseMock.done();
          resp = response;
          context = resp.request.response.source.context;
          $ = cheerio.load(resp.result);
          done();
        });
      });

      it("renders a disabled public/private toggle", function(done){
        expect($("#package-access-toggle:disabled").length).to.equal(1);
        done();
      });

      it("renders disabled read-only/read-write collaborator toggles", function(done){
        expect($("tr.collaborator").length).to.equal(2);
        done();
      });

      it("does not render new collaborator form", function(done){
        expect($("#add-collaborator").length).to.equal(0);
        done();
      });

      it("does not render collaborator removal links", function(done){
        expect($("#collaborators").data('enableDeletion')).to.equal(false);
        done();
      });
    });

    describe('logged-in paid collaborator with write access', function () {

      var options = {
        url: '/package/@wrigley_the_writer/scoped_public/access',
        credentials: fixtures.users.wrigley_the_writer,
      };

      before(function(done) {
        process.env.FEATURE_ACCESS_PAGE = 'true';

        userMock = nock("https://user-api-example.com")
          .get("/user/wrigley_the_writer")
          .reply(200, users.wrigley_the_writer);

        licenseMock = nock("https://license-api-example.com")
          .get("/customer/wrigley_the_writer/stripe").twice()
          .reply(200, fixtures.customers.happy);

        server.inject(options, function(response) {
          userMock.done();
          licenseMock.done();
          resp = response;
          context = resp.request.response.source.context;
          $ = cheerio.load(resp.result);
          done();
        });
      });

      it("renders an enabled public/private toggle", function(done){
        expect($("#package-access-toggle:enabled").length).to.equal(1);
        done();
      });

      it("renders disabled read-only/read-write collaborator toggles", function(done){
        expect($("tr.collaborator").length).to.equal(2);
        expect($("#collaborators").data('enablePermissionTogglers')).to.equal(false);
        done();
      });

      describe("new collaborator form", function() {

        it("is rendered", function(done){
          expect($("#add-collaborator").length).to.equal(1);
          done();
        });

        it("adds collaborator creation URL as form action", function(done){
          expect($("#add-collaborator").attr("action"))
            .to.equal("/package/@wrigley_the_writer/scoped_public/collaborators");
          done();
        });

        it("makes collaborator name a required input", function(done){
          expect($("#add-collaborator input[name='collaborator.name'][required='required']").length)
            .to.equal(1);
          done();
        });

        it("defaults to `write` permissions when adding new collaborators", function(done){
          expect($("#add-collaborator input[name='collaborator.permissions'][type='hidden']").val())
            .to.equal("write");
          done();
        });
      });

      it("renders collaborator removal links", function(done){
        expect($("#collaborators").data('enableDeletion')).to.equal(true);
        done();
      });
    });

    describe('logged-in unpaid collaborator with write access', function () {

      var options = {
        url: '/package/@wrigley_the_writer/scoped_public/access',
        credentials: fixtures.users.wrigley_the_writer,
      };

      before(function(done) {
        process.env.FEATURE_ACCESS_PAGE = 'true';

        userMock = nock("https://user-api-example.com")
          .get("/user/wrigley_the_writer")
          .reply(200, fixtures.users.wrigley_the_writer);

        licenseMock = nock("https://license-api-example.com")
          .get("/customer/wrigley_the_writer/stripe").twice()
          .reply(404);

        server.inject(options, function(response) {
          userMock.done();
          licenseMock.done();
          $ = cheerio.load(response.result);
          done();
        });
      });

      after(function(done) {
        delete process.env.FEATURE_ACCESS_PAGE;
        done();
      });

      it("does not render the public/private toggle", function(done){
        expect($("#package-access-toggle").length).to.equal(0);
        done();
      });

      it("renders a pay-to-restrict-access prompt", function(done) {
        expect($("p.notice.pay-to-restrict-access").length).to.equal(1);
        done();
      });
    });

  });

  describe('scoped private package', function() {

    var $;
    var resp;
    var context;
    var options = {
      url: '/package/@wrigley_the_writer/scoped_private/access'
    };

    describe('anonymous user', function () {

      before(function(done) {
        process.env.FEATURE_ACCESS_PAGE = 'true';

        var packageMock = nock("https://user-api-example.com")
          .get('/package/@wrigley_the_writer%2Fscoped_private')
          .reply(200, fixtures.packages.wrigley_scoped_private)
          .get('/package/@wrigley_the_writer%2Fscoped_private/collaborators')
          .reply(200, fixtures.collaborators);

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
        process.env.FEATURE_ACCESS_PAGE = 'true';

        var userMock = nock("https://user-api-example.com")
          .get('/user/bob')
          .reply(200, fixtures.users.bob);

        var packageMock = nock("https://user-api-example.com")
          .get('/package/@wrigley_the_writer%2Fscoped_private')
          .reply(200, fixtures.packages.wrigley_scoped_private)
          .get('/package/@wrigley_the_writer%2Fscoped_private/collaborators')
          .reply(200, fixtures.collaborators);

        var customerMock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe")
          .reply(200, {});

        server.inject(options, function(response) {
          userMock.done();
          packageMock.done();
          customerMock.done();
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

        var userMock = nock("https://user-api-example.com")
          .get('/user/ralph_the_reader')
          .reply(200, fixtures.users.ralph_the_reader);

        var packageMock = nock("https://user-api-example.com")
          .get('/package/@wrigley_the_writer%2Fscoped_private')
          .reply(200, fixtures.packages.wrigley_scoped_private)
          .get('/package/@wrigley_the_writer%2Fscoped_private/collaborators')
          .reply(200, fixtures.collaborators);

        var customerMock = nock("https://license-api-example.com")
          .get("/customer/ralph_the_reader/stripe")
          .reply(200, {});

        server.inject(options, function(response) {
          userMock.done();
          packageMock.done();
          customerMock.done();
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

        var userMock = nock("https://user-api-example.com")
          .get('/user/wrigley_the_writer')
          .reply(200, fixtures.users.wrigley_the_writer);

        var packageMock = nock("https://user-api-example.com")
          .get('/package/@wrigley_the_writer%2Fscoped_private')
          .reply(200, fixtures.packages.wrigley_scoped_private)
          .get('/package/@wrigley_the_writer%2Fscoped_private/collaborators')
          .reply(200, fixtures.collaborators);

        var customerMock = nock("https://license-api-example.com")
          .get("/customer/wrigley_the_writer/stripe")
          .reply(200, {});

        server.inject(options, function(response) {
          userMock.done();
          packageMock.done();
          customerMock.done();
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

        var userMock = nock("https://user-api-example.com")
          .get('/user/wrigley_the_writer')
          .reply(200, fixtures.users.wrigley_the_writer);

        var packageMock = nock("https://user-api-example.com")
          .get('/package/@wrigley_the_writer%2Fscoped_private')
          .reply(402);

        var customerMock = nock("https://license-api-example.com")
          .get("/customer/wrigley_the_writer/stripe")
          .reply(200, {});

        server.inject(options, function(response) {
          userMock.done();
          packageMock.done();
          customerMock.done();
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

});
