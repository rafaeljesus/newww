var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    it = lab.test,
    expect = Code.expect,
    nock = require("nock"),
    _ = require('lodash'),
    Collaborator,
    fixtures = require("../fixtures.js");

var ralph = fixtures.collaborators.ralph_the_reader;

beforeEach(function (done) {
  Collaborator = new (require("../../models/collaborator"))({
    host: "https://collaborator.com"
  });
  done();
});

afterEach(function (done) {
  Collaborator = null;
  done();
});

describe("Collaborator", function(){

  describe("initialization", function() {

    it("accepts a custom host", function(done) {
      expect(Collaborator.host).to.equal('https://collaborator.com');
      done();
    });
  });

  describe("list", function () {

    it("returns a collaborators object with usernames as keys", function (done) {
      var mock = nock(Collaborator.host)
        .get('/package/foo/collaborators')
        .reply(200, fixtures.collaborators);

      Collaborator.list("foo", function (err, collaborators) {
        mock.done();
        expect(err).to.be.null();
        expect(collaborators).to.exist();
        expect(collaborators).to.deep.equal(fixtures.collaborators);
        done();
      });

    });

    it("calls back with an error if package is not found", function (done) {
      var mock = nock(Collaborator.host)
        .get('/package/ghost/collaborators')
        .reply(404);

      Collaborator.list("ghost", function (err, collaborators) {
        mock.done();
        expect(err).to.be.an.object();
        expect(err.statusCode).to.equal(404);
        expect(err.message).to.equal("error getting collaborators for package: ghost");
        expect(collaborators).to.not.exist();
        done();
      });

    });

  });

  describe("add", function () {

    it("adds a collaborator to the package", function (done) {
      var mock = nock(Collaborator.host)
        .put('/package/skribble/collaborators', ralph)
        .reply(200, ralph);

      Collaborator.add("skribble", ralph, function (err, collaborator) {
        mock.done();
        expect(err).to.be.null();
        expect(collaborator).to.deep.equal(ralph);
        done();
      });

    });

    it("calls back with an error if something goes wrong", function (done) {
      var mock = nock(Collaborator.host)
        .put('/package/squawk/collaborators', ralph)
        .reply(404);

      Collaborator.add("squawk", ralph, function (err, collaborator) {
        mock.done();
        expect(err).to.be.an.object();
        expect(err.statusCode).to.equal(404);
        expect(err.message).to.equal("error adding collaborator to package: squawk");
        expect(collaborator).to.not.exist();
        done();
      });

    });

  });

  describe("update", function () {

    it("updates a collaborator's access level on a package", function (done) {
      var mock = nock(Collaborator.host)
        .post('/package/plunk/collaborators/ralph_the_reader', ralph)
        .reply(200, ralph);

      Collaborator.update("plunk", ralph, function (err, collaborator) {
        mock.done();
        expect(err).to.be.null();
        expect(collaborator).to.deep.equal(ralph);
        done();
      });

    });

    it("calls back with an error if something goes wrong", function (done) {
      var mock = nock(Collaborator.host)
        .post('/package/moomoo/collaborators/ralph_the_reader', ralph)
        .reply(404);

      Collaborator.update("moomoo", ralph, function (err, collaborator) {
        mock.done();
        expect(err).to.be.an.object();
        expect(err.statusCode).to.equal(404);
        expect(err.message).to.equal("error updating collaborator access to package: moomoo");
        expect(collaborator).to.not.exist();
        done();
      });

    });

  });


  describe("del", function () {

    it("deletes a collaborator from a package", function (done) {
      var mock = nock(Collaborator.host)
        .delete('/package/grizzle/collaborators/ralph_the_reader')
        .reply(200, ralph);

      Collaborator.del("grizzle", ralph, function (err, collaborator) {
        mock.done();
        expect(err).to.be.null();
        expect(collaborator).to.deep.equal(ralph);
        done();
      });

    });

    it("calls back with an error if something goes wrong", function (done) {
      var mock = nock(Collaborator.host)
        .delete('/package/snarfblatt/collaborators/ralph_the_reader')
        .reply(404);

      Collaborator.del("snarfblatt", ralph, function (err, collaborator) {
        mock.done();
        expect(err).to.be.an.object();
        expect(err.statusCode).to.equal(404);
        expect(err.message).to.equal("error removing collaborator from package: snarfblatt");
        expect(collaborator).to.not.exist();
        done();
      });

    });

  });


});
