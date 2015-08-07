var Org = require('../agents/org');
var Customer = require('../models/customer');

exports.getOrg = function (request, reply) {
  var opts = {};
  var loggedInUser = request.loggedInUser && request.loggedInUser.name;
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

exports.addUserToOrg = function (request, reply) {
  var orgName = request.params.org;
  var loggedInUser = request.loggedInUser.name;
  var user = {
    user: request.payload.username,
    role: request.payload.role
  };
  var opts = {};

  Org(loggedInUser)
    .addUser(orgName, user, function (err, addedUser) {
      if (err) {
        request.logger.error(err);
        return reply.view('errors/internal', err).code(err.statusCode);
      }
      request.customer.getLicenseIdForOrg(orgName, function(err, licenseId) {
        if (err) {
          request.logger.error(err);
          return reply.view('errors/internal', err).code(404);
        }
        request.customer.extendSponsorship(licenseId, user.user, function(err, extendedSponsorship) {
          if (err) {
            request.logger.error(err);
            return reply.view('errors/internal', err).code(err.statusCode);
          }
          request.customer.acceptSponsorship(extendedSponsorship.verification_key, function(err) {
            if (err) {
              request.logger.error(err);
              if (err.statusCode !== 403) {
                return reply.view('errors/internal', err).code(err.statusCode);
              }
            }
            Org(loggedInUser)
              .get(orgName, function (err, org) {
                if (err) {
                  request.logger.error(err);
                  return reply.view('errors/internal', err);
                }
                opts.org = org;
                return reply.view('org/info', opts);
              });
          });
        });
      });
    });
};

exports.removeUserFromOrg = function (request, reply) {
  var orgName = request.params.org;
  var loggedInUser = request.loggedInUser.name;
  var user = {
    user: request.payload.username,
    role: request.payload.role
  };
  var opts = {};

  request.customer.getLicenseIdForOrg(orgName, function(err, licenseId) {

    if (err) {
      request.logger.error('could not get license ID for ' + orgName);
      request.logger.error(err);
      // TODO: make better error page here
      return reply.view('errors/internal', err).code(404);
    }

    request.customer.revokeSponsorship(user.user, licenseId, function (err) {

      if (err) {
        request.logger.error('issue revoking sponsorship for user ', user);
        request.logger.error(err);
        // TODO: make better error page here
        return reply.view('errors/internal', err).code(err.statusCode);
      }

      Org(loggedInUser)
        .removeUser(orgName, user.user, function (err) {
          if (err) {
            request.logger.error(err);
            return reply.view('errors/internal', err).code(err.statusCode);
          }
          Org(loggedInUser)
            .get(orgName, function (err, org) {
              if (err) { request.logger.error(err); }
              opts.org = org;
              return reply.view('org/info', opts);
            });
        });
    });
  });
};

exports.updateOrg = function (request, reply) {
  if (request.payload.updateType === "addUser") {
    exports.addUserToOrg(request, reply);
  } else if (request.payload.updateType === "deleteUser") {
    exports.removeUserFromOrg(request, reply);
  }
};

exports.deleteOrg = function (request, reply) {
  var loggedInUser = request.loggedInUser && request.loggedInUser.name;

  Org(loggedInUser)
    .delete(request.params.org, function (err) {
      if (err) { request.logger.error(err); }

      return reply.redirect('/org');
    });
};