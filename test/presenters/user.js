var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  it = lab.test,
  expect = Code.expect,
  present = require(__dirname + "/../../presenters/user"),
  fixtures = require(__dirname + "/../fixtures.js");

describe("email", function() {

  it("gets obfuscated", function(done) {
    var user = present({
      email: "zeke@sikelianos.com"
    });
    expect(user.emailObfuscated).to.exist();
    done();
  });
});

describe("avatar", function() {

  it("is an object", function(done) {
    var user = present({
      email: "zeke@sikelianos.com"
    });
    expect(user.avatar).to.be.an.object();
    done();
  });

  it("has a small version", function(done) {
    var user = present({
      email: "zeke@sikelianos.com"
    });
    expect(user.avatar.small).to.exist();
    expect(user.avatar.small).to.not.include("size=100");
    done();
  });

  it("has a medium version", function(done) {
    var user = present({
      email: "zeke@sikelianos.com"
    });
    expect(user.avatar.medium).to.exist();
    expect(user.avatar.medium).to.include("size=100");
    done();
  });

  it("has a large version", function(done) {
    var user = present({
      email: "zeke@sikelianos.com"
    });
    expect(user.avatar.large).to.exist();
    expect(user.avatar.large).to.include("size=496");
    done();
  });
});

describe("resource", function() {

  it("is an object", function(done) {
    var user = present({
      name: "zeke",
      resource: {
        github: "zeke"
      }
    });
    expect(user.resource).to.exist();
    expect(user.resource).to.be.an.object();
    done();
  });

  it("discards pairs with empty key or values", function(done) {
    var user = present({
      name: "mona",
      resource: {
        github: "mona",
        twitter: "mona",
        "": "mona",
        ICQ: ''
      }
    });
    expect(Object.keys(user.resource)).to.have.length(2);
    expect(user.resource.github).to.exist();
    expect(user.resource.twitter).to.exist();
    expect(user.resource.freenode).to.be.undefined();
    expect(user.resource.ICQ).to.be.undefined();
    done();
  });

  describe("homepage", function() {

    it("leaves fully-qualified URLs untouched", function(done) {
      var user = present({
        name: "lisa",
        resource: {
          homepage: "https://lisa.org"
        }
      });
      expect(user.resource.homepage).to.equal("https://lisa.org");
      done();
    });

    it("converts schemeless URLs into fully-qualified URLs", function(done) {
      var user = present({
        name: "margaret",
        resource: {
          homepage: "margaret.com"
        }
      });
      expect(user.resource.homepage).to.equal("http://margaret.com");
      done();
    });

    it("discards values that can't be turned into URLs", function(done) {
      var user = present({
        name: "kate",
        resource: {
          twitter: "kate",
          homepage: "kate"
        }
      });
      expect(user.resource.homepage).to.equal("");
      done();
    });
  });

  describe("github", function() {

    it("removes leading @ from username if present", function(done) {
      var user = present({
        name: "eleanor",
        resource: {
          github: "@eleanor"
        }
      });
      expect(user.resource.github).to.equal("eleanor");
      done();
    });

    it("extracts username if value is a URL", function(done) {
      var user = present({
        name: "suzan",
        resource: {
          github: "https://github.com/suzan"
        }
      });
      expect(user.resource.github).to.equal("suzan");
      done();
    });

    it("extracts username if value is a schemeless URL", function(done) {
      var user = present({
        name: "jimbo",
        resource: {
          github: "github.com/jimbo"
        }
      });
      expect(user.resource.github).to.equal("jimbo");
      done();
    });

    it("is discarded if value is an empty string", function(done) {
      var user = present({
        name: "suzan",
        resource: {
          twitter: "suzan",
          github: ""
        }
      });
      expect(user.resource.twitter).to.equal("suzan");
      expect(user.resource.github).to.be.empty();
      done();
    });
  });

  describe("twitter", function() {
    it("removes leading @ from username if present", function(done) {
      var user = present({
        name: "eleanor",
        resource: {
          twitter: "@eleanor"
        }
      });
      expect(user.resource.twitter).to.equal("eleanor");
      done();
    });

    it("extracts username if value is a URL", function(done) {
      var user = present({
        name: "suzan",
        resource: {
          twitter: "https://twitter.com/suzan"
        }
      });
      expect(user.resource.twitter).to.equal("suzan");
      done();
    });

    it("extracts username if value is a schemeless URL", function(done) {
      var user = present({
        name: "suzan",
        resource: {
          twitter: "twitter.com/suzan"
        }
      });
      expect(user.resource.twitter).to.equal("suzan");
      done();
    });
  });

  describe("freenode", function() {
    it("is present", function(done) {
      var user = present({
        name: "eleanor",
        resource: {
          twitter: "@eleanor",
          freenode: "eleanor1"
        }
      });
      expect(user.resource.freenode).to.equal("eleanor1");
      done();
    });
  });
});
