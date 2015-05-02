var nock = require('nock');
var fixtures = require('../fixtures');
var isObject = require('lodash').isObject;

var mocks = module.exports = {};

mocks.loggedInUnpaidUser = function(username) {
  if (isObject(username)){
    username = username.name;
  }

  return nock('https://api.npmjs.com')
    .get('/user/'+username).once()
    .reply(200, fixtures.users[username])
    .get('/stripe/'+username).once()
    .reply(404);
};

mocks.loggedInPaidUser = function(username) {
  if (isObject(username)){
    username = username.name;
  }

  return nock('https://api.npmjs.com')
    .get('/user/'+username).once()
    .reply(200, fixtures.users[username])
    .get('/stripe/'+username).once()
    .reply(200, fixtures.customers.happy);
};

mocks.loggedInPaidUserWithExpiredLicense = function(username) {
  if (isObject(username)){
    username = username.name;
  }

  return nock('https://api.npmjs.com')
    .get('/user/'+username).once()
    .reply(200, fixtures.users[username])
    .get('/stripe/'+username).once()
    .reply(200, fixtures.customers.license_expired);
};

mocks.profile = function(username) {
  if (isObject(username)){
    username = username.name;
  }

  return nock("https://user-api-example.com")
    .get('/user/' + username)
    .reply(200, fixtures.users[username])
    .get('/user/'+username+'/package?format=detailed&per_page=9999')
    .reply(200, fixtures.users.packages)
    .get('/user/'+username+'/stars?format=detailed')
    .reply(200, fixtures.users.stars);
};

mocks.happyCustomer = function(username) {
  if (isObject(username)){
    username = username.name;
  }

  return nock("https://license-api-example.com")
    .get("/stripe/"+username)
    .reply(200, fixtures.customers.happy);
};

mocks.packageWithDependencies = function(name) {
  return nock("https://user-api-example.com")
    .get('/package/'+name).once()
    .reply(200, fixtures.packages[name])
    .get('/package?dependency='+name+'&limit=50').once()
    .reply(200, fixtures.dependents);
};

mocks.scopedPublicPackageWithCollaborators = function() {
  return nock("https://user-api-example.com")
    .get('/package/@wrigley_the_writer%2Fscoped_public')
    .once()
    .reply(200, fixtures.packages.wrigley_scoped_public)
    .get('/package/@wrigley_the_writer%2Fscoped_public/collaborators')
    .once()
    .reply(200, fixtures.collaborators);
};
