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

  describe('addUsers', function() {
    it('returns an error if bearer token is incorrect', function(done) {
      var teamMock = nock('https://user-api-example.com')
        .put('/team/bigco/bigteam/user', {
          user: 'littlebob'
        })
        .reply(401);

      Team('bob').addUsers({
        teamName: 'bigteam',
        orgScope: 'bigco',
        users: ['littlebob']
      }, function(err, body) {
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
        orgScope: 'bigco',
        users: ['littlebob']
      }, function(err, body) {
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
        orgScope: 'bigco',
        users: ['littlebob']
      }, function(err, body) {
        teamMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('The provided User is already on this Team');
        done();
      });
    });

  });
});
