var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  it = lab.test,
  expect = Code.expect,
  present = require(__dirname + "/../../presenters/package"),
  cache = require(__dirname + "/../../lib/cache"),
  sinon = require('sinon');

describe("name", function() {

  it("creates `encodedName` for making user-acl requests", function(done) {
    present({
      "name": "@acme/project",
      "version": "1.0.0"
    }).then(function(pkg) {
      expect(pkg.encodedName).to.equal("@acme%2Fproject");
      done();
    });
  });

});

describe("scope", function() {

  it("sets `scoped` to true for scoped pkgs", function(done) {
    present({
      "name": "@acme/project",
      "version": "1.0.0"
    }).then(function(pkg) {
      expect(pkg.scoped).to.be.true();
      done();
    });
  });

  it("sets `scoped` to false for global pkgs", function(done) {
    present({
      "name": "project",
      "version": "1.0.0"
    }).then(function(pkg) {
      expect(pkg.scoped).to.be.false();
      done();
    });
  });

});

describe("publisher", function() {

  it("is in collaborators list if they are a collaborator", function(done) {
    present({
      "versions": ["0.1.0"],
      "name": "goodpkg",
      "publisher": {
        "name": "innocentperson",
        "email": "innocentperson@email.com"
      },
      "collaborators": {
        "innocentperson": {
          "name": "innocentperson",
          "email": "innocentperson@email.com"
        }
      },
      "version": "0.1.0",
      "lastPublishedAt": "2013-06-11T09:36:32.285Z"
    })
      // present(fixtures.packages.browserify)
      .then(function(pkg) {
        expect(pkg.lastPublisherIsACollaborator).to.be.true();
        done();
      });
  });

  it("is not in the collaborators list if they are not a collaborator", function(done) {
    present({
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
    }).then(function(pkg) {
      expect(pkg.lastPublisherIsACollaborator).to.be.false();
      done();
    });
  });
});

describe('description', function() {

  present({
    name: "haxxx",
    description: "bad <script>/xss</script> [hax](http://hax.com)"
  }).then(function(pkg) {
    it("parses description as markdown and sanitizes it", function(done) {
      expect(pkg.description).to.equal("bad  <a href=\"http://hax.com\">hax</a>");
      done();
    });
  });
});

describe('installCommand', function() {

  it('is created', function(done) {
    present({
      name: "foo"
    }).then(function(pkg) {
      expect(pkg.installCommand).to.equal("npm install foo");
      done();
    });
  });

  it('respects preferGlobal', function(done) {
    present({
      name: "wibble",
      preferGlobal: true
    }).then(function(pkg) {
      expect(pkg.installCommand).to.equal("npm install -g wibble");
      done();
    });
  });

  it('uses shorthand for packages with long names', function(done) {
    present({
      name: "supercalifragilisticexpialidocious",
      preferGlobal: true
    }).then(function(pkg) {
      expect(pkg.installCommand).to.equal("npm i -g supercalifragilisticexpialidocious");
      done();
    });
  });

});

describe("avatar", function() {
  it("is created for the publisher", function(done) {
    present({
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
    }).then(function(pkg) {
      expect(pkg.publisher.avatar).to.exist();
      expect(pkg.publisher.avatar).to.be.an.object();
      expect(pkg.publisher.avatar.small).to.exist();
      expect(pkg.publisher.avatar.medium).to.exist();
      expect(pkg.publisher.avatar.large).to.exist();
      done();
    });
  });

  it("is created for collaborators", function(done) {

    present({
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
        },
        "hermione": {
          "name": "hermione",
          "email": "hermione@email.com"
        }
      },
      "version": "1.3.0",
      "lastPublishedAt": "2013-06-11T09:36:32.285Z"
    })
      // present(fixtures.packages.browserify)
      .then(function(pkg) {
        var avatar = pkg.collaborators.hermione.avatar;
        expect(avatar).to.be.an.object();
        expect(avatar.small).to.exist();
        expect(avatar.medium).to.exist();
        expect(avatar.large).to.exist();
        done();
      });
  });
});

describe("SPDX license links", function () {
  it("are added to the pkg", function (done) {
    present({
      "versions": ["1.3.0"],
      "name": "hello",
      "version": "1.3.0",
      "license": "(MIT AND BSD-2-Clause)",
      "lastPublishedAt": "2013-06-11T09:36:32.285Z"
    }).then(function(pkg) {
      expect(pkg.license).to.be.an.object();
      expect(pkg.license.links).to.include('MIT');
      expect(pkg.license.links).to.include('BSD-2-Clause');
      expect(pkg.license.links).to.include('spdx.org');
      done();
    });
  });
});

describe("different types of deps", function() {
  it("should included dependents", function(done) {
    present({
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
    }).then(function(pkg) {

      expect(pkg.dependents).to.be.an.array();
      expect(pkg.dependents).to.have.length(2);
      var first = pkg.dependents[0];
      expect(first.name).to.exist();
      expect(first.url).to.exist();
      expect(first.name).to.equal('connect-orientdb');
      expect(first.url).to.equal('/package/connect-orientdb');

      done();
    });
  });

  it("should include dependencies", function(done) {
    present({
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
    }).then(function(pkg) {

      expect(pkg.dependencies).to.exist();
      expect(pkg.dependencies).to.include('lodash');

      done();
    });
  });

  it("should include devDependencies", function(done) {
    present({
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
    }).then(function(pkg) {

      expect(pkg.devDependencies).to.exist();
      expect(pkg.devDependencies).to.include('async');

      done();
    });
  });

  it("should be included if they exist", function(done) {
    present({
      "versions": ["1.3.0"],
      "name": "hello",
      "publisher": {
        "name": "ohai",
        "email": "ohai@email.com"
      },
      "version": "1.3.0",
      "lastPublishedAt": "2013-06-11T09:36:32.285Z"
    }).then(function(pkg) {
      expect(pkg.dependencies).to.not.exist();
      expect(pkg.devDependencies).to.not.exist();
      expect(pkg.dependents).to.not.exist();
      done();
    });
  });
});

describe("repo url", function() {
  it("is removed if the url is not a url at all", function(done) {
    present({
      "versions": ["1.3.0"],
      "name": "hello",
      "repository": {
        "type": "git",
        "url": "javascript:alert(1)"
      },
      "publisher": {
        "name": "ohai",
        "email": "ohai@email.com"
      },
      "version": "1.3.0",
      "lastPublishedAt": "2013-06-11T09:36:32.285Z"
    }).then(function(pkg) {
      expect(pkg.repository).to.not.exist();
      done();
    });
  });

  it("doesn't change if it's not a GH url", function(done) {
    present({
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
    }).then(function(pkg) {
      expect(pkg.repository.url).to.equal('http://website.com/ohai');
      done();
    });
  });

  it("cleans up github URLs", function(done) {
    present({
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
    }).then(function(pkg) {
      expect(pkg.repository.url).to.equal('https://github.com/someone/ohai');
      done();
    });
  });

  it("cleans up shorthands", function(done) {
    present({
      "versions": ["1.3.0"],
      "name": "hello",
      "repository": "github:someone/ohai",
      "publisher": {
        "name": "ohai",
        "email": "ohai@email.com"
      },
      "version": "1.3.0",
      "lastPublishedAt": "2013-06-11T09:36:32.285Z"
    }).then(function(pkg) {
      expect(pkg.repository.url).to.equal('https://github.com/someone/ohai');
      done();
    });
  });

  it("converts git:// URLS to https so they can be linked to", function(done) {
    present({
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
    }).then(function(pkg) {
      expect(pkg.repository.url).to.equal('https://github.com/someone/ohai');
      done();
    });
  });

});

describe("bugs url", function() {
  it("is removed if it is not a real url", function(done) {
    present({
      "versions": ["1.3.0"],
      "name": "hello",
      "bugs": {
        "type": "git",
        "url": "javascript:alert(1)"
      },
      "publisher": {
        "name": "ohai",
        "email": "ohai@email.com"
      },
      "version": "1.3.0",
      "lastPublishedAt": "2013-06-11T09:36:32.285Z"
    }).then(function(pkg) {
      expect(pkg.bugs).to.not.exist();
      done();
    });
  });
});

describe("readme", function() {
  it('gets processed if it is not cached yet', function(done) {
    sinon.spy(cache, 'setKey');

    present({
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
      "lastPublishedAt": "2013-06-11T09:36:32.285Z",
      "readme": "# heading\n\n> quote"
    }).then(function(pkg) {
      expect(pkg.readme).to.include("<h1 id=\"user-content-heading\"");
      expect(cache.setKey.called).to.be.true();
      expect(cache.setKey.calledWith('hello_readme')).to.be.true();
      cache.setKey.restore();
      done();
    });
  });

  it('does not get processed if it is cached', function(done) {
    sinon.stub(cache, 'getKey', function(key, cb) {
      cb(null, "<h1>boom</h1>");
    });
    sinon.spy(cache, 'setKey');

    present({
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
      "lastPublishedAt": "2013-06-11T09:36:32.285Z",
      "readme": "# heading\n\n> quote"
    }).then(function(pkg) {
      expect(pkg.readme).to.equal("<h1>boom</h1>");
      expect(cache.setKey.called).to.be.false();
      cache.getKey.restore();
      cache.setKey.restore();
      done();
    });
  });
});
