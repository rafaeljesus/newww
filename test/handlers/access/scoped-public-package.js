var fixtures = require("../../fixtures"),
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
    server,
    mocks = require('../../helpers/mocks');


describe("scoped public package", function(){

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
  var options = {url: '/package/@wrigley_the_writer/scoped_public/access'};

  describe('anonymous user', function () {

    before(function(done) {
      process.env.FEATURE_ACCESS_PAGE = 'true';
      var packageMock = mocks.scopedPublicPackageWithCollaborators();

      server.inject(options, function(response) {
        resp = response;
        packageMock.done();
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
      var userMock = mocks.loggedInPaidUser('bob');
      var packageMock = mocks.scopedPublicPackageWithCollaborators();

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
      var userMock = mocks.loggedInPaidUser(fixtures.users.ralph_the_reader);
      var packageMock = mocks.scopedPublicPackageWithCollaborators();
      // var customerMock = mocks.happyCustomer('ralph_the_reader');

      server.inject(options, function(response) {
        userMock.done();
        packageMock.done();
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
      var userMock = mocks.loggedInPaidUser(fixtures.users.wrigley_the_writer);
      var packageMock = mocks.scopedPublicPackageWithCollaborators();
      var customerMock = mocks.happyCustomer('wrigley_the_writer');

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
      var userMock = mocks.loggedInPaidUser(fixtures.users.wrigley_the_writer);
      var packageMock = mocks.scopedPublicPackageWithCollaborators();

      server.inject(options, function(response) {
        userMock.done();
        packageMock.done();
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
