var USER_HOST = "https://user-api-example.com";

var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  it = lab.test,
  expect = Code.expect,
  nock = require("nock"),
  Collaborator = require("../../agents/collaborator"),
  fixtures = require("../fixtures.js");

var ralph = fixtures.collaborators.ralph_the_reader;

describe("Collaborator", function() {

  describe("list", function() {

    it("returns a collaborators object with usernames as keys", function(done) {
      var mock = nock(USER_HOST)
        .get('/package/foo/collaborators')
        .reply(200, fixtures.collaborators);

      Collaborator().list("foo", function(err, collaborators) {
        mock.done();
        expect(err).to.be.null();
        expect(collaborators.ralph_the_reader).to.be.an.object();
        expect(collaborators.wrigley_the_writer).to.be.an.object();
        done();
      });

    });

    it("decorates each collaborator with an avatar", function(done) {
      var mock = nock(USER_HOST)
        .get('/package/bajj/collaborators')
        .reply(200, fixtures.collaborators);

      Collaborator().list("bajj", function(err, collaborators) {
        mock.done();
        expect(err).to.be.null();
        expect(collaborators.ralph_the_reader.avatar.small).to.be.a.string();
        expect(collaborators.wrigley_the_writer.avatar.medium).to.be.a.string();
        done();
      });

    });

    it("calls back with an error if package is not found", function(done) {
      var mock = nock(USER_HOST)
        .get('/package/ghost/collaborators')
        .reply(404);

      Collaborator().list("ghost", function(err, collaborators) {
        mock.done();
        expect(err).to.be.an.object();
        expect(err.statusCode).to.equal(404);
        expect(err.message).to.include("error getting collaborators");
        expect(collaborators).to.not.exist();
        done();
      });

    });

  });

  describe("add", function() {

    it("adds a collaborator to the package", function(done) {
      var mock = nock(USER_HOST)
        .put('/package/skribble/collaborators', ralph)
        .reply(200, ralph);

      Collaborator().add("skribble", ralph, function(err, collaborator) {
        mock.done();
        expect(err).to.be.null();
        expect(collaborator.name).to.equal(ralph.name);
        done();
      });

    });

    it("calls back with an error if something goes wrong", function(done) {
      var mock = nock(USER_HOST)
        .put('/package/squawk/collaborators', ralph)
        .reply(404);

      Collaborator().add("squawk", ralph, function(err, collaborator) {
        mock.done();
        expect(err).to.be.an.object();
        expect(err.statusCode).to.equal(404);
        expect(err.message).to.include("error adding collaborator to package");
        expect(collaborator).to.not.exist();
        done();
      });

    });

  });

  describe("update", function() {

    it("updates a collaborator's access level on a package", function(done) {
      var mock = nock(USER_HOST)
        .post('/package/plunk/collaborators/ralph_the_reader', ralph)
        .reply(200, ralph);

      Collaborator().update("plunk", ralph, function(err, collaborator) {
        mock.done();
        expect(err).to.be.null();
        expect(collaborator.name).to.equal(ralph.name);
        done();
      });

    });

    it("calls back with an error if something goes wrong", function(done) {
      var mock = nock(USER_HOST)
        .post('/package/moomoo/collaborators/ralph_the_reader', ralph)
        .reply(404);

      Collaborator().update("moomoo", ralph, function(err, collaborator) {
        mock.done();
        expect(err).to.be.an.object();
        expect(err.statusCode).to.equal(404);
        expect(err.message).to.include("error updating collaborator");
        expect(collaborator).to.not.exist();
        done();
      });

    });

  });


  describe("del", function() {

    it("deletes a collaborator from a package", function(done) {
      var mock = nock(USER_HOST)
        .delete('/package/grizzle/collaborators/ralph_the_reader')
        .reply(200, ralph);

      Collaborator().del("grizzle", "ralph_the_reader", function(err, result) {
        mock.done();
        expect(err).to.be.null();
        expect(result.package).to.equal('grizzle');
        expect(result.deleted).to.equal(true);
        done();
      });

    });

    it("calls back with an error if something goes wrong", function(done) {
      var mock = nock(USER_HOST)
        .delete('/package/snarfblatt/collaborators/ralph_the_reader')
        .reply(404);

      Collaborator().del("snarfblatt", "ralph_the_reader", function(err, collaborator) {
        mock.done();
        expect(err).to.be.an.object();
        expect(err.statusCode).to.equal(404);
        expect(err.message).to.include("error removing collaborator");
        expect(collaborator).to.not.exist();
        done();
      });

    });

  });


});
