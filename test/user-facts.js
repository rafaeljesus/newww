var expect = require('code').expect,
  Lab = require('lab'),
  lab = exports.lab = Lab.script();
var P = require('bluebird');

var requireInject = require('require-inject');

var userFacts = requireInject('../lib/user-facts', {
  '../../agents/user': MockUserClient
});

lab.experiment('user facts', function() {
  lab.test('returns hasPublishedPrivatePackage for a user that has', function(done) {
    userFacts.getFactsForRequest(fakeRequest({
      loggedInUser: {
        name: 'alice'
      }
    })).then(function(facts) {
      expect(facts).to.be.an.array();
      expect(facts[0]).to.equal('hasPublishedPrivatePackage');
      done();
    }).catch(done);
  });

  lab.test('returns isPrivatePackagesOrgsUser for a user that is', function(done) {
    userFacts.getFactsForRequest(fakeRequest({
      loggedInUser: {
        name: 'alice-in-teams'
      }
    })).then(function(facts) {
      expect(facts).to.be.an.array();
      expect(facts[0]).to.equal('isPrivatePackagesOrgsUser');
      done();
    }).catch(done);
  });

  lab.test('returns hasViewed20PagesThisSession for a user that has', function(done) {
    userFacts.getFactsForRequest(fakeRequest({
      loggedInUser: {
        name: 'sally'
      }
    })).then(function(facts) {
      expect(facts).to.be.an.array();
      expect(facts[0]).to.equal('hasViewed20PagesThisSession');
      done();
    });
  });

  lab.test('returns isRegistered for a user that is logged in', function(done) {
    userFacts.getFactsForRequest(fakeRequest({
      loggedInUser: {
        name: 'bob'
      }
    })).then(function(facts) {
      expect(facts).to.be.an.array();
      expect(facts[0]).to.equal('isRegistered');
      done();
    }).catch(done);
  });

  lab.test('returns userAgentOSisWindows for a user with a windows user agent', function(done) {
    userFacts.getFactsForRequest(fakeRequest({
      headers: {
        "user-agent": "Mozilla/5.0 (compatible, MSIE 11, Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko"
      }
    })).then(function(facts) {
      expect(facts).to.be.an.array();
      expect(facts[0]).to.equal('userAgentOSisWindows');
      done();
    }).catch(done);
  });

  lab.test('returns countryIsUS for a user with an ip that geoip says is from the US', function(done) {
    userFacts.getFactsForRequest(fakeRequest({
      info: {
        remoteAddress: '204.10.125.99'
      }
    })).then(function(facts) {
      expect(facts).to.be.an.array();
      expect(facts[0]).to.equal('countryIsUS');
      done();
    }).catch(done);
  });

  lab.test('otherwise returns default', function(done) {
    userFacts.getFactsForRequest(fakeRequest()).then(function(facts) {
      expect(facts).to.be.an.array();
      expect(facts[0]).to.equal('default');
      done();
    }).catch(done);
  });
});

function fakeRequest(obj) {
  return Object.assign({
    headers: {},
    info: {
      remoteAddress: '127.0.0.1'
    }
  }, obj);
}

var emptyAPIResponse = {
  count: 0,
  items: []
};

function MockUserClient() {
}

MockUserClient.prototype = {
  getUser: function(user) {
    throw new Error("not done yet: getUser");
  },
  getPackages: function(user) {
    if (user == 'bob' || user == 'alice-in-teams' || user == 'sally') {
      return P.resolve(emptyAPIResponse)
    } else if (user == 'alice') {
      return P.resolve({
        count: 1,
        items: [{
          name: '@private/package',
          access: 'restricted'
        }]
      });
    } else {
      throw new Error("Unexpected test case");
    }
  },
  getOrgs: function(user) {
    if (user == 'bob' || user == 'alice' || user == 'sally') {
      return P.resolve(emptyAPIResponse)
    } else if (user == 'alice-in-teams') {
      return P.resolve({
        count: 1,
        items: [{
          name: 'private'
        }]
      })
    } else {
      throw new Error("Unexpected test case");
    }
  },
  getPagesSeenThisSession: function(user) {
    if (user.name == 'sally') {
      return P.resolve(21);
    } else {
      return P.resolve(0)
    }
  }
};

