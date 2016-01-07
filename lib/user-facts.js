var User = require('../models/user');
var P = require('bluebird');

module.exports = {
  getFactsForRequest: function getFactsForRequest(request) {
    return P.try(function() {
      var facts = {};

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
