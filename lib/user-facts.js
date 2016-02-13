var User = require('../agents/user');
var P = require('bluebird');
var geoip = require('geoip-ultralight');

module.exports = {
  getFactsForRequest: function getFactsForRequest(request) {
    return P.try(function() {
      var facts = {};

      if (request.loggedInUser) {
        facts.isRegistered = true;

        var user = new User(request.loggedInUser.credentials);
        facts.hasPublishedPrivatePackage = user.getPackages(request.loggedInUser.name, 0).then(function(packages) {
          return Boolean(packages.items.filter(e => e.access == 'restricted').length);
        });

        facts.isPrivatePackagesOrgsUser = user.getOrgs(request.loggedInUser.name).then(function(orgs) {
          return Boolean(orgs.count);
        });

        facts.hasViewed20PagesThisSession = user.getPagesSeenThisSession(request.loggedInUser).then(function(pages) {
          return pages >= 20;
        });

      }

      facts.userAgentOSisWindows = /windows/i.test(request.headers['user-agent'])

      facts.countryIsUS = geoip.lookupCountry(request.info.remoteAddress) == 'US';

      return P.props(facts);
    }).then(function(facts) {

      if (facts.hasPublishedPrivatePackage) {
        return ['hasPublishedPrivatePackage'];
      } else if (facts.isPrivatePackagesOrgsUser) {
        return ['isPrivatePackagesOrgsUser'];
      } else if (facts.isPrivatePackagesPersonalUser) {
        return ['isPrivatePackagesPersonalUser'];
      } else if (facts.hasViewed20PagesThisSession) {
        return ['hasViewed20PagesThisSession'];
      } else if (facts.isRegistered) {
        return ['isRegistered'];
      } else if (facts.userAgentOSisWindows) {
        return ['userAgentOSisWindows'];
      } else if (facts.countryIsUS) {
        return ['countryIsUS'];
      } else {
        return ['default'];
      }
    });
  }
};
