var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  beforeEach = lab.beforeEach,
  afterEach = lab.afterEach,
  it = lab.test,
  expect = Code.expect;

var fixture = require('../fixtures/cms/testPage.json');

var requireInject = require('require-inject');

var nock = require('nock');

process.env.CMS_API = 'http://cms-api/npm/v1/';

var CMS = requireInject('../../agents/cms', {
  redis: require('redis-mock')
});

describe('CMS', function() {
  it('loads a page', function(done) {
    var cmsMock = nock(process.env.CMS_API).get('/pages/test-page').reply(200, fixture);
    CMS.getPage('test-page').then(function(page) {
      expect(page.fetchedAt).to.be.a.number();
      expect(page.fetchedFromCacheAt).to.not.exist();
      cmsMock.done();
      done()
    }, done);
  });

  it('loads a page again', function(done) {
    CMS.getPage('test-page').then(function(page) {
      expect(page.fetchedAt).to.be.a.number();
      expect(page.fetchedFromCacheAt).to.be.a.number();
      done()
    }, done);
  });
});
