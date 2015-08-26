var Org = require('../agents/org');
var Customer = require('../models/customer');

exports.getOrg = function(request, reply) {
  if (!request.features.org_billing) {
    return reply.redirect('/');
  }

  var opts = {};
  var loggedInUser = request.loggedInUser && request.loggedInUser.name;
  Org(loggedInUser)
    .get(request.params.org, function(err, org) {
      if (err) {
        request.logger.error(err);

        if (err.statusCode === 404) {
          return reply.view('errors/not-found', err);
        } else {
          return reply.view('errors/internal', err);
        }
      }
      opts.org = org;

      Customer(loggedInUser)
        .getById(request.loggedInUser.email, function(err, cust) {
          if (err) {
            request.logger.error(err);
            return reply.view('errors/internal', err);
          }

          opts.org.customer_id = cust.stripe_customer_id;

          Customer(loggedInUser).getSubscriptions(function(err, subscriptions) {
            if (err) {
              request.logger.error(err);
              return reply.view('errors/internal', err);
            }

            var subscription = subscriptions.filter(function(subscription) {
              return subscription.npm_org === request.params.org;
            });

            if (subscription.length) {
              var licenseId = subscription[0].license_id;
              Customer(loggedInUser)
                .getAllSponsorships(licenseId, function(err, sponsorships) {
                  if (err) {
                    request.logger.error(err);
                    return reply.view('errors/internal', err);
                  }
                  sponsorships = sponsorships || [];
                  var sponsoredUsers = sponsorships.filter(function(sponsorship) {
                    return sponsorship.verified;
                  }).map(function(sponsorship) {
                    return sponsorship.npm_user;
                  });

                  org.users.items = org.users.items.map(function(user) {
                    user.isPaid = subscription[0].npm_user === user.name || sponsoredUsers.indexOf(user.name) > -1;
                    return user;
                  });

                  opts.sponsorships = sponsorships;
                  return reply.view('org/info', opts);
                });
            } else {
              return reply.view('org/info', opts);
            }
          });
        });
    });
};

exports.addUserToOrg = function(request, reply) {
  if (!request.features.org_billing) {
    return reply.redirect('/');
  }

  var orgName = request.params.org;
  var loggedInUser = request.loggedInUser.name;
  var user = {
    user: request.payload.username,
    role: request.payload.role
  };
  var opts = {};

  Org(loggedInUser)
    .addUser(orgName, user, function(err, addedUser) {
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
            return exports.getOrg(request, reply);
          });
        });
      });
    });
};

exports.removeUserFromOrg = function(request, reply) {
  if (!request.features.org_billing) {
    return reply.redirect('/');
  }

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

    request.customer.revokeSponsorship(user.user, licenseId, function(err) {

      if (err) {
        request.logger.error('issue revoking sponsorship for user ', user);
        request.logger.error(err);
        // TODO: make better error page here
        return reply.view('errors/internal', err).code(err.statusCode);
      }

      Org(loggedInUser)
        .removeUser(orgName, user.user, function(err) {
          if (err) {
            request.logger.error(err);
            return reply.view('errors/internal', err).code(err.statusCode);
          }
          return exports.getOrg(request, reply);
        });
    });
  });
};

exports.updateUserPayStatus = function(request, reply) {
  if (!request.features.org_billing) {
    return reply.redirect('/');
  }

  var orgName = request.params.org;
  var loggedInUser = request.loggedInUser && request.loggedInUser.name;
  var payForUser = !!request.payload.payStatus;
  var username = request.payload.username

  request.customer.getLicenseIdForOrg(orgName, function(err, licenseId) {

    if (err) {
      request.logger.error('could not get license ID for ' + orgName);
      request.logger.error(err);
      // TODO: make better error page here
      return reply.view('errors/internal', err).code(404);
    }

    if (payForUser) {
      request.customer.extendSponsorship(licenseId, username, function(err, extendedSponsorship) {
        if (err) {
          if (err.message.indexOf("duplicate key value violates unique constraint") > -1) {
            return exports.getOrg(request, reply);
          }
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

          return exports.getOrg(request, reply);
        });
      });
    } else {
      request.customer.revokeSponsorship(username, licenseId, function(err) {

        if (err) {
          request.logger.error('issue revoking sponsorship for user ', username);
          request.logger.error(err);
          // TODO: make better error page here
          return reply.view('errors/internal', err).code(err.statusCode);
        }

        return exports.getOrg(request, reply);
      });
    }
  });
};

exports.updateOrg = function(request, reply) {
  if (!request.features.org_billing) {
    return reply.redirect('/');
  }

  if (request.payload.updateType === "addUser") {
    exports.addUserToOrg(request, reply);
  } else if (request.payload.updateType === "deleteUser") {
    exports.removeUserFromOrg(request, reply);
  } else if (request.payload.updateType === "updatePayStatus") {
    exports.updateUserPayStatus(request, reply);
  }
};

exports.deleteOrg = function(request, reply) {
  if (!request.features.org_billing) {
    return reply.redirect('/');
  }

  var loggedInUser = request.loggedInUser && request.loggedInUser.name;

  Org(loggedInUser)
    .delete(request.params.org, function(err) {
      if (err) {
        request.logger.error(err);
      }

      return reply.redirect('/org');
    });
};