var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect,
    present = require(__dirname + "/../../presenters/user"),
    users = require(__dirname + "/../fixtures/users")

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
    var user = present(users.full_meta);
    expect(user.meta).to.exist();
    expect(user.meta).to.be.an.object();
    done();
  });

  it("discards pairs with empty key or values", function(done){
    var user = present({
      name: "mona",
      fields: [
        {name: "github", value: "mona"},
        {name: "twitter", value: "mona"},
        {name: "", value: "mona"},
        {name: "ICQ", value: ""}
      ]
    });
    expect(Object.keys(user.meta)).to.have.length(2);
    expect(user.meta.github).to.exist();
    expect(user.meta.twitter).to.exist();
    done();
  });

  describe("homepage", function () {

    it("leaves fully-qualified URLs untouched", function(done){
      var user = present({
        name: "lisa",
        fields: [
          {name: "homepage", value: "https://lisa.org"},
        ]
      });
      expect(user.meta.homepage).to.equal("https://lisa.org");
      done();
    });

    it("converts schemeless URLs into fully-qualified URLs", function(done){
      var user = present({
        name: "margaret",
        fields: [
          {name: "homepage", value: "margaret.com"},
        ]
      });
      expect(user.meta.homepage).to.equal("http://margaret.com");
      done();
    });

    it("discards values that can't be turned into URLs", function(done){
      var user = present({
        name: "kate",
        fields: [
          {name: "twitter", value: "kate"},
          {name: "homepage", value: "kate"},
        ]
      });
      expect(user.meta.homepage).to.not.exist();
      done();
    });
  });

  describe("github", function () {

    it("removes leading @ from username if present", function(done){
      var user = present({
        name: "eleanor",
        fields: [
          {name: "github", value: "@eleanor"},
        ]
      });
      expect(user.meta.github).to.equal("eleanor");
      done();
    });

    it("extracts username if value is a URL", function(done){
      var user = present({
        name: "suzan",
        fields: [
          {name: "github", value: "https://github.com/suzan"},
        ]
      });
      expect(user.meta.github).to.equal("suzan");
      done();
    });

    it("extracts username if value is a schemeless URL", function(done){
      var user = present({
        name: "jimbo",
        fields: [
          {name: "github", value: "github.com/jimbo"},
        ]
      });
      expect(user.meta.github).to.equal("jimbo");
      done();
    });

    it("is discarded if value is an empty string", function(done){
      var user = present({
        name: "suzan",
        fields: [
          {name: "twitter", value: "suzan"},
          {name: "github", value: ""},
        ]
      });
      expect(user.meta.twitter).to.equal("suzan");
      expect(user.meta.github).to.not.exist();
      done();
    });
  });

  describe("twitter", function () {
    it("removes leading @ from username if present", function(done){
      var user = present({
        name: "eleanor",
        fields: [
          {name: "twitter", value: "@eleanor"},
        ]
      });
      expect(user.meta.twitter).to.equal("eleanor");
      done();
    });

    it("extracts username if value is a URL", function(done){
      var user = present({
        name: "suzan",
        fields: [
          {name: "twitter", value: "https://twitter.com/suzan"},
        ]
      });
      expect(user.meta.twitter).to.equal("suzan");
      done();
    });

    it("extracts username if value is a schemeless URL", function(done){
      var user = present({
        name: "suzan",
        fields: [
          {name: "twitter", value: "twitter.com/suzan"},
        ]
      });
      expect(user.meta.twitter).to.equal("suzan");
      done();
    });
  });

  describe("freenode", function () {
    it("is present", function(done){
      var user = present({
        name: "eleanor",
        fields: [
          {name: "twitter", value: "@eleanor"},
          {name: "freenode", value: "eleanor1"},
        ]
      });
      expect(user.meta.freenode).to.equal("eleanor1");
      done();
    });
  });
});
