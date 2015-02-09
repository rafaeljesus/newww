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
    fixtures = require("../fixtures.js")

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
        expect(collaborators).to.deepEqual(fixtures.collaborators);
        done();
      });

    });
  });

});
