var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  it = lab.test,
  expect = Code.expect,
  nock = require('nock');

var Team = require('../../agents/team');

describe('Team', function() {
  it('throws if no bearer is passed', function(done) {
    expect(function() {
      return Team();
    }).to.throw("Must pass a bearer (loggedInUser) to Team agent");
    done();
  });

  describe('get', function() {
    it('returns an error if bearer token is incorrect', function(done) {
      var teamMock = nock('https://user-api-example.com')
        .get('/team/bigco/bigteam')
        .reply(401)
        .get('/team/bigco/bigteam/user')
        .reply(401)
        .get('/team/bigco/bigteam/package')
        .reply(401);

      Team('bob').get({
        orgScope: 'bigco',
        teamName: 'bigteam'
      }).catch(function(err) {
        teamMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('no bearer token included');
        done();
      });
    });

    it('returns an error if org or team are missing', function(done) {
      var teamMock = nock('https://user-api-example.com')
        .get('/team/bigco/bigteam')
        .reply(404)
        .get('/team/bigco/bigteam/user')
        .reply(404)
        .get('/team/bigco/bigteam/package')
        .reply(404);

      Team('bob').get({
        orgScope: 'bigco',
        teamName: 'bigteam'
      }, function(err) {
        teamMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('Team or Org not found');
        done();
      });
    });

    it('returns the team and data about the team', function(done) {
      var teamMock = nock('https://user-api-example.com')
        .get('/team/bigco/bigteam')
        .reply(200, {
          "name": "bigteam",
          "scope_id": "bigco",
          "created": "2015-06-19T23:35:42.659Z",
          "updated": "2015-06-19T23:35:42.659Z",
          "deleted": null
        })
        .get('/team/bigco/bigteam/user')
        .reply(200, ['bob'])
        .get('/team/bigco/bigteam/package')
        .reply(200, {
          "@npm/blerg": "write"
        });

      Team('bob').get({
        orgScope: 'bigco',
        teamName: 'bigteam'
      }, function(err, body) {
        teamMock.done();
        expect(err).to.not.exist();
        expect(body.name).to.equal("bigteam");
        expect(body.scope_id).to.equal("bigco");
        expect(body.users.count).to.equal(1);
        expect(body.users.items[0]).to.equal("bob");
        expect(body.packages.count).to.equal(1);
        expect(body.packages.items[0].name).to.equal("@npm/blerg");
        done();
      });
    });
  });

  describe('addUsers', function() {
    it('returns an error if bearer token is incorrect', function(done) {
      var teamMock = nock('https://user-api-example.com')
        .put('/team/bigco/bigteam/user', {
          user: 'littlebob'
        })
        .reply(401);

      Team('bob').addUsers({
        teamName: 'bigteam',
        scope: 'bigco',
        users: ['littlebob']
      }, function(err) {
        teamMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('no bearer token included');
        done();
      });
    });

    it('returns an error if org or team is not found', function(done) {
      var teamMock = nock('https://user-api-example.com')
        .put('/team/bigco/bigteam/user', {
          user: 'littlebob'
        })
        .reply(404);

      Team('bob').addUsers({
        teamName: 'bigteam',
        scope: 'bigco',
        users: ['littlebob']
      }, function(err) {
        teamMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('Team or Org not found');
        done();
      });
    });

    it('returns an error if user is already on team', function(done) {
      var teamMock = nock('https://user-api-example.com')
        .put('/team/bigco/bigteam/user', {
          user: 'littlebob'
        })
        .reply(409);

      Team('bob').addUsers({
        teamName: 'bigteam',
        scope: 'bigco',
        users: ['littlebob']
      }, function(err) {
        teamMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('The provided User is already on this Team');
        done();
      });
    });

    it('allows multiple members to be added', function(done) {
      var teamMock = nock('https://user-api-example.com')
        .put('/team/bigco/bigteam/user', {
          user: 'littlebob'
        })
        .reply(200)
        .put('/team/bigco/bigteam/user', {
          user: 'bigbob'
        })
        .reply(200);

      Team('bob').addUsers({
        teamName: 'bigteam',
        scope: 'bigco',
        users: ['littlebob', 'bigbob']
      }, function(err) {
        teamMock.done();
        expect(err).to.not.exist();
        done();
      });
    });

  });

  describe('Packages', function() {
    describe('addPackage()', function() {
      it('returns an error if the bearer token is missing', function(done) {
        var teamMock = nock('https://user-api-example.com')
          .put('/team/bigco/bigteam/package', {
            package: '@bigco/foo',
            permissions: 'read'
          })
          .reply(401, {
            "error": "missing bearer token"
          });

        Team('').addPackage({
          scope: 'bigco',
          id: 'bigteam',
          package: '@bigco/foo',
          permissions: 'read'
        }).catch(function(err) {
          teamMock.done();
          expect(err).to.exist();
          expect(err.statusCode).to.equal(401);
          expect(err.message).to.equal('no bearer token included');
          done();
        });
      });

      it('returns an error if the org or team or package is not found', function(done) {
        var teamMock = nock('https://user-api-example.com', {
          reqheaders: {
            bearer: 'bloop'
          }
        })
          .put('/team/bigco/bigteam/package', {
            package: '@bigco/foo',
            permissions: 'read'
          })
          .reply(404, {
            "error": "Package not found"
          });

        Team('bloop').addPackage({
          scope: 'bigco',
          id: 'bigteam',
          package: '@bigco/foo',
          permissions: 'read'
        }).catch(function(err) {
          teamMock.done();
          expect(err).to.exist();
          expect(err.statusCode).to.equal(404);
          expect(err.message).to.equal('Package not found');
          done();
        });
      });

      it('returns an error if any other error occurs', function(done) {
        var teamMock = nock('https://user-api-example.com', {
          reqheaders: {
            bearer: 'bloop'
          }
        })
          .put('/team/bigco/bigteam/package', {
            package: '@bigco/foo',
            permissions: 'read'
          })
          .reply(500, {
            "error": "brokened"
          });

        Team('bloop').addPackage({
          scope: 'bigco',
          id: 'bigteam',
          package: '@bigco/foo',
          permissions: 'read'
        }).catch(function(err) {
          teamMock.done();
          expect(err).to.exist();
          expect(err.statusCode).to.equal(500);
          expect(err.message).to.equal('brokened');
          done();
        });
      });

      it('returns nothing if you add/update a package', function(done) {
        var teamMock = nock('https://user-api-example.com', {
          reqheaders: {
            bearer: 'bob'
          }
        })
          .put('/team/bigco/bigteam/package', {
            package: '@bigco/foo',
            permissions: 'read'
          })
          .reply(200);

        Team('bob').addPackage({
          scope: 'bigco',
          id: 'bigteam',
          package: '@bigco/foo',
          permissions: 'read'
        }).catch(function(err) {
          expect(err).to.not.exist();
        }).then(function(packages) {
          expect(packages).to.not.exist();
        }).finally(function() {
          teamMock.done();
          done();
        });
      });
    });

    describe('getPackages()', function() {
      it('returns an error if the bearer token is missing', function(done) {
        var teamMock = nock('https://user-api-example.com')
          .get('/team/bigco/bigteam/package')
          .reply(401, {
            "error": "missing bearer token"
          });

        Team('').getPackages({
          orgScope: 'bigco',
          teamName: 'bigteam'
        }).catch(function(err) {
          teamMock.done();
          expect(err).to.exist();
          expect(err.statusCode).to.equal(401);
          expect(err.message).to.equal('no bearer token included');
          done();
        });
      });

      it('returns an error if the org or team or package is not found', function(done) {
        var teamMock = nock('https://user-api-example.com', {
          reqheaders: {
            bearer: 'bloop'
          }
        }).get('/team/bigco/bigteam/package')
          .reply(404, {
            "error": "not found"
          });

        Team('bloop').getPackages({
          orgScope: 'bigco',
          teamName: 'bigteam'
        }).catch(function(err) {
          teamMock.done();
          expect(err).to.exist();
          expect(err.statusCode).to.equal(404);
          expect(err.message).to.equal('Team or Org not found');
          done();
        });
      });

      it('returns an error if any other error occurs', function(done) {
        var teamMock = nock('https://user-api-example.com', {
          reqheaders: {
            bearer: 'bloop'
          }
        }).get('/team/bigco/bigteam/package')
          .reply(500, {
            "error": "brokened"
          });

        Team('bloop').getPackages({
          orgScope: 'bigco',
          teamName: 'bigteam'
        }).catch(function(err) {
          teamMock.done();
          expect(err).to.exist();
          expect(err.statusCode).to.equal(500);
          expect(err.message).to.equal('brokened');
          done();
        });
      });

      it('returns a list of packages for authorized users', function(done) {
        var teamMock = nock('https://user-api-example.com', {
          reqheaders: {
            bearer: 'bob'
          }
        }).get('/team/bigco/bigteam/package')
          .reply(200, {
            "@bigco/fake-module": "write"
          });

        Team('bob').getPackages({
          orgScope: 'bigco',
          teamName: 'bigteam'
        }).catch(function(err) {
          expect(err).to.not.exist();
        }).then(function(packages) {
          expect(packages).to.exist();
          expect(packages).to.be.an.object();
          expect(packages['@bigco/fake-module']).to.equal('write');
        }).finally(function() {
          teamMock.done();
          done();
        });
      });
    });

    describe('removePackage()', function() {
      it('returns an error if the bearer token is missing', function(done) {
        var teamMock = nock('https://user-api-example.com')
          .delete('/team/bigco/bigteam/package', {
            package: '@bigteam/fake-module'
          })
          .reply(401, {
            "error": "missing bearer token"
          });

        Team('').removePackage({
          scope: 'bigco',
          id: 'bigteam',
          package: '@bigteam/fake-module'
        }).catch(function(err) {
          teamMock.done();
          expect(err).to.exist();
          expect(err.statusCode).to.equal(401);
          expect(err.message).to.equal('no bearer token included');
          done();
        });
      });

      it('returns an error if the team is not found', function(done) {
        var teamMock = nock('https://user-api-example.com', {
          reqheaders: {
            bearer: 'bob'
          }
        }).delete('/team/bigco/bigteam/package', {
          package: '@bigteam/fake-module'
        })
          .reply(404, {
            "error": "not found"
          });

        Team('bob').removePackage({
          scope: 'bigco',
          id: 'bigteam',
          package: '@bigteam/fake-module'
        }).catch(function(err) {
          teamMock.done();
          expect(err).to.exist();
          expect(err.statusCode).to.equal(404);
          expect(err.message).to.equal('Team or Org not found');
          done();
        });
      });

      it('returns an error if any other error occurs', function(done) {
        var teamMock = nock('https://user-api-example.com', {
          reqheaders: {
            bearer: 'bob'
          }
        }).delete('/team/bigco/bigteam/package', {
          package: '@bigteam/fake-module'
        })
          .reply(500, {
            "error": "brokened"
          });

        Team('bob').removePackage({
          scope: 'bigco',
          id: 'bigteam',
          package: '@bigteam/fake-module'
        }).catch(function(err) {
          teamMock.done();
          expect(err).to.exist();
          expect(err.statusCode).to.equal(500);
          expect(err.message).to.equal('brokened');
          done();
        });
      });

      it('returns nothing if you delete a package', function(done) {
        var teamMock = nock('https://user-api-example.com', {
          reqheaders: {
            bearer: 'bob'
          }
        }).delete('/team/bigco/bigteam/package', {
          package: '@bigteam/fake-module'
        })
          .reply(200);

        Team('bob').removePackage({
          scope: 'bigco',
          id: 'bigteam',
          package: '@bigteam/fake-module'
        }).catch(function(err) {
          expect(err).to.not.exist();
        }).then(function(packages) {
          expect(packages).to.not.exist();
        }).finally(function() {
          teamMock.done();
          done();
        });
      });
    });
  });
});
