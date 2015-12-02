var Org = require('../agents/org');
var Team = require('../agents/team');
var User = require('../models/user');
var P = require('bluebird');
var Joi = require('joi');
var invalidUserName = require('npm-user-validate').username;
var URL = require('url');

var resolveTemplateName = function(path) {
  var pathname = URL.parse(path).pathname;
  var pathArr = pathname.split('/');
  var templateType = pathArr[pathArr.length - 1];
  var templateName = "";

  if (templateType === "members") {
    templateName = "org/members";
  } else if (templateType === "teams") {
    templateName = "org/teams";
  } else {
    templateName = "org/show";
  }
  return templateName;
};

exports.getOrg = function(request, reply) {
  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }

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
      opts.org.users.items = org.users.items.map(function(user) {
        user.sponsoredByOrg = user.sponsored === 'by-org';
        return user;
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

      return opts;
    })
    .then(function(opts) {

      if (!opts.perms.isSuperAdmin) {
        return null;
      }

      return request.customer.getById(request.loggedInUser.email)
        .catch(function(err) {
          return Number(err.statusCode) === 404;
        }, function(err) {
          return null;
        });
    })
    .then(function(cust) {
      cust = cust || {};
      opts.customer_id = cust.stripe_customer_id;

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
      return reply.view(templateName, opts);
    })
    .catch(function(err) {
      request.logger.error(err);

      if (err.statusCode === 404) {
        return reply.view('errors/not-found', err).code(404);
      } else if (err.statusCode < 500) {
        return request.saveNotifications([
          P.reject(err.message)
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
  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }

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
      return request.customer.extendSponsorship(license.license_id, user.user);
    })
    .then(function(extendedSponsorship) {
      return request.customer.acceptSponsorship(extendedSponsorship.verification_key)
        .catch(function(err) {
          if (err.statusCode !== 403) {
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
          P.reject(err.message)
        ]).then(function(token) {
          var url = '/org/' + orgName + '/members';
          var param = token ? "?notice=" + token : "";
          url = url + param;
          return reply.redirect(url);
        }).catch(function(err) {
          request.logger.log(err);
        });
      } else {
        return reply.view('errors/internal', err);
      }
    });
};

exports.removeUserFromOrg = function(request, reply) {
  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }

  var orgName = request.params.org;
  var loggedInUser = request.loggedInUser.name;
  var username = request.payload.username;

  return request.customer.getLicenseForOrg(orgName)
    .then(function(license) {
      return request.customer.revokeSponsorship(username, license.license_id);
    })
    .then(function() {
      return Org(loggedInUser)
        .removeUser(orgName, username);
    })
    .then(function() {
      return reply.redirect('/org/' + orgName + '/members');
    })
    .catch(function(err) {
      if (err.statusCode >= 500) {
        request.logger.error(err);
        return reply.view('errors/internal', err);
      } else {
        return request.saveNotifications([
          P.reject(err.message)
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
  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }

  var orgName = request.params.org;
  var payForUser = !!request.payload.payStatus;
  var username = request.payload.username;

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
            if (err.statusCode !== 403) {
              throw err;
            }
          });
      });
  };

  request.customer.getLicenseForOrg(orgName)
    .then(function(license) {
      return payForUser ? extend(license.license_id, username) : request.customer.revokeSponsorship(username, license.license_id);
    })
    .then(function() {
      return reply.redirect('/org/' + orgName + '/members');
    })
    .catch(function(err) {
      if (err.statusCode >= 500) {
        request.logger.error(err);
        return reply.view('errors/internal', err);
      } else {
        return request.saveNotifications([
          P.reject(err.message)
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
  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }

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
    default:
      return request.saveNotifications([
        P.reject("Incorrect updateType passed")
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
      subscription: subscription
    });
  }, function(err) {
    if (err.statusCode == 404) {
      return reply.view('errors/not-found').code(404);
    } else {
      return reply(err)
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
  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }

  var orgToDelete = request.params.org;

  request.customer.getSubscriptions(function(err, subscriptions) {
    if (err) {
      return reply.view('errors/internal', err);
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
        return reply.view('errors/internal', err);
      }

      return reply.redirect('/settings/billing');
    });
  });


};

var orgSubscriptionSchema = {
  "human-name": Joi.string().optional().allow(''),
  orgScope: Joi.string().required()
};

exports.validateOrgCreation = function(request, reply) {
  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }

  var loggedInUser = request.loggedInUser.name;

  Joi.validate(request.query, orgSubscriptionSchema, function(err, planData) {
    var reportScopeInUseError = function(opts) {
      opts = opts || {};
      opts.msg = opts.msg || 'The provided org\'s @scope name is already in use';
      opts.inUseByMe = opts.inUseByMe || false;

      var err = new Error(opts.msg);

      return request.saveNotifications([
        P.reject(err.message)
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
        P.reject(err.message)
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
          P.reject(err.message)
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
            return User.new(request)
              .fetchFromUserACL(planData.orgScope)
              .then(reportScopeInUseError)
              .catch(function(err) {
                if (err.statusCode === 404) {
                  var url = '/org/create/billing?orgScope=' + planData.orgScope + '&human-name=' + planData["human-name"];
                  return reply.redirect(url);
                } else {
                  request.logger.error(err);
                  return reply.view('errors/internal', err);
                }
              });
          } else {
            request.logger.error(err);
            return reply.view('errors/internal', err);
          }
        });
    }
  });
};

exports.getOrgCreationBillingPage = function(request, reply) {
  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }
  var loggedInUser = request.loggedInUser.name;

  var newUser = request.query['new-user'];
  var orgScope = request.query.orgScope;
  var humanName = request.query['human-name'];

  if (invalidUserName(orgScope)) {
    var err = new Error("Org Scope must be a valid entry");
    request.logger.error(err);
    return request.saveNotifications([
      P.reject(err.message)
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
      P.reject(err.message)
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
      P.reject('The provided username\'s @scope name is already in use')
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
          return User.new(request)
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
                return reply.view('errors/internal', err);
              }
            });
        } else {
          request.logger.error(err);
          return reply.view('errors/internal', err);
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
  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }

  if (invalidUserName(request.query.orgScope)) {
    var err = new Error("Org Scope must be a valid entry");
    request.logger.error(err);
    return request.saveNotifications([
      P.reject(err.message)
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

exports.restartOrg = function(request, reply) {
  var opts = {};
  var orgName = request.params.org;

  request.customer.getLicenseForOrg(orgName)
    .then(function(license) {
      opts.oldLicense = license;
      return request.customer.getAllSponsorships(license.license_id);
    })
    .then(function(sponsorships) {
      opts.sponsorships = sponsorships;
      return request.customer.cancelSubscription(opts.oldLicense.id);
    })
    .then(function() {
      var planInfo = {
        "npm_org": orgName,
        "plan": "npm-paid-org-7",
        "quantity": 2
      };
      return request.customer.createSubscription(planInfo);
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
      return reply.redirect('/org/' + orgName);
    })
    .catch(function(err) {
      request.logger.error(err);

      if (err.statusCode < 500) {
        return request.saveNotifications([
          P.reject(err.message)
        ]).then(function(token) {
          var url = '/settings/billing';
          var param = token ? "?notice=" + token : "";
          url = url + param;
          return reply.redirect(url);
        }).catch(function(err) {
          request.logger.log(err);
        });
      } else {
        return reply.view('errors/internal', err);
      }
    });
};
