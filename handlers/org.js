var Org = require('../agents/org');
var Team = require('../agents/team');
var User = require('../models/user');
var P = require('bluebird');
var Joi = require('joi');
var invalidUserName = require('npm-user-validate').username;

exports.getOrgTeams = function(request, reply) {
  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }

  var opts = {};
  var orgName = request.params.org;

  var loggedInUser = request.loggedInUser && request.loggedInUser.name;
  return request.customer.getById(request.loggedInUser.email)
    .then(function(cust) {
      opts.customer_id = cust.stripe_customer_id;
    })
    .then(function() {
      return Org(loggedInUser)
        .get(orgName);
    })
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
        return admin.name === loggedInUser;
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
      var teams = opts.org.teams.items.map(function(team) {
        return Team(loggedInUser).get({
          orgScope: orgName,
          teamName: team.name
        });
      });
      return P.all(teams);
    })
    .then(function(teams) {
      teams = teams || [];
      opts.org.teams = {
        items: teams,
        count: teams.length
      };
      return reply.view('org/teams', opts);
    })
    .catch(function(err) {
      request.logger.error(err);

      if (err.statusCode === 404) {
        return reply.view('errors/not-found', err).code(404);
      } else {
        return reply.view('errors/internal', err);
      }
    });

};

exports.getOrgMembers = function(request, reply) {
  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }

  var opts = {};
  var orgName = request.params.org;

  var loggedInUser = request.loggedInUser && request.loggedInUser.name;
  return request.customer.getById(request.loggedInUser.email)
    .then(function(cust) {
      opts.customer_id = cust.stripe_customer_id;
    })
    .then(function() {
      return Org(loggedInUser)
        .get(orgName);
    })
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
        return admin.name === loggedInUser;
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

      return reply.view('org/members', opts);
    })
    .catch(function(err) {
      request.logger.error(err);

      if (err.statusCode === 404) {
        return reply.view('errors/not-found', err).code(404);
      } else {
        return reply.view('errors/internal', err);
      }
    });

};

exports.getOrg = function(request, reply) {
  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }

  var opts = {};
  var orgName = request.params.org;

  var loggedInUser = request.loggedInUser && request.loggedInUser.name;
  return request.customer.getById(request.loggedInUser.email)
    .then(function(cust) {
      opts.customer_id = cust.stripe_customer_id;
    })
    .then(function() {
      return Org(loggedInUser)
        .get(orgName);
    })
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
        return admin.name === loggedInUser;
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

      return reply.view('org/info', opts);
    })
    .catch(function(err) {
      request.logger.error(err);

      if (err.statusCode === 404) {
        return reply.view('errors/not-found', err).code(404);
      } else {
        return reply.view('errors/internal', err);
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
  var opts = {};

  Org(loggedInUser)
    .addUser(orgName, user)
    .then(function() {
      return request.customer.getLicenseIdForOrg(orgName);
    })
    .then(function(licenseId) {
      return request.customer.extendSponsorship(licenseId, user.user);
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
          var url = '/org/' + orgName;
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
  var user = {
    user: request.payload.username,
    role: request.payload.role
  };
  var opts = {};

  return request.customer.getLicenseIdForOrg(orgName)
    .then(function(licenseId) {
      return request.customer.revokeSponsorship(user.user, licenseId)
    })
    .then(function() {
      return Org(loggedInUser)
        .removeUser(orgName, user.user)
    })
    .then(function() {
      return reply.redirect('/org/' + orgName);
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

  request.customer.getLicenseIdForOrg(orgName)
    .then(function(licenseId) {
      return payForUser ? extend(licenseId, username) : request.customer.revokeSponsorship(username, licenseId);
    })
    .then(function() {
      return exports.getOrg(request, reply);
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

  if (request.payload.updateType === "addUser") {
    exports.addUserToOrg(request, reply);
  } else if (request.payload.updateType === "deleteUser") {
    exports.removeUserFromOrg(request, reply);
  } else if (request.payload.updateType === "updatePayStatus") {
    exports.updateUserPayStatus(request, reply);
  } else if (request.payload.updateType === "deleteOrg") {
    exports.deleteOrg(request, reply);
  }
};

exports.deleteOrg = function(request, reply) {
  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }

  var orgToDelete = request.params.org;
  var loggedInUser = request.loggedInUser && request.loggedInUser.name;

  request.customer.getSubscriptions(function(err, subscriptions) {
    if (err) {
      return replay.view('errors/internal', err);
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

    request.customer.cancelSubscription(subscription.id, function(err, sub) {
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
                  humanName: request.query["human-name"],
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
      humanName: request.query["human-name"],
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