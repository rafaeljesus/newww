var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    it = lab.test,
    expect = Code.expect,
    present = require(__dirname + "/../../presenters/user"),
    fixtures = require(__dirname + "/../fixtures.js");

describe("email", function(){

  it("gets obfuscated", function(done) {
    var user = present({email: "zeke@sikelianos.com"});
    expect(user.emailObfuscated).to.exist();
    done();
  });
});

describe("avatar", function(){

  it("is an object", function(done) {
    var user = present({email: "zeke@sikelianos.com"});
    expect(user.avatar).to.be.an.object();
    done();
  });

  it("has a small version", function(done) {
    var user = present({email: "zeke@sikelianos.com"});
    expect(user.avatar.small).to.exist();
    expect(user.avatar.small).to.not.include("size=100");
    done();
  });

  it("has a medium version", function(done) {
    var user = present({email: "zeke@sikelianos.com"});
    expect(user.avatar.medium).to.exist();
    expect(user.avatar.medium).to.include("size=100");
    done();
  });

  it("has a large version", function(done) {
    var user = present({email: "zeke@sikelianos.com"});
    expect(user.avatar.large).to.exist();
    expect(user.avatar.large).to.include("size=496");
    done();
  });
});

describe("meta", function () {

  it("is an object with key-value pairs", function(done){
    var user = present(fixtures.users.full_meta);
    expect(user.meta).to.exist();
    expect(user.meta).to.be.an.object();
    done();
  });

  it("discards pairs with empty key or values", function(done){
    var user = present({
      name: "mona",
      resource: {
        github: "mona",
        twitter: "mona",
        "": "mona",
        ICQ: ''
      }
    });
    expect(Object.keys(user.meta)).to.have.length(4);
    expect(user.meta.github).to.exist();
    expect(user.meta.twitter).to.exist();
    expect(user.meta.freenode).to.be.undefined();
    expect(user.meta.ICQ).to.not.exist();
    done();
  });

  describe("homepage", function () {

    it("leaves fully-qualified URLs untouched", function(done){
      var user = present({
        name: "lisa",
        resource: {
          homepage: "https://lisa.org"
        }
      });
      expect(user.meta.homepage).to.equal("https://lisa.org");
      done();
    });

    it("converts schemeless URLs into fully-qualified URLs", function(done){
      var user = present({
        name: "margaret",
        resource: {
          homepage: "margaret.com"
        }
      });
      expect(user.meta.homepage).to.equal("http://margaret.com");
      done();
    });

    it("discards values that can't be turned into URLs", function(done){
      var user = present({
        name: "kate",
        resource: {
          twitter: "kate",
          homepage: "kate"
        }
      });
      expect(user.meta.homepage).to.not.exist();
      done();
    });
  });

  describe("github", function () {

    it("removes leading @ from username if present", function(done){
      var user = present({
        name: "eleanor",
        resource: {
          github: "@eleanor"
        }
      });
      expect(user.meta.github).to.equal("eleanor");
      done();
    });

    it("extracts username if value is a URL", function(done){
      var user = present({
        name: "suzan",
        resource: {
          github: "https://github.com/suzan"
        }
      });
      expect(user.meta.github).to.equal("suzan");
      done();
    });

    it("extracts username if value is a schemeless URL", function(done){
      var user = present({
        name: "jimbo",
        resource: {
          github: "github.com/jimbo"
        }
      });
      expect(user.meta.github).to.equal("jimbo");
      done();
    });

    it("is discarded if value is an empty string", function(done){
      var user = present({
        name: "suzan",
        resource: {
          twitter: "suzan",
          github: ""
        }
      });
      expect(user.meta.twitter).to.equal("suzan");
      expect(user.meta.github).to.be.empty();
      done();
    });
  });

  describe("twitter", function () {
    it("removes leading @ from username if present", function(done){
      var user = present({
        name: "eleanor",
        resource: {
          twitter: "@eleanor"
        }
      });
      expect(user.meta.twitter).to.equal("eleanor");
      done();
    });

    it("extracts username if value is a URL", function(done){
      var user = present({
        name: "suzan",
        resource: {
          twitter: "https://twitter.com/suzan"
        }
      });
      expect(user.meta.twitter).to.equal("suzan");
      done();
    });

    it("extracts username if value is a schemeless URL", function(done){
      var user = present({
        name: "suzan",
        resource: {
          twitter: "twitter.com/suzan"
        }
      });
      expect(user.meta.twitter).to.equal("suzan");
      done();
    });
  });

  describe("freenode", function () {
    it("is present", function(done){
      var user = present({
        name: "eleanor",
        resource: {
          twitter: "@eleanor",
          freenode: "eleanor1"
        }
      });
      expect(user.meta.freenode).to.equal("eleanor1");
      done();
    });
  });
});
