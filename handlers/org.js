var Org = require('../agents/org');
var Team = require('../agents/team');
var User = require('../agents/user');
var P = require('bluebird');
var Joi = require('joi');
var invalidUserName = require('npm-user-validate').username;
var _ = require('lodash');
var moment = require('moment');
var validReferrer = require('../lib/referrer-validator');
var URL = require('url');

const STARTING_PRICE_FOR_ORG = process.env.ORG_STARTING_PRICE || 14;

var defaultOrgInfo = function(orgName) {
  return {
    "npm_org": orgName,
    "plan": "npm-paid-org-7",
    "quantity": 2
  };
};

var resolveTemplateName = function(path) {
  var pathname = URL.parse(path).pathname;
  var pathArr = pathname.split('/');
  var templateType = pathArr[pathArr.length - 1];
  var templateName = "";

  if (templateType === "members") {
    templateName = "org/members";
  } else if (templateType === "teams") {
    templateName = "org/teams";
  } else if (templateType === "payment-info") {
    templateName = "org/payment-info";
  } else {
    templateName = "org/show";
  }
  return templateName;
};

exports.getOrg = function(request, reply) {
  var opts = {};
  var orgName = request.params.org;
  var templateName = resolveTemplateName(request.route.path);

  var loggedInUser = request.loggedInUser && request.loggedInUser.name;
  return Org(loggedInUser)
    .get(orgName)
    .then(function(org) {
      org = org || {};
      org.info = org.info || {};

      if (org.info.resource && org.info.resource.human_name) {
        org.info.human_name = org.info.resource.human_name;
      } else {
        org.info.human_name = org.info.name;
      }

      opts.org = org;
      opts.org.users.numSponsored = 0;

      opts.org.users.items.forEach(function(user) {
        user.sponsoredByOrg = user.sponsored === 'by-org';
        if (user.sponsoredByOrg) {
          opts.org.users.numSponsored += 1;
        }
      });

      var isSuperAdmin = org.users.items.filter(function(user) {
        return user.role && user.role.match(/super-admin/);
      }).some(function(admin) {
        var isSA = admin.name === loggedInUser;
        admin.isTheSuperAdmin = isSA;
        return isSA;
      });

      var isAtLeastTeamAdmin = org.users.items.filter(function(user) {
        return user.role && user.role.match(/admin/);
      }).some(function(admin) {
        return admin.name === loggedInUser;
      });

      var isAtLeastMember = org.users.items.filter(function(user) {
        return user.role && (user.role.match(/developer/) || user.role.match(/admin/));
      }).some(function(member) {
        return member.name === loggedInUser;
      });

      opts.perms = {
        isSuperAdmin: isSuperAdmin,
        isAtLeastTeamAdmin: isAtLeastTeamAdmin,
        isAtLeastMember: isAtLeastMember
      };

      if (!opts.perms.isSuperAdmin && templateName.match(/payment-info/)) {
        var err = new Error("You are not authorized to access this page");
        err.statusCode = 403;
        throw err;
      }

      return opts;
    })
    .then(function(opts) {

      if (!opts.perms.isSuperAdmin) {
        return null;
      }

      var stripeDataErrorHandler = function(err) {
        if (err.statusCode === 404) {
          return null;
        } else {
          throw err;
        }
      };

      var getStripeData = request.customer.getStripeData()
        .catch(stripeDataErrorHandler);

      var getCustomerById = request.customer.getById(request.loggedInUser.email)
        .catch(stripeDataErrorHandler);

      return P.join(getStripeData, getCustomerById, function(stripeData, customer) {
        return _.extend(stripeData, customer);
      });
    })
    .then(function(cust) {
      cust = cust || {};
      opts.customer = cust;

      if (templateName.match(/teams/)) {
        var teams = opts.org.teams.items.map(function(team) {
          return Team(loggedInUser).get({
            orgScope: orgName,
            teamName: team.name
          });
        });

        return P.all(teams);
      } else {
        return P.resolve(null);
      }
    })
    .then(function(teams) {
      if (teams && typeof teams.length !== "undefined") {
        var orgTeams = {
          count: teams.length,
          items: teams
        };
        opts.org.teams = orgTeams;
      }

      return request.customer.getLicenseForOrg(orgName)
        .catch(function(err) {
          if (err.statusCode === 404) {
            return P.resolve(null);
          } else {
            throw err;
          }
        });

    })
    .then(function(license) {
      var amount = 0,
        quantity = 0;
      if (license && license.length) {
        license = license[0];
        opts.org.next_billing_date = moment.unix(license.current_period_end);
        opts.org.canceled = !!license.cancel_at_period_end;

        amount = license.amount;
        quantity = opts.org.users.numSponsored;

      } else {
        opts.org.canceled = true;
      }

      opts.org.price = Math.max((amount * quantity) / 100, STARTING_PRICE_FOR_ORG);


      opts.perms.isPaidSuperAdmin = opts.perms.isSuperAdmin && opts.customer && opts.customer.stripe_customer_id;

      return reply.view(templateName, opts);
    })
    .catch(function(err) {
      request.logger.error(err);

      if (err.statusCode === 404) {
        return reply.view('errors/not-found', err).code(404);
      } else if (err.statusCode < 500) {
        return request.saveNotifications([
          P.reject(err),
        ]).then(function(token) {
          var url = '/org/' + orgName;
          var param = token ? "?notice=" + token : "";
          url = url + param;
          return reply.redirect(url);
        }).catch(function(err) {
          request.logger.log(err);
        });
      } else {
        return reply(err);
      }
    });

};

exports.addUserToOrg = function(request, reply) {
  var orgName = request.params.org;
  var loggedInUser = request.loggedInUser.name;
  var user = {
    user: request.payload.username,
    role: request.payload.role
  };

  Org(loggedInUser)
    .addUser(orgName, user)
    .then(function() {
      return request.customer.getLicenseForOrg(orgName);
    })
    .then(function(license) {
      if (license && license.length) {
        license = license[0];
      } else {
        var err = new Error("No license for org " + orgName + " found");
        err.statusCode = 404;
        throw err;
      }
      return request.customer.extendSponsorship(license.license_id, user.user);
    })
    .then(function(extendedSponsorship) {
      return request.customer.acceptSponsorship(extendedSponsorship.verification_key)
        .catch(function(err) {
          if (err.statusCode !== 409) {
            throw err;
          }
        });
    })
    .then(function() {
      return reply.redirect('/org/' + orgName + '/members');
    })
    .catch(function(err) {
      request.logger.error(err);

      if (err.statusCode < 500) {
        return request.saveNotifications([
          P.reject(err),
        ]).then(function(token) {
          var url = '/org/' + orgName + '/members';
          var param = token ? "?notice=" + token : "";
          url = url + param;
          return reply.redirect(url);
        }).catch(function(err) {
          request.logger.log(err);
        });
      } else {
        return reply(err);
      }
    });
};

exports.removeUserFromOrg = function(request, reply) {
  var orgName = request.params.org;
  var loggedInUser = request.loggedInUser.name;
  var username = request.payload.username;

  return Org(loggedInUser)
    .removeUser(orgName, username)
    .then(function() {
      return request.customer.getLicenseForOrg(orgName);
    })
    .then(function(license) {
      if (license && license.length) {
        license = license[0];
      } else {
        var err = new Error("No license for org " + orgName + " found");
        err.statusCode = 404;
        throw err;
      }
      return request.customer.revokeSponsorship(username, license.license_id);
    })
    .then(function() {
      return reply.redirect('/org/' + orgName + '/members');
    })
    .catch(function(err) {
      if (err.statusCode >= 500) {
        request.logger.error(err);
        return reply(err);
      } else {
        return request.saveNotifications([
          P.reject(err),
        ]).then(function(token) {
          var url = '/org/' + orgName;
          var param = token ? "?notice=" + token : "";
          url = url + param;
          return reply.redirect(url);
        }).catch(function(err) {
          request.logger.error(err);
        });
      }
    });

};

exports.updateUserPayStatus = function(request, reply) {
  var orgName = request.params.org;
  var payForUser = !!request.payload.payStatus;
  var username = request.payload.username;
  var loggedInUser = request.loggedInUser && request.loggedInUser.name;

  var extend = function(licenseId, username) {
    return request.customer.extendSponsorship(licenseId, username)
      .catch(function(err) {
        if (err.statusCode !== 409) {
          throw err;
        }
      })
      .then(function(extendedSponsorship) {
        return request.customer.acceptSponsorship(extendedSponsorship.verification_key)
          .catch(function(err) {
            if (err.statusCode !== 409) {
              throw err;
            }
          });
      });
  };

  return P.join(Org(loggedInUser).getInfo(orgName),
    request.customer.getLicenseForOrg(orgName),
    function(orgInfo, license) {
      if (license && license.length) {
        license = license[0];
      } else {
        var err = new Error("No license for org " + orgName + " found");
        err.statusCode = 404;
        throw err;
      }
      return payForUser ? extend(license.license_id, username) : request.customer.revokeSponsorship(username, license.license_id);
    })
    .then(function() {
      return reply.redirect('/org/' + orgName + '/members');
    })
    .catch(function(err) {
      if (err.statusCode >= 500) {
        request.logger.error(err);
        return reply(err);
      } else {
        return request.saveNotifications([
          P.reject(err),
        ]).then(function(token) {
          var url = '/org/' + orgName;
          var param = token ? "?notice=" + token : "";
          url = url + param;
          return reply.redirect(url);
        }).catch(function(err) {
          request.logger.error(err);
        });
      }
    });


};

exports.updateOrg = function(request, reply) {
  switch (request.payload.updateType) {
    case 'addUser':
      return exports.addUserToOrg(request, reply);
    case 'deleteUser':
      return exports.removeUserFromOrg(request, reply);
    case 'updatePayStatus':
      return exports.updateUserPayStatus(request, reply);
    case 'deleteOrg':
      return exports.deleteOrg(request, reply);
    case 'restartOrg':
      return exports.restartOrg(request, reply);
    case 'restartUnlicensedOrg':
      return exports.restartUnlicensedOrg(request, reply);
    default:
      return request.saveNotifications([
        P.reject(new Error("Incorrect updateType passed")),
      ]).then(function(token) {
        var url = request.info.referrer || '/org/' + request.params.org;
        var param = token ? "?notice=" + token : "";
        url += param;
        return reply.redirect(url);
      }).catch(function(err) {
        request.logger.error(err);
      });
  }

};

exports.deleteOrgConfirm = function(request, reply) {
  request.customer.getSubscriptions().then(selectSubscription).then(function(subscription) {
    return reply.view('user/billing-confirm-cancel', {
      subscription: subscription,
      referrer: validReferrer("/settings/billing", request.info.referrer)
    });
  }, function(err) {
    if (err.statusCode == 404) {
      return reply.view('errors/not-found').code(404);
    } else {
      return reply(err);
    }
  });

  function selectSubscription(subscriptions) {
    var sub = subscriptions.filter(function(e) {
      return e.npm_org == request.params.npm_org
    })[0];

    if (sub) {
      return sub;
    } else {
      var err = new Error("Subscription not found");
      err.statusCode = 404;
      throw err;
    }
  }
};

exports.deleteOrg = function(request, reply) {
  var orgToDelete = request.params.org;

  if (invalidUserName(orgToDelete)) {
    var err = new Error("Org Scope must be valid name");
    return request.saveNotifications([
      P.reject(err),
    ]).then(function(token) {
      var url = '/settings/billing';
      var param = token ? "?notice=" + token : "";
      url = url + param;
      return reply.redirect(url);
    }).catch(function(err) {
      request.logger.error(err);
    });
  }


  request.customer.getSubscriptions(function(err, subscriptions) {
    if (err) {
      return reply(err);
    }
    var subscription = subscriptions.filter(function(sub) {
      return orgToDelete === sub.npm_org;
    });

    if (subscription.length) {
      subscription = subscription[0];
    } else {
      request.logger.error("Org not in subscriptions");
      return reply.redirect('/settings/billing');
    }

    request.customer.cancelSubscription(subscription.id, function(err) {
      if (err) {
        request.logger.error(err);
        return reply(err);
      }

      var message = "You will no longer be billed for @" + orgToDelete + ".";
      var redirectUrl = '/settings/billing';
      return request.saveNotifications([
        P.resolve(message)
      ]).then(function(token) {
        var param = token ? "?notice=" + token : "";
        redirectUrl = redirectUrl + param;
        return reply.redirect(redirectUrl);
      }).catch(function(err) {
        request.logger.error(err);
        return reply.redirect(redirectUrl);
      });
    });
  });


};

var orgSubscriptionSchema = {
  "human-name": Joi.string().optional().allow(''),
  orgScope: Joi.string().required()
};

exports.validateOrgCreation = function(request, reply) {
  var loggedInUser = request.loggedInUser.name;

  Joi.validate(request.query, orgSubscriptionSchema, function(err, planData) {
    var reportScopeInUseError = function(opts) {
      opts = opts || {};
      opts.msg = opts.msg || 'The provided org\'s @scope name is already in use';
      opts.inUseByMe = opts.inUseByMe || false;

      var err = new Error(opts.msg);

      return request.saveNotifications([
        P.reject(err),
      ]).then(function(token) {
        var url = '/org/create';
        var param = token ? "?notice=" + token : "";
        param += "&inUseError=true";
        param += opts.inUseByMe ? "&inUseByMe=" + !!opts.inUseByMe : "";
        param += planData.orgScope ? "&orgScope=" + planData.orgScope : "";
        param += planData["human-name"] ? "&human-name=" + planData["human-name"] : "";

        url = url + param;
        return reply.redirect(url);
      }).catch(function(err) {
        request.logger.error(err);
      });
    };

    if (err) {
      return request.saveNotifications([
        P.reject(err),
      ]).then(function(token) {
        var url = '/org/create';
        var param = token ? "?notice=" + token : "";

        url = url + param;
        return reply.redirect(url);
      }).catch(function(err) {
        request.logger.error(err);
      });

    } else {
      if (invalidUserName(planData.orgScope)) {
        var err = new Error("Org Scope must be valid name");
        return request.saveNotifications([
          P.reject(err),
        ]).then(function(token) {
          var url = '/org/create';
          var param = token ? "?notice=" + token : "";

          url = url + param;
          return reply.redirect(url);
        }).catch(function(err) {
          request.logger.error(err);
        });
      }

      if (planData.orgScope === loggedInUser) {
        return reportScopeInUseError({
          inUseByMe: true,
          msg: 'The provided org\'s @scope name is already in use by your username'
        });
      }

      Org(loggedInUser)
        .get(planData.orgScope)
        .then(reportScopeInUseError)
        .catch(function(err) {
          if (err.statusCode === 404) {
            return new User(request.loggedInUser)
              .fetchFromUserACL(planData.orgScope)
              .then(reportScopeInUseError)
              .catch(function(err) {
                if (err.statusCode === 404) {
                  var url = '/org/create/billing?orgScope=' + planData.orgScope + '&human-name=' + planData["human-name"];
                  return reply.redirect(url);
                } else {
                  request.logger.error(err);
                  return reply(err);
                }
              });
          } else {
            request.logger.error(err);
            return reply(err);
          }
        });
    }
  });
};

exports.getOrgCreationBillingPage = function(request, reply) {
  var loggedInUser = request.loggedInUser.name;

  var newUser = request.query['new-user'];
  var orgScope = request.query.orgScope;
  var humanName = request.query['human-name'];

  if (invalidUserName(orgScope)) {
    var err = new Error("Org Scope must be a valid entry");
    request.logger.error(err);
    return request.saveNotifications([
      P.reject(err),
    ]).then(function(token) {
      var url = '/org/create';
      var param = token ? "?notice=" + token : "";
      url = url + param;
      return reply.redirect(url);
    }).catch(function(err) {
      request.logger.error(err);
    });
  }

  if (newUser && invalidUserName(newUser)) {
    var err = new Error("User name must be valid");
    request.logger.error(err);
    return request.saveNotifications([
      P.reject(err),
    ]).then(function(token) {
      var url = '/org/transfer-user-name';
      var param = token ? "?notice=" + token : "";
      param = param + "&orgScope=" + orgScope;
      url = url + param;
      return reply.redirect(url);
    }).catch(function(err) {
      request.logger.error(err);
    });
  }

  var reportScopeInUseError = function() {
    return request.saveNotifications([
      P.reject(new Error('The provided username\'s @scope name is already in use')),
    ]).then(function(token) {
      var url = '/org/transfer-user-name';
      var param = token ? "?notice=" + token : "";
      param += orgScope ? "&orgScope=" + orgScope : "";
      param += humanName ? "&human-name=" + humanName : "";

      url = url + param;
      return reply.redirect(url);
    }).catch(function(err) {
      return request.logger.error(err);
    });
  };

  if (newUser) {
    Org(loggedInUser)
      .get(newUser)
      .then(reportScopeInUseError)
      .catch(function(err) {
        if (err.statusCode === 404) {
          return new User(request.loggedInUser)
            .fetchFromUserACL(newUser)
            .then(reportScopeInUseError)
            .catch(function(err) {
              if (err.statusCode === 404) {
                return reply.view('org/billing', {
                  humanName: humanName,
                  orgScope: orgScope,
                  newUser: newUser,
                  stripePublicKey: process.env.STRIPE_PUBLIC_KEY
                });
              } else {
                request.logger.error(err);
                return reply(err);
              }
            });
        } else {
          request.logger.error(err);
          return reply(err);
        }
      });
  } else {
    return reply.view('org/billing', {
      humanName: humanName,
      orgScope: orgScope,
      stripePublicKey: process.env.STRIPE_PUBLIC_KEY
    });
  }


};

exports.getTransferPage = function(request, reply) {
  if (invalidUserName(request.query.orgScope)) {
    var err = new Error("Org Scope must be a valid entry");
    request.logger.error(err);
    return request.saveNotifications([
      P.reject(err),
    ]).then(function(token) {
      var url = '/org/create';
      var param = token ? "?notice=" + token : "";
      url = url + param;
      return reply.redirect(url);
    }).catch(function(err) {
      request.logger.error(err);
    });
  }
  return reply.view('org/transfer', {
    humanName: request.query["human-name"],
    orgScope: request.query.orgScope
  });
};

exports.redirectToOrg = function redirectToOrg(request, reply) {
  if (request.query.hasOwnProperty('join-beta')) {
    return reply.redirect("/org?join-beta").code(301);
  }

  var orgName = request.params.org || '';

  if (invalidUserName(orgName)) {
    return reply.view('errors/not-found').code(404);
  }

  var urlAppend = orgName ? '/' + orgName : '';

  return reply.redirect("/org" + urlAppend).code(301);
};

exports.getUser = function getUser(request, reply) {

  var loggedInUser = request.loggedInUser && request.loggedInUser.name;
  var orgName = request.params.org;

  var username = request.query.member;

  if (invalidUserName(orgName)) {
    return reply({
      error: "Org not found"
    })
      .code(404)
      .type('application/json');
  }

  if (invalidUserName(username)) {
    return reply({
      error: "User not found"
    })
      .code(404)
      .type('application/json');
  }

  return Org(loggedInUser)
    .getUsers(orgName)
    .then(function(members) {
      members = members || {};
      var items = members.items || [];
      var userInOrg = items.some(function(member) {
        return username === member.name;
      });

      if (userInOrg) {
        return reply({
          user: username
        })
          .type('application/json')
          .code(200);
      } else {
        var err = new Error("User not found");
        err.statusCode = 404;
        throw err;
      }

    })
    .catch(function(err) {
      request.logger.error(err);

      if (err.statusCode < 500) {
        return reply({
          error: err.message
        })
          .code(err.statusCode)
          .type('application/json');
      } else {
        return reply({
          error: "Internal Error"
        })
          .code(err.statusCode)
          .type('application/json');
      }

    });
};

exports.restartSubscription = function(request, reply) {
  var orgName = request.params.org;
  var loggedInUser = request.loggedInUser && request.loggedInUser.name;

  if (invalidUserName(orgName)) {
    var err = new Error("Org Scope must be valid name");
    return request.saveNotifications([
      P.reject(err),
    ]).then(function(token) {
      var url = '/org/' + orgName;
      var param = token ? "?notice=" + token : "";

      url = url + param;
      return reply.redirect(url);
    }).catch(function(err) {
      request.logger.error(err);
    });
  }

  return request.customer.getLicenseForOrg(orgName)
    .then(function(license) {
      if (license && license.length) {
        throw Object.assign(new Error("License exists"), {
          code: 'EEXIST',
          statusCode: 409,
          what: 'license'
        });
      } else {
        // getLicenseForOrg's API call returns a 404 (ENOCUSTOMER) if the customer
        // does not exist, but returns OK:[] if the customer exists but the license does not
        throw Object.assign(new Error("Customer exists"), {
          code: 'EEXIST',
          statusCode: 409,
          what: 'org'
        });
      }

    })
    .catch(function(err) {
      if (err.code !== 'ENOCUSTOMER') {
        throw err;
      } else {
        return Org(loggedInUser).getUsers(orgName)
          .then(function(users) {
            users = users || {};
            users.items = users.items || [];

            var isSuperAdmin = users.items.filter(function(user) {
              return user.role && user.role.match(/super-admin/);
            }).some(function(admin) {
              return admin.name === loggedInUser;
            });

            if (!isSuperAdmin) {
              throw Object.assign(new Error(loggedInUser + ' does not have permission to view this page'), {
                code: 'EACCES',
                statusCode: 403
              });
            }

            return reply.view('org/restart-subscription', {
              stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
              orgName: orgName,
              referrer: validReferrer("/settings/billing", request.info.referrer)
            });
          });
      }
    })
    .catch(function(err) {
      request.logger.error(err);

      if (err.statusCode === 404) {
        return reply.view('errors/not-found', err).code(404);
      }

      if (err.statusCode < 500) {
        return request.saveNotifications([
          P.reject(err),
        ]).then(function(token) {
          var url = '/settings/billing';
          var param = token ? "?notice=" + token : "";
          url = url + param;
          return reply.redirect(url);
        }).catch(function(err) {
          request.logger.log(err);
        });
      } else {
        return reply(err);
      }
    });

};

exports.restartLicense = function(request, reply) {
  var opts = {};
  var orgName = request.params.org;
  var loggedInUser = request.loggedInUser && request.loggedInUser.name;

  return P.join(Org(loggedInUser).getUsers(orgName),
    request.customer.getLicenseForOrg(orgName),
    function(users, license) {
      var err;
      if (license && license.length) {
        err = new Error('The license for ' + orgName + ' already exists.');
        err.statusCode = 400;
        throw err;
      }

      users = users || {};
      users.items = users.items || [];

      var isSuperAdmin = users.items.filter(function(user) {
        return user.role && user.role.match(/super-admin/);
      }).some(function(admin) {
        return admin.name === loggedInUser;
      });

      if (!isSuperAdmin) {
        err = new Error(loggedInUser + ' does not have permission to view this page');
        err.statusCode = 403;
        throw err;
      }

      opts.orgName = orgName;
      opts.referrer = validReferrer("/settings/billing", request.info.referrer);

      return reply.view('org/restart-license', opts);
    })
    .catch(function(err) {
      request.logger.error(err);

      if (err.statusCode < 500) {
        return request.saveNotifications([
          P.reject(err),
        ]).then(function(token) {
          var url = '/settings/billing';
          var param = token ? "?notice=" + token : "";
          url = url + param;
          return reply.redirect(url);
        }).catch(function(err) {
          request.logger.log(err);
        });
      } else {
        return reply(err);
      }
    });
};

exports.restartUnlicensedOrg = function(request, reply) {

  var loggedInUser = request.loggedInUser && request.loggedInUser.name;
  var orgName = request.params.org;
  var opts = {};

  return P.join(Org(loggedInUser).getUsers(orgName),
    request.customer.getLicenseForOrg(orgName),
    function(users, license) {

      if (license && license.length) {
        err = new Error('The license for ' + orgName + ' already exists.');
        err.statusCode = 400;
        throw err;
      }

      users = users || {};
      users.items = users.items || [];

      opts.users = users;

      var isSuperAdmin = users.items.filter(function(user) {
        return user.role && user.role.match(/super-admin/);
      }).some(function(admin) {
        return admin.name === loggedInUser;
      });

      if (!isSuperAdmin) {
        var err = new Error(loggedInUser + ' does not have permission to restart this organization');
        err.statusCode = 403;
        throw err;
      }

      return request.customer.createSubscription(defaultOrgInfo(orgName));
    })
    .then(function(license) {

      license = license || {};

      var users = opts.users.items;
      var extensions = users.map(function(user) {
        return request.customer.extendSponsorship(license.license_id, user.name);
      });
      return P.all(extensions);
    })
    .then(function(sponsorships) {
      var acceptances = sponsorships.map(function(sponsorship) {
        return request.customer.acceptSponsorship(sponsorship.verification_key);
      });
      return P.all(acceptances)
        .catch(function(err) {
          if (err.statusCode !== 409) {
            throw err;
          }
        });
    })
    .then(function() {
      var redirectUrl = "/org/" + orgName;
      var message = "You have successfully restarted " + orgName;

      return request.saveNotifications([
        P.resolve(message)
      ]).then(function(token) {
        var param = token ? "?notice=" + token : "";
        redirectUrl = redirectUrl + param;
        return reply.redirect(redirectUrl);
      }).catch(function(err) {
        request.logger.log(err);
        return reply.redirect(redirectUrl);
      });
    })
    .catch(function(err) {
      request.logger.error(err);

      if (err.statusCode < 500) {
        return request.saveNotifications([
          P.reject(err),
        ]).then(function(token) {
          var url = '/settings/billing';
          var param = token ? "?notice=" + token : "";
          url = url + param;
          return reply.redirect(url);
        }).catch(function(err) {
          request.logger.log(err);
        });
      } else {
        return reply(err);
      }
    });
};

exports.restartOrg = function(request, reply) {
  var opts = {};
  var orgName = request.params.org;
  var loggedInUser = request.loggedInUser && request.loggedInUser.name;

  return P.join(Org(loggedInUser).getInfo(orgName),
    request.customer.getLicenseForOrg(orgName),
    function(orgInfo, license) {
      if (license && license.length) {
        license = license[0];
      } else {
        throw Object.assign(new Error('license not found'), {
          code: 'ENOLICENSE'
        });
      }
      opts.oldLicense = license;
      return request.customer.getAllSponsorships(license.license_id);
    })
    .then(function(sponsorships) {
      opts.sponsorships = sponsorships;
      return request.customer.cancelSubscription(opts.oldLicense.id);
    })
    .then(function() {
      return request.customer.createSubscription(defaultOrgInfo(orgName));
    })
    .then(function(subscription) {
      var newSponsorships = opts.sponsorships.filter(function(sponsorship) {
        return sponsorship.verified;
      })
        .map(function(sponsorship) {
          return request.customer.swapSponsorship(sponsorship.npm_user, opts.oldLicense.license_id, subscription.license_id);
        });
      return P.all(newSponsorships);
    })
    .then(function() {
      var redirectUrl = "/org/" + orgName;
      var message = "You have successfully restarted payment for " + orgName;

      return request.saveNotifications([
        P.resolve(message)
      ]).then(function(token) {
        var param = token ? "?notice=" + token : "";
        redirectUrl = redirectUrl + param;
        return reply.redirect(redirectUrl);
      }).catch(function(err) {
        request.logger.log(err);
        return reply.redirect(redirectUrl);
      });

    })
    .catch(function(err) {
      request.logger.error(err);

      if (err.code === 'ENOLICENSE') {
        return reply.redirect("/org/" + orgName + "/restart-license");
      }

      if (err.code === 'ENOCUSTOMER') {
        return reply.redirect("/org/" + orgName + "/restart");
      }

      if (err.statusCode < 500) {
        return request.saveNotifications([
          P.reject(err),
        ]).then(function(token) {
          var url = '/settings/billing';
          var param = token ? "?notice=" + token : "";
          url = url + param;
          return reply.redirect(url);
        }).catch(function(err) {
          request.logger.log(err);
        });
      } else {
        return reply(err);
      }
    });
};
