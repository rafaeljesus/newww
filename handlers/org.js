var Org = require('../agents/org');
var Customer = require('../models/customer');
var exp = {};


exp.getOrg = function (request, reply) {
  var opts = {};
  var loggedInUser = request.loggedInUser.name;
  Org(loggedInUser)
    .get(request.params.org, function (err, org) {
    if (err) { request.logger.error(err); }
    opts.org = org;

    Customer(loggedInUser)
      .getSubscriptions(function (err, subscriptions) {
        if (err) {
          request.logger.error( err );
          return reply.view('errors/internal', err);
        }
        var requests = [];
        var subscription = subscriptions.filter(function(subscription){
          return subscription.npm_org === request.params.org;
        });
        if (subscription.length) {
          var licenseId = subscription[0].license_id;
          Customer(loggedInUser)
            .getAllSponsorships(licenseId, function (err, sponsorships) {
              opts.sponsorships = sponsorships;
              return reply.view('org/info', opts);
            });
        } else {
          return reply.view('org/info', opts);
        }
      });
  });
};


module.exports = exp;