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

var fixture = require('./fixtures/cms/testPage.json');

var nock = require('nock');

process.env.CMS_API = 'http://cms-api/npm/v1/';

var CMS = require('../lib/cms');

describe('CMS', function() {
  it('loads a page', function(done) {
    var cmsMock = nock(process.env.CMS_API).get('/pages/test-page').reply(200, fixture);
    CMS('test-page').then(function() {
      done()
    }, done);
  });
});
