var nock = require('nock');
var fixtures = require('../fixtures');

var mocks = module.exports = {}

mocks.loggedInUser = function(username) {
  return nock('https://api.npmjs.com')
    .get('/user/'+username).once()
    .reply(200, fixtures.users[username])
    .get('/stripe/'+username).once()
    .reply(200, fixtures.customers.happy);
};

mocks.profile = function(username) {
  return nock("https://user-api-example.com")
    .get('/user/' + username)
    .reply(200, fixtures.users[username])
    .get('/user/'+username+'/package?format=detailed&per_page=9999')
    .reply(200, fixtures.users.packages)
    .get('/user/'+username+'/stars?format=detailed')
    .reply(200, fixtures.users.stars);
};
