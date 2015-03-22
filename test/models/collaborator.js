"use strict"

const expect   = require('code').expect
const nock     = require("nock")
const _        = require('lodash')
const fixtures = require("../fixtures.js")
const ralph    = fixtures.collaborators.ralph_the_reader

var Collaborator

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

      Collaborator.list("foo")
        .then(function(collaborators) {
          mock.done();
          expect(collaborators.ralph_the_reader).to.be.an.object();
          expect(collaborators.wrigley_the_writer).to.be.an.object();
          done();
        })
        .catch(function(err){
          console.error(err)
        })

    });

    it("decorates each collaborator with an avatar", function (done) {
      var mock = nock(Collaborator.host)
        .get('/package/bajj/collaborators')
        .reply(200, fixtures.collaborators);

      Collaborator.list("bajj")
      .then(function(collaborators) {
        mock.done();
        expect(collaborators.ralph_the_reader.avatar.small).to.be.a.string();
        expect(collaborators.wrigley_the_writer.avatar.medium).to.be.a.string();
        done();
      });

    });

    it("calls back with an error if package is not found", function (done) {
      var mock = nock(Collaborator.host)
        .get('/package/ghost/collaborators')
        .reply(404);

      Collaborator.list("ghost")
        .catch(function(err) {
          mock.done();
          expect(err).to.be.an.object();
          expect(err.statusCode).to.equal(404);
          done();
        })

    });

  });

  describe("add", function () {

    it("adds a collaborator to the package", function (done) {
      var mock = nock(Collaborator.host)
        .put('/package/skribble/collaborators', ralph)
        .reply(200, ralph);

      Collaborator.add("skribble", ralph).
        then(function(collaborator) {
          mock.done();
          expect(collaborator.name).to.equal(ralph.name);
          done();
        });

    });

    it("calls back with an error if something goes wrong", function (done) {
      var mock = nock(Collaborator.host)
        .put('/package/squawk/collaborators', ralph)
        .reply(404);

      Collaborator.add("squawk", ralph)
        .catch(function(err) {
          mock.done();
          expect(err).to.be.an.object();
          expect(err.statusCode).to.equal(404);
          // expect(err.message).to.include("error adding collaborator to package");
          done();
        });

    });

  });

  describe("update", function () {

    it("updates a collaborator's access level on a package", function (done) {
      var mock = nock(Collaborator.host)
        .post('/package/plunk/collaborators/ralph_the_reader', ralph)
        .reply(200, ralph);

      Collaborator.update("plunk", ralph)
        .then(function(collaborator) {
          mock.done();
          expect(collaborator.name).to.equal(ralph.name);
          done();
        });

    });

    it("calls back with an error if something goes wrong", function (done) {
      var mock = nock(Collaborator.host)
        .post('/package/moomoo/collaborators/ralph_the_reader', ralph)
        .reply(404);

      Collaborator.update("moomoo", ralph)
        .catch(function(err) {
          mock.done();
          expect(err).to.be.an.object();
          expect(err.statusCode).to.equal(404);
          // expect(err.message).to.include("error updating collaborator");
          done();
        });

    });

  });

  describe("del", function () {

    it("deletes a collaborator from a package", function (done) {
      var mock = nock(Collaborator.host)
        .delete('/package/grizzle/collaborators/ralph_the_reader')
        .reply(200, ralph);

      Collaborator.del("grizzle", "ralph_the_reader")
        .then(function(collaborator) {
          mock.done();
          expect(collaborator.name).to.equal(ralph.name);
          done();
        });

    });

    it("calls back with an error if something goes wrong", function (done) {
      var mock = nock(Collaborator.host)
        .delete('/package/snarfblatt/collaborators/ralph_the_reader')
        .reply(404);

      Collaborator.del("snarfblatt", "ralph_the_reader")
        .catch(function(err) {
          mock.done();
          expect(err).to.be.an.object();
          expect(err.statusCode).to.equal(404);
          // expect(err.message).to.include("error removing collaborator");
          done();
        });

    });

  });

});
