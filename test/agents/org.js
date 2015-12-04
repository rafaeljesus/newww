var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  // beforeEach = lab.beforeEach,
  // before = lab.before,
  // after = lab.after,
  it = lab.test,
  expect = Code.expect,
  nock = require('nock'),
  fixtures = require('../fixtures');

var Org = require('../../agents/org');

describe('Org', function() {
  it('throws if no bearer is passed', function(done) {
    expect(function() {
      return Org();
    }).to.throw("Must pass a bearer (loggedInUser) to Org agent");
    done();
  });

  describe("create()", function() {
    it("errors out if bearer token is not included", function(done) {
      var orgMock = nock('https://user-api-example.com')
        .put('/org', {
          name: 'bigco',
          resource: {
            "human_name": "Bob's Big Co"
          }
        })
        .reply(401);

      Org('bob').create({
        scope: 'bigco',
        humanName: "Bob's Big Co"
      }, function(err, org) {
        orgMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('no bearer token included in creation of bigco');
        expect(err.statusCode).to.equal(401);
        expect(org).to.be.undefined();
        done();
      });
    });

    it("is successful if bearer token is included", function(done) {
      var orgMock = nock('https://user-api-example.com', {
        reqheaders: {
          bearer: 'bob'
        }
      })
        .put('/org', {
          name: "bigco",
          resource: {
            "human_name": "Bob's Big Co"
          }
        })
        .reply(200, {
          "name": "bigco",
          "description": "",
          "resource": {
            "human_name": "Bob's Big Co"
          },
          "created": "2015-06-19T23:35:42.659Z",
          "updated": "2015-06-19T23:35:42.659Z",
          "deleted": null
        });

      Org('bob').create({
        scope: "bigco",
        humanName: "Bob's Big Co"
      }, function(err, org) {
        orgMock.done();
        expect(err).to.not.exist();
        expect(org.name).to.equal("bigco");
        expect(org.deleted).to.be.null();
        done();
      });
    });
  });

  describe('get()', function() {
    it('throws if no name is passed', function(done) {

      expect(function() {
        return Org('betty').get();
      }).to.throw("name must be a string");
      done();
    });

    it('returns no teams if the response is a 401 for teams', function(done) {
      var name = 'bigco';

      var orgMocks = nock('https://user-api-example.com')
        .get('/org/' + name)
        .reply(200, {
          'name': 'bigco',
          'description': '',
          'resource': {
            "human_name": "Bob's Big Co"
          },
          'created': '2015-06-19T23:35:42.659Z',
          'updated': '2015-06-19T23:35:42.659Z',
          'deleted': null
        })
        .get('/org/' + name + '/user?per_page=100&page=0')
        .reply(200, {
          'count': 1,
          'items': [fixtures.users.bigcoadmin]
        })
        .get('/org/' + name + '/package?per_page=100&page=0')
        .reply(200, {
          'count': 1,
          'items': [fixtures.packages.fake]
        })
        .get('/org/bigco/team')
        .reply(401);

      Org('betty').get(name, function(err, org) {
        orgMocks.done();
        expect(err).to.be.null();
        expect(org.teams.count).to.equal(0);
        done();
      });
    });

    it('makes requests to get information about and users in the org', function(done) {
      var name = 'bigco';

      var orgMocks = nock('https://user-api-example.com')
        .get('/org/' + name)
        .reply(200, {
          'name': 'bigco',
          'description': '',
          'resource': {
            "human_name": "Bob's Big Co"
          },
          'created': '2015-06-19T23:35:42.659Z',
          'updated': '2015-06-19T23:35:42.659Z',
          'deleted': null
        })
        .get('/org/' + name + '/user?per_page=100&page=0')
        .reply(200, {
          'count': 1,
          'items': [fixtures.users.bigcoadmin]
        })
        .get('/org/' + name + '/package?per_page=100&page=0')
        .reply(200, {
          'count': 1,
          'items': [fixtures.packages.fake]
        })
        .get('/org/bigco/team')
        .reply(200, {
          count: 1,
          items: [
            {
              "created": "2015-08-28T17:44:03.701Z",
              "deleted": null,
              "description": null,
              "name": "developers",
              "scope_id": 55555,
              "updated": "2015-08-28T17:44:03.701Z"
            }
          ]
        });

      Org('betty').get(name, function(err, org) {
        orgMocks.done();
        expect(err).to.be.null();
        expect(org.users.items[0].name).to.equal('bob');
        expect(org.info.name).to.equal('bigco');
        expect(org.info.resource.human_name).to.equal("Bob's Big Co");
        expect(org.packages.items[0].name).to.equal('fake');
        expect(org.deleted).to.be.undefined();
        done();
      });
    });

    it('returns a 404 and an empty org if org is not found', function(done) {
      var name = 'bigco';

      var orgMocks = nock('https://user-api-example.com')
        .get('/org/' + name)
        .reply(404, 'not found')
        .get('/org/' + name + '/user?per_page=100&page=0')
        .reply(404, 'not found')
        .get('/org/' + name + '/package?per_page=100&page=0')
        .reply(404, 'not found')
        .get('/org/' + name + '/team')
        .reply(404, 'not found');

      Org('betty').get(name, function(err, org) {
        orgMocks.done();
        expect(err.statusCode).to.equal(404);
        expect(err.message).to.equal('Org not found');
        expect(org).to.not.exist();
        done();
      });
    });
  });

  describe('update()', function() {
    it('returns an error if a non-org-member attempts to update an org', function(done) {
      var name = 'bigco';

      var data = {
        name: 'bigco',
        description: 'bigco organization',
        resource: {
          human_name: 'BigCo Enterprises'
        }
      };

      var orgMocks = nock('https://user-api-example.com', {
        reqheaders: {
          bearer: 'betty'
        }
      })
        .post('/org/' + name, data)
        .reply(401, "user not found in org");

      Org('betty').update(data, function(err, org) {
        orgMocks.done();
        expect(err).to.exist();
        expect(err.message).to.equal('user is unauthorized to modify this organization');
        expect(err.statusCode).to.equal(401);
        expect(org).to.not.exist();
        done();
      });
    });

    it('returns an error if a non-super-admin tries to update the org', function(done) {
      var name = 'bigco';

      var data = {
        name: 'bigco',
        description: 'bigco organization',
        resource: {
          human_name: 'BigCo Enterprises'
        }
      };

      var orgMocks = nock('https://user-api-example.com', {
        reqheaders: {
          bearer: 'betty'
        }
      })
        .post('/org/' + name, data)
        .reply(401, "user must be admin to perform this operation");

      Org('betty').update(data, function(err, org) {
        orgMocks.done();
        expect(err).to.exist();
        expect(err.message).to.equal('user is unauthorized to modify this organization');
        expect(err.statusCode).to.equal(401);
        expect(org).to.not.exist();
        done();
      });
    });

    it('returns an error if the org does not exist', function(done) {
      var name = 'bigco';

      var data = {
        name: 'bigco',
        description: 'bigco organization',
        resource: {
          human_name: 'BigCo Enterprises'
        }
      };

      var orgMocks = nock('https://user-api-example.com', {
        reqheaders: {
          bearer: 'betty'
        }
      })
        .post('/org/' + name, data)
        .reply(404, "Org not found");

      Org('betty').update(data, function(err, org) {
        orgMocks.done();
        expect(err).to.exist();
        expect(err.message).to.equal('org not found');
        expect(err.statusCode).to.equal(404);
        expect(org).to.not.exist();
        done();
      });
    });

    it('allows us to update description and human-readable name', function(done) {
      var name = 'bigco';

      var data = {
        name: 'bigco',
        description: 'bigco organization',
        resource: {
          human_name: 'BigCo Enterprises'
        }
      };

      var orgMocks = nock('https://user-api-example.com', {
        reqheaders: {
          bearer: 'bob'
        }
      })
        .post('/org/' + name, data)
        .reply(200, {
          name: "bigco",
          description: "bigco organization",
          resource: {
            human_name: "BigCo Enterprises"
          },
          created: "2015-06-19T23:35:42.659Z",
          updated: "2015-07-10T19:59:08.395Z",
          deleted: null
        });

      Org('bob').update(data, function(err, org) {
        orgMocks.done();
        expect(err).to.be.null();
        expect(org.name).to.equal("bigco");
        expect(org.description).to.equal("bigco organization");
        expect(org.resource.human_name).to.equal("BigCo Enterprises");
        done();
      });
    });
  });

  describe('delete()', function() {
    it('throws if no name is passed', function(done) {
      expect(function() {
        return Org('betty').delete();
      }).to.throw('name must be a string');
      done();
    });

    it('returns an error if a non-org-member tries to delete the org', function(done) {
      var name = 'bigco';

      var orgMocks = nock('https://user-api-example.com', {
        reqheaders: {
          bearer: 'betty'
        }
      })
        .delete('/org/' + name)
        .reply(401, 'user not found in org');

      Org('betty').delete(name, function(err, resp) {
        orgMocks.done();
        expect(err.statusCode).to.equal(401);
        expect(err.message).to.equal('user is unauthorized to delete this organization');
        expect(resp).to.be.undefined();
        done();
      });
    });

    it('returns an error if a non-super-admin tries to delete the org', function(done) {
      var name = 'bigco';

      var orgMocks = nock('https://user-api-example.com', {
        reqheaders: {
          bearer: 'betty'
        }
      })
        .delete('/org/' + name)
        .reply(401, 'user must be admin to perform this operation');

      Org('betty').delete(name, function(err, resp) {
        orgMocks.done();
        expect(err.statusCode).to.equal(401);
        expect(err.message).to.equal('user is unauthorized to delete this organization');
        expect(resp).to.be.undefined();
        done();
      });
    });

    it('returns a 404 if the org is not found', function(done) {
      var name = 'bigco';

      var orgMocks = nock('https://user-api-example.com', {
        reqheaders: {
          bearer: 'betty'
        }
      })
        .delete('/org/' + name)
        .reply(404, 'Org not found');

      Org('betty').delete(name, function(err, resp) {
        orgMocks.done();
        expect(err.statusCode).to.equal(404);
        expect(err.message).to.equal('org not found');
        expect(resp).to.be.undefined();
        done();
      });
    });

    it('deletes the org if the bearer is the super-admin', function(done) {
      var name = 'bigco';

      var orgMocks = nock('https://user-api-example.com', {
        reqheaders: {
          bearer: 'bob'
        }
      })
        .delete('/org/' + name)
        .reply(200, {
          name: "bigco",
          description: "",
          resource: {},
          created: "2015-06-19T23:35:42.659Z",
          updated: "2015-07-10T19:59:08.395Z",
          deleted: "2015-07-10T19:59:08.395Z"
        });

      Org('bob').delete(name, function(err, resp) {
        orgMocks.done();
        expect(err).to.be.null();
        expect(resp.deleted).to.be.a.string();
        done();
      });
    });
  });

  describe('get users', function() {
    it('returns all the users of an org', function(done) {
      var name = 'bigco';

      var orgMock = nock('https://user-api-example.com', {
        reqheaders: {
          bearer: 'betty'
        }
      })
        .get('/org/' + name + '/user?per_page=100&page=0')
        .reply(200, {
          "count": 1,
          "items": [fixtures.users.bigcoadmin]
        });

      Org('betty').getUsers(name)
        .catch(function(err) {
          orgMock.done();
          expect(err).to.be.null();
        })
        .then(function(users) {
          expect(users.items).to.be.an.array();
          expect(users.count).to.equal(1);
          expect(users.items[0].name).to.equal('bob');
          expect(users.items[0]).to.not.include('sponsored');
          done();
        });
    });

    it('returns `sponsored` information if requesting user is super-admin', function(done) {
      var name = 'bigco';

      var orgMock = nock('https://user-api-example.com', {
        reqheaders: {
          bearer: 'bob'
        }
      })
        .get('/org/' + name + '/user?per_page=100&page=0')
        .reply(200, {
          "count": 1,
          "items": [fixtures.users.bigcoadminSA]
        });

      Org('bob').getUsers(name)
        .catch(function(err) {
          orgMock.done();
          expect(err).to.be.null();
        })
        .then(function(users) {
          expect(users.items).to.be.an.array();
          expect(users.count).to.equal(1);
          expect(users.items[0].name).to.equal('bob');
          expect(users.items[0]).to.include('sponsored');
          expect(users.items[0].sponsored).to.equal("by-org");
          done();
        });
    });

    it('returns no users if the org does not exist', function(done) {
      var name = 'bigco';

      var orgMocks = nock('https://user-api-example.com')
        .get('/org/' + name + '/user?per_page=100&page=0')
        .reply(404, 'Org not found');

      Org('bob').getUsers(name)
        .catch(function(err) {
          orgMocks.done();
          expect(err).to.exist();
          expect(err.message).to.equal('org not found');
          expect(err.statusCode).to.equal(404);
        })
        .then(function(users) {
          expect(users).to.not.exist();
          done();
        });
    });
  });

  describe('add user', function() {
    it('gets an error if the bearer is not the super-admin', function(done) {
      var name = 'bigco';

      var user = {
        user: 'betty',
        role: 'developer'
      };

      var orgMocks = nock('https://user-api-example.com')
        .put('/org/' + name + '/user', user)
        .reply(401, "user must be admin to perform this operation");

      Org('bob2').addUser(name, user, function(err, user) {
        orgMocks.done();
        expect(err).to.exist();
        expect(err.message).to.equal("bearer is unauthorized to add this user to this organization");
        expect(err.statusCode).to.equal(401);
        expect(user).to.not.exist();
        done();
      });
    });

    it('gets an error if the org does not exist', function(done) {
      var name = 'bigco';

      var user = {
        user: 'betty',
        role: 'developer'
      };

      var orgMocks = nock('https://user-api-example.com')
        .put('/org/' + name + '/user', user)
        .reply(404, "Org not found");

      Org('bob').addUser(name, user, function(err, user) {
        orgMocks.done();
        expect(err).to.exist();
        expect(err.message).to.equal("user not found");
        expect(err.statusCode).to.equal(404);
        expect(user).to.not.exist();
        done();
      });
    });

    it('adds a user if the bearer is the super-admin', function(done) {
      var name = 'bigco';

      var user = {
        user: 'betty',
        role: 'developer'
      };

      var orgMocks = nock('https://user-api-example.com')
        .put('/org/' + name + '/user', user)
        .reply(200, {
          "user_id": 1234,
          "org_id": 123456,
          "role": "developer",
          "created": "2015-07-11T00:01:53.680Z",
          "updated": "2015-07-11T00:01:53.680Z",
          "deleted": null
        });

      Org('bob').addUser(name, user, function(err, user) {
        orgMocks.done();
        expect(err).to.be.null();
        expect(user).to.exist();
        expect(user.role).to.equal(user.role);
        done();
      });
    });
  });

  describe('get teams', function() {
    it('returns all the teams of an org', function(done) {
      var name = 'bigcoOrg';

      var orgMocks = nock('https://user-api-example.com')
        .get('/org/' + name + '/team')
        .reply(200, fixtures.teams.bigcoOrg);

      Org('bob').getTeams(name)
        .then(function(teams) {
          orgMocks.done();
          expect(teams.items).to.be.an.array();
          expect(teams.count).to.equal(1);
          expect(teams.items[0].name).to.equal('developers');
        })
        .catch(function(err) {
          expect(err).to.be(null);
        })
        .finally(function() {
          done();
        });
    });

    it('returns no teams if the org does not exist', function(done) {
      var name = 'bigcoOrg';

      var orgMocks = nock('https://user-api-example.com')
        .get('/org/' + name + '/team')
        .reply(404, 'Org not found');

      Org('bob').getTeams(name)
        .then(function(teams) {
          orgMocks.done();
          expect(teams).to.not.exist();
        })
        .catch(function(err) {
          expect(err).to.exist();
          expect(err.message).to.equal('Org or Team not found');
          expect(err.statusCode).to.equal(404);
        })
        .finally(function() {
          done();
        });
    });
  });

  describe('adding a team', function() {
    it('throws and error if there is no bearer token', function(done) {
      var orgMock = nock('https://user-api-example.com')
        .put('/org/bigco/team', {
          scope: 'bigco',
          name: 'bobteam'
        })
        .reply(401);

      Org('bob').addTeam({
        orgScope: 'bigco',
        teamName: "bobteam"
      }, function(err, team) {
        orgMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('no bearer token included in adding of team bobteam');
        expect(err.statusCode).to.equal(401);
        expect(team).to.be.undefined();
        done();
      });
    });

    it('throws an error if the org is not found', function(done) {
      var orgMock = nock('https://user-api-example.com')
        .put('/org/bigco/team', {
          scope: 'bigco',
          name: 'bobteam'
        })
        .reply(404);

      Org('bob').addTeam({
        orgScope: 'bigco',
        teamName: "bobteam"
      }, function(err, team) {
        orgMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('Org not found');
        expect(err.statusCode).to.equal(404);
        expect(team).to.be.undefined();
        done();
      });

    });

    it('throws an error if the team already exists', function(done) {
      var orgMock = nock('https://user-api-example.com')
        .put('/org/bigco/team', {
          scope: 'bigco',
          name: 'bobteam'
        })
        .reply(409);

      Org('bob').addTeam({
        orgScope: 'bigco',
        teamName: "bobteam"
      }, function(err, team) {
        orgMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('The provided Team\'s name is already in use for this Org');
        expect(err.statusCode).to.equal(409);
        expect(team).to.be.undefined();
        done();
      });

    });

    it('returns team data when properly added', function(done) {
      var orgMock = nock('https://user-api-example.com')
        .put('/org/bigco/team', {
          scope: 'bigco',
          name: 'bobteam'
        })
        .reply(200, {
          "name": "bobteam",
          "scope_id": "bigco",
          "created": "2015-06-19T23:35:42.659Z",
          "updated": "2015-06-19T23:35:42.659Z",
          "deleted": null
        });

      Org('bob').addTeam({
        orgScope: 'bigco',
        teamName: "bobteam"
      }, function(err, team) {
        orgMock.done();
        expect(err).to.not.exist();
        expect(team).to.not.be.undefined();
        expect(team.name).to.equal("bobteam");
        expect(team.scope_id).to.equal("bigco");
        done();
      });
    });
  });

  describe('getPackages', function() {
    it('returns an error when one happens', function(done) {
      var orgMock = nock('https://user-api-example.com')
        .get('/org/bigco/package?per_page=100&page=0')
        .reply(404);

      Org('bob').getPackages('bigco')
        .catch(function(err) {
          expect(err).to.exist();
        })
        .then(function(packages) {
          expect(packages).to.not.exist();
        })
        .finally(function() {
          orgMock.done();
          done();
        });

    });

    it('returns packages when response is good', function(done) {
      var orgMock = nock('https://user-api-example.com')
        .get('/org/bigco/package?per_page=100&page=0')
        .reply(200, {
          count: 1,
          items: [{
            "name": "super-package",
            "private": "false",
            "created": "2015-06-19T23:35:42.659Z",
            "updated": "2015-06-19T23:35:42.659Z",
            "deleted": null
          }]
        });

      Org('bob').getPackages('bigco')
        .then(function(packages) {
          expect(packages).to.exist();
          expect(packages.count).to.equal(1);
          expect(packages.items.length).to.equal(1);
          expect(packages.items[0].name).to.equal("super-package");
        })
        .catch(function(err) {
          expect(err).to.not.exist();
        })
        .finally(function() {
          orgMock.done();
          done();
        });

    });
  });
});