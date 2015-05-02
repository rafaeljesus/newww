var expect = require('code').expect,
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    it = lab.test,

    present = require(__dirname + "/../../presenters/package"),
    fixtures = require("../fixtures");


describe("name", function () {

  it("creates `encodedName` for making user-acl requests", function (done) {
    var package = present({
      "name": "@acme/project",
      "version": "1.0.0"
    });
    expect(package.encodedName).to.equal("@acme%2Fproject");
    done();
  });

});

describe("scope", function () {

  it("sets `scoped` to true for scoped packages", function (done) {
    var package = present({
      "name": "@acme/project",
      "version": "1.0.0"
    });
    expect(package.scoped).to.be.true();
    done();
  });

  it("sets `scoped` to false for global packages", function (done) {
    var package = present({
      "name": "project",
      "version": "1.0.0"
    });
    expect(package.scoped).to.be.false();
    done();
  });

});

describe("publisher", function () {

  it("is in collaborators list if they are a collaborator", function (done) {
    var package = present(fixtures.packages.browserify);
    expect(package.lastPublisherIsACollaborator).to.be.true();
    done();
  });

  it("is not in the collaborators list if they are not a collaborator", function (done) {
    var package = present({
      "versions": ["0.1.0"],
      "name": "badpkg",
      "publisher": {
        "name": "badactor",
        "email": "badactor@email.com"
      },
      "collaborators": {
        "innocentperson": {
          "name": "innocentperson",
          "email": "innocentperson@email.com"
        }
      },
      "version": "0.1.0",
      "lastPublishedAt": "2013-06-11T09:36:32.285Z"
    });
    expect(package.lastPublisherIsACollaborator).to.be.false();
    done();
  });
});

describe('description', function(){

  var package = present({
    name: "haxxx",
    description: "bad <script>/xss</script> [hax](http://hax.com)"
  })

  it("parses description as markdown and sanitizes it", function(done) {
    expect(package.description).to.equal("bad  <a href=\"http://hax.com\">hax</a>")
    done()
  })

})

describe('installCommand', function(){

  it('is created', function (done) {
    var package = present({
      name: "foo"
    });
    expect(package.installCommand).to.equal("npm install foo");
    done();
  });

  it('respects preferGlobal', function (done) {
    var package = present({
      name: "wibble",
      preferGlobal: true
    });
    expect(package.installCommand).to.equal("npm install -g wibble");
    done();
  });

  it('uses shorthand for packages with long names', function (done) {
    var package = present({
      name: "supercalifragilisticexpialidocious",
      preferGlobal: true
    });
    expect(package.installCommand).to.equal("npm i -g supercalifragilisticexpialidocious");
    done();
  });

})

describe("avatar", function () {
  it("is created for the publisher", function (done) {
    var package = present({
      "versions": ["1.3.0"],
      "name": "hello",
      "publisher": {
        "name": "ohai",
        "email": "ohai@email.com"
      },
      "collaborators": {
        "ohai": {
          "name": "ohai",
          "email": "ohai@email.com"
        }
      },
      "version": "1.3.0",
      "lastPublishedAt": "2013-06-11T09:36:32.285Z"
    });
    expect(package.publisher.avatar).to.exist();
    expect(package.publisher.avatar).to.be.an.object();
    expect(package.publisher.avatar.small).to.exist();
    expect(package.publisher.avatar.medium).to.exist();
    expect(package.publisher.avatar.large).to.exist();
    done();
  });

  it("is created for collaborators", function (done) {
    var package = present(fixtures.packages.browserify);
    var avatar = package.collaborators.maxogden.avatar;
    expect(avatar).to.be.an.object();
    expect(avatar.small).to.exist();
    expect(avatar.medium).to.exist();
    expect(avatar.large).to.exist();
    done();
  });
});

describe("OSS license", function () {
  it("is added to the package", function (done) {
    var package = present({
      "versions": ["1.3.0"],
      "name": "hello",
      "version": "1.3.0",
      "license": "MIT",
      "lastPublishedAt": "2013-06-11T09:36:32.285Z"
    });
    expect(package.license).to.be.an.object();
    expect(package.license.name).to.equal('MIT');
    expect(package.license.url).to.include('opensource.org');
    done();
  });
});

describe("different types of deps", function () {
  it("should included dependents", function (done) {
    var package = present({
      "versions": ["1.3.0"],
      "name": "hello",
      "dependents": [
        "connect-orientdb",
        "graphdb-orient"
      ],
      "publisher": {
        "name": "ohai",
        "email": "ohai@email.com"
      },
      "dependencies": {
        "lodash": "*"
      },
      "devDependencies": {
        "async": "*",
        "tap": "0.4"
      },
      "version": "1.3.0",
      "lastPublishedAt": "2013-06-11T09:36:32.285Z"
    });

    expect(package.dependents).to.be.an.array();
    expect(package.dependents).to.have.length(2);
    var first = package.dependents[0];
    expect(first.name).to.exist();
    expect(first.url).to.exist();
    expect(first.name).to.equal('connect-orientdb');
    expect(first.url).to.equal('/package/connect-orientdb');

    done();
  });

  it("should include dependencies", function (done) {
    var package = present({
      "versions": ["1.3.0"],
      "name": "hello",
      "dependents": [
        "connect-orientdb",
        "graphdb-orient"
      ],
      "publisher": {
        "name": "ohai",
        "email": "ohai@email.com"
      },
      "dependencies": {
        "lodash": "*"
      },
      "devDependencies": {
        "async": "*",
        "tap": "0.4"
      },
      "version": "1.3.0",
      "lastPublishedAt": "2013-06-11T09:36:32.285Z"
    });

    expect(package.dependencies).to.exist();
    expect(package.dependencies).to.include('lodash');

    done();
  });

  it("should include devDependencies", function (done) {
    var package = present({
      "versions": ["1.3.0"],
      "name": "hello",
      "dependents": [
        "connect-orientdb",
        "graphdb-orient"
      ],
      "publisher": {
        "name": "ohai",
        "email": "ohai@email.com"
      },
      "dependencies": {
        "lodash": "*"
      },
      "devDependencies": {
        "async": "*",
        "tap": "0.4"
      },
      "version": "1.3.0",
      "lastPublishedAt": "2013-06-11T09:36:32.285Z"
    });

    expect(package.devDependencies).to.exist();
    expect(package.devDependencies).to.include('async');

    done();
  });

  it("should be included if they exist", function (done) {
    var package = present({
      "versions": ["1.3.0"],
      "name": "hello",
      "publisher": {
        "name": "ohai",
        "email": "ohai@email.com"
      },
      "version": "1.3.0",
      "lastPublishedAt": "2013-06-11T09:36:32.285Z"
    });
    expect(package.dependencies).to.not.exist();
    expect(package.devDependencies).to.not.exist();
    expect(package.dependents).to.not.exist();
    done();
  });
});

describe("repo url", function () {
  it("doesn't change if it's not a GH url", function (done) {
    var package = present({
      "versions": ["1.3.0"],
      "name": "hello",
      "repository": {
        "type": "git",
        "url": "http://website.com/ohai"
      },
      "publisher": {
        "name": "ohai",
        "email": "ohai@email.com"
      },
      "version": "1.3.0",
      "lastPublishedAt": "2013-06-11T09:36:32.285Z"
    });

    expect(package.repository.url).to.equal('http://website.com/ohai');
    done();
  });

  it("cleans up github URLs", function (done) {
    var package = present({
      "versions": ["1.3.0"],
      "name": "hello",
      "repository": {
        "type": "git",
        "url": "http://github.com/someone/ohai.git"
      },
      "publisher": {
        "name": "ohai",
        "email": "ohai@email.com"
      },
      "version": "1.3.0",
      "lastPublishedAt": "2013-06-11T09:36:32.285Z"
    });

    expect(package.repository.url).to.equal('https://github.com/someone/ohai');
    done();
  });

  it("converts git:// URLS to https so they can be linked to", function (done) {
    var package = present({
      "versions": ["1.3.0"],
      "name": "hello",
      "repository": {
        "type": "git",
        "url": "git://github.com/someone/ohai.git"
      },
      "publisher": {
        "name": "ohai",
        "email": "ohai@email.com"
      },
      "version": "1.3.0",
      "lastPublishedAt": "2013-06-11T09:36:32.285Z"
    });

    expect(package.repository.url).to.equal('https://github.com/someone/ohai');
    done();
  });

});
