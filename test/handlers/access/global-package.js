var fixtures = require("../../fixtures"),
    cheerio = require("cheerio"),
    Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect,
    server,
    mocks = require('../../helpers/mocks');

describe("package access", function(){

  before(function (done) {
    require('../../mocks/server')(function (obj) {
      server = obj;
      done();
    });
  });

  after(function (done) {
    server.stop(done);
  });

  describe('features.access_page disabled', function() {

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

    before(function (done) {
      done();
    });

    after(function (done) {
      done();
    });

    describe('anonymous user', function () {

      before(function(done) {
        process.env.FEATURE_ACCESS_PAGE = 'true';
        var packageMock = mocks.globalPackageWithCollaborators();

        server.inject(options, function(response) {
          packageMock.done();
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
        var userMock = mocks.loggedInPaidUser('bob');
        var packageMock = mocks.globalPackageWithCollaborators();
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
        process.env.FEATURE_ACCESS_PAGE = 'true';
        var userMock = mocks.loggedInPaidUser(fixtures.users.wrigley_the_writer);
        var packageMock = mocks.globalPackageWithCollaborators();

        server.inject(options, function(response) {
          userMock.done();
          packageMock.done();
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

});
