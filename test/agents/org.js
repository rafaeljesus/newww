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

describe('Org', function () {
  describe('get()', function () {
    it('throws if no name is passed', function (done) {
      expect(function () { return Org.get(); }).to.throw("name must be a string");
      done();
    });

    it('makes requests to get information about and users in the org', function (done) {
      var name = 'bigco';

      var orgMocks = nock('https://user-api-example.com')
        .get('/org/' + name)
        .reply(200, {'name':'bigco','description':'','resource':{},'created':'2015-06-19T23:35:42.659Z','updated':'2015-06-19T23:35:42.659Z','deleted':null})
        .get('/org/' + name + '/user')
        .reply(200, {'count':1,'items':[fixtures.users.bigcoadmin]});

      Org.get(name, function (err, org) {
        orgMocks.done();
        expect(err).to.be.null();
        expect(org.users[0].name).to.equal('bob');
        expect(org.info.name).to.equal('bigco');
        done();
      });
    });

    it('returns a 404 and an empty org if org is not found', function (done) {
      var name = 'bigco';

      var orgMocks = nock('https://user-api-example.com')
        .get('/org/' + name)
        .reply(404, 'not found')
        .get('/org/' + name + '/user')
        .reply(404, 'not found');

      Org.get(name, function (err, org) {
        orgMocks.done();
        expect(err.statusCode).to.equal(404);
        expect(err.message).to.equal('org not found');
        expect(org).to.be.an.object();
        expect(org).to.be.empty();
        done();
      });
    });
  });
});