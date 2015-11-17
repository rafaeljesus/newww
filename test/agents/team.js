var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  it = lab.test,
  expect = Code.expect,
  nock = require('nock'),
  fixtures = require('../fixtures');

var Team = require('../../agents/team');

describe('Team', function() {
  it('throws if no bearer is passed', function(done) {
    expect(function() {
      return Team();
    }).to.throw("Must pass a bearer (loggedInUser) to Team agent");
    done();
  });

  describe('get', function() {
    it('returns an error if user is unauthorized', function(done) {
      var teamMock = nock('https://user-api-example.com')
        .get('/team/bigco/bigteam')
        .reply(401)
        .get('/team/bigco/bigteam/user')
        .reply(401)
        .get('/team/bigco/bigteam/package?format=mini')
        .reply(401);

      Team('bob').get({
        orgScope: 'bigco',
        teamName: 'bigteam'
      }).catch(function(err) {
        teamMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('user is unauthorized to perform this action');
        done();
      });
    });

    it('returns an error if org or team are missing', function(done) {
      var teamMock = nock('https://user-api-example.com')
        .get('/team/bigco/bigteam')
        .reply(404)
        .get('/team/bigco/bigteam/user')
        .reply(404)
        .get('/team/bigco/bigteam/package?format=mini')
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
        .get('/team/bigco/bigteam/package?format=mini')
        .reply(200, fixtures.teams.bigcoteamPackages);

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
        expect(body.packages.items[0].name).to.equal("@bigco/boom");
        done();
      });
    });
  });

  describe('Users', function() {
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
          expect(err.message).to.equal('user is unauthorized to perform this action');
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

    describe('removeUser()', function() {
      it('returns an error if the user is not an admin', function(done) {
        var teamMock = nock('https://user-api-example.com')
          .delete('/team/bigco/bigteam/user', {
            user: 'bob'
          })
          .reply(401, {
            "error": "user must be admin to perform this operation"
          });

        Team('betty').removeUser({
          id: 'bigteam',
          scope: 'bigco',
          userName: 'bob'
        }).catch(function(err) {
          teamMock.done();
          expect(err).to.exist();
          expect(err.statusCode).to.equal(401);
          expect(err.message).to.equal('user must be admin to perform this operation');
          done();
        });
      });

      it('returns an error if the user is not on the team', function(done) {
        var teamMock = nock('https://user-api-example.com')
          .delete('/team/bigco/bigteam/user', {
            user: 'nobody'
          })
          .reply(400, {
            "error": "you must first add the user to the org"
          });

        Team('bob').removeUser({
          id: 'bigteam',
          scope: 'bigco',
          userName: 'nobody'
        }).catch(function(err) {
          teamMock.done();
          expect(err).to.exist();
          expect(err.statusCode).to.equal(400);
          expect(err.message).to.equal('you must first add the user to the org');
          done();
        });
      });

      it('allows a super/team-admin to remove a user', function(done) {
        var teamMock = nock('https://user-api-example.com')
          .delete('/team/bigco/bigteam/user', {
            user: 'betty'
          })
          .reply(200);

        Team('bob').removeUser({
          id: 'bigteam',
          scope: 'bigco',
          userName: 'betty'
        }).catch(function(err) {
          expect(err).to.not.exist();
          done();
        }).then(function() {
          teamMock.done();
          done();
        });
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
          expect(err.message).to.equal('user is unauthorized to perform this action');
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
          .get('/team/bigco/bigteam/package?format=mini')
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
          expect(err.message).to.equal('user is unauthorized to perform this action');
          done();
        });
      });

      it('returns an error if the org or team or package is not found', function(done) {
        var teamMock = nock('https://user-api-example.com', {
          reqheaders: {
            bearer: 'bloop'
          }
        }).get('/team/bigco/bigteam/package?format=mini')
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
        }).get('/team/bigco/bigteam/package?format=mini')
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
        }).get('/team/bigco/bigteam/package?format=mini')
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
          expect(err.message).to.equal('user is unauthorized to perform this action');
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

  describe('Info', function() {
    it('returns an error if a non-admin attempts to change the description', function(done) {
      var teamMock = nock('https://user-api-example.com')
        .post('/team/bigco/bigteam', {
          description: 'best team ever'
        })
        .reply(401, {
          "error": "user must be admin to perform this operation"
        });

      Team('betty').updateInfo({
        scope: 'bigco',
        id: 'bigteam',
        description: 'best team ever'
      }).catch(function(err) {
        expect(err).to.exist();
        expect(err.statusCode).to.equal(401);
        expect(err.message).to.equal('user must be admin to perform this operation');
      }).then(function(resp) {
        expect(resp).to.not.exist();
      }).finally(function() {
        teamMock.done();
        done();
      });
    });

    it('returns an error if the team does not exist', function(done) {
      var teamMock = nock('https://user-api-example.com')
        .post('/team/bigco/bigsteam', {
          description: 'best team ever'
        })
        .reply(404, {
          "error": "Scope not found"
        });

      Team('bob').updateInfo({
        scope: 'bigco',
        id: 'bigsteam',
        description: 'best team ever'
      }).catch(function(err) {
        expect(err).to.exist();
        expect(err.statusCode).to.equal(404);
        expect(err.message).to.equal('Team or Org not found');
      }).then(function(resp) {
        expect(resp).to.not.exist();
      }).finally(function() {
        teamMock.done();
        done();
      });
    });

    it('returns an error if something else goes wrong', function(done) {
      var teamMock = nock('https://user-api-example.com')
        .post('/team/bigco/bigteam', {
          description: 'best team ever'
        })
        .reply(400, {
          "error": "Whoops"
        });

      Team('bob').updateInfo({
        scope: 'bigco',
        id: 'bigteam',
        description: 'best team ever'
      }).catch(function(err) {
        expect(err).to.exist();
        expect(err.statusCode).to.equal(400);
        expect(err.message).to.equal('Whoops');
      }).then(function(resp) {
        expect(resp).to.not.exist();
      }).finally(function() {
        teamMock.done();
        done();
      });
    });

    it('returns nothing if everything works beautifully', function(done) {
      var teamMock = nock('https://user-api-example.com')
        .post('/team/bigco/bigteam', {
          description: 'best team ever'
        })
        .reply(200);

      Team('bob').updateInfo({
        scope: 'bigco',
        id: 'bigteam',
        description: 'best team ever'
      }).catch(function(err) {
        expect(err).to.not.exist();
      }).then(function(resp) {
        expect(resp).to.not.exist();
      }).finally(function() {
        teamMock.done();
        done();
      });
    });
  });
});
