var nock = require('nock');
var VError = require('verror');
var fixtures = require('../fixtures');

module.exports = function mock() {

  var mocks = [
    nock("https://user-api-example.com")
      .get('/package/-/count')
      .reply(200, 12345)
      .get('/package?sort=modified&count=12')
      .reply(200, fixtures.aggregates.recently_updated_packages)
      .get('/package?sort=dependents&count=12')
      .reply(200, fixtures.aggregates.most_depended_upon_packages),

    nock("https://downloads-api-example.com")
      .get('/point/last-week')
      .reply(200, fixtures.downloads.all.week)
      .get('/point/last-month')
      .reply(200, fixtures.downloads.all.month)
      .get('/point/last-day')
      .reply(200, fixtures.downloads.all.day),

    // Mock npm-explicit-installs requests
    nock("https://skimdb.npmjs.com")
      .get(/.*/).times(12)
      .reply(500, '')
  ];

  return {
    done: function() {
      var errors = [];
      while (mocks.length) {
        try {
          mocks.shift().done();
        } catch (e) {
          errors.push(e);
        }
      }

      if (errors.length) {
        throw new VError(errors[0], "There are %s mock failures, the first is...", errors.length);
      }
    }
  };
};
