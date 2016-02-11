var avatar = require("../lib/avatar");
var P = require('bluebird');
var Joi = require('joi');
var Org = require('../agents/org');
var Team = require('../agents/team');
var User = require('../agents/user');
var invalidUserName = require('npm-user-validate').username;
var validatePackageName = require('validate-npm-package-name');
var URL = require('url');

var handleUserError = function(request, reply, redirectUrl, message) {
  return request.saveNotifications([
    P.reject(new Error(message)),
  ]).then(function(token) {
    var url = URL.parse(redirectUrl);
    var param = token ? "?notice=" + token : "";
    var hash = url.hash ? url.hash : "";
    var redirUrl = url.path + param + hash;
    return reply.redirect(redirUrl);
  }).catch(function(err) {
    request.logger.log(err);
    return reply.view('errors/internal', err);
  });
};

exports.getTeamCreationPage = function(request, reply) {
  var orgName = request.params.org;
  var loggedInUser = request.loggedInUser && request.loggedInUser.name;

  if (invalidUserName(orgName)) {
    return reply.view('errors/not-found').code(404);
  }

  Org(loggedInUser)
    .get(orgName)
    .then(function(org) {
      var currentUserIsAdmin = org.users.items.filter(function(user) {
        return user.role && user.role.match(/admin/);
      }).some(function(admin) {
        return admin.name === loggedInUser;
      });

      if (currentUserIsAdmin) {
        return reply.view('org/add-team', {
          org: request.params.org
        });
      } else {
        return handleUserError(request, reply, '/org/' + orgName, "You do not have access to that page");
      }
    })
    .catch(function(err) {
      request.logger.error(err);

      if (err.statusCode === 404) {
        return reply.view('errors/not-found', err).code(404);
      } else if (err.statusCode < 500) {
        return handleUserError(request, reply, '/org/' + orgName, err.message);
      } else {
        return reply.view('errors/internal', err);
      }
    });
};

exports.addTeamToOrg = function(request, reply) {
  var orgName = request.params.org;
  var loggedInUser = request.loggedInUser && request.loggedInUser.name;

  var teamName = request.payload["team-name"];
  var description = request.payload.description;

  var members = request.payload.member || [];
  members = Array.isArray(members) ? members : [].concat(members);

  if (invalidUserName(orgName)) {
    return handleUserError(request, reply, '/org', "Invalid Org Name.");
  }

  if (invalidUserName(teamName)) {
    return handleUserError(request, reply, '/org/' + orgName + '/team', "Invalid Team Name.");
  }

  return Org(loggedInUser)
    .get(orgName)
    .then(function() {
      return Org(loggedInUser)
        .addTeam({
          orgScope: orgName,
          teamName: teamName,
          description: description
        });
    })
    .then(function() {
      // add members
      return members.length ?
        Team(loggedInUser)
          .addUsers({
            teamName: teamName,
            scope: orgName,
            users: members

          })
        : P.resolve(null);
    })
    .then(function() {
      return reply.redirect('/org/' + orgName + '/team/' + teamName);
    })
    .catch(function(err) {
      request.logger.error(err);
      if (err.statusCode === 404) {
        return reply.view('errors/not-found', err).code(404);
      } else if (err.statusCode < 500) {
        return handleUserError(request, reply, '/org', err.message);
      } else {
        return reply.view('errors/internal', err);
      }
    });

};


exports.showTeam = function(request, reply) {
  var orgName = request.params.org;
  var teamName = request.params.teamName;

  var loggedInUser = request.loggedInUser && request.loggedInUser.name;

  if (invalidUserName(orgName)) {
    return handleUserError(request, reply, '/org', "Invalid Org Name.");
  }

  if (invalidUserName(teamName)) {
    return handleUserError(request, reply, '/org/' + orgName + '/team', "Invalid Team Name.");
  }

  var perms = {};

  return Org(loggedInUser)
    .get(orgName)
    .then(function(org) {

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


      perms = {
        isSuperAdmin: isSuperAdmin,
        isAtLeastTeamAdmin: isAtLeastTeamAdmin,
        isAtLeastMember: isAtLeastMember
      };

      request.logger.info(perms);

      return Team(loggedInUser)
        .get({
          orgScope: orgName,
          teamName: teamName,
          detailed: true
        });

    })
    .then(function(team) {
      team.packages.items.forEach(function(pkg) {
        if (pkg.permissions === 'write') {
          pkg.canWrite = true;
        }

        if (pkg.access === 'restricted') {
          pkg.private = true;
        }
      });

      team.users.items.forEach(function(usr) {
        usr.avatar = avatar(usr.email);
      });

      return reply.view('team/show', {
        teamName: team.name,
        description: team.description,
        orgName: orgName,
        members: team.users,
        packages: team.packages,
        perms: perms,
      });
    })
    .catch(function(err) {
      request.logger.error(err);

      if (err.statusCode === 404) {
        return reply.view('errors/not-found', err).code(404);
      } else if (err.statusCode < 500) {
        return handleUserError(request, reply, '/org/' + orgName, err.message);
      } else {
        return reply.view('errors/internal', err);
      }
    });
};

var validPayloadSchema = {
  updateType: Joi.string().required(),
  name: Joi.string().when('updateType', {
    is: 'updateWritePermissions',
    then: Joi.required()
  }).when('updateType', {
    is: 'removePackage',
    then: Joi.required()
  }).when('updateType', {
    is: 'removeUser',
    then: Joi.required()
  }),
  names: Joi.any().when('updateType', {
    is: 'addPackagesToTeam',
    then: Joi.required()
  }),
  writePermission: Joi.string().when('updateType', {
    is: 'updateWritePermissions',
    then: Joi.allow('on')
  }),
  writePermissions: Joi.object().when('updateType', {
    is: 'addPackagesToTeam',
    then: Joi.required()
  }),
  'team-description': Joi.string().when('updateType', {
    is: 'updateInfo',
    then: Joi.required()
  }),
  member: Joi.any().when('updateType', {
    is: 'addUsersToTeam',
    then: Joi.required()
  }),
  teams: Joi.any().optional(),
  personal: Joi.any().optional()
};

exports.updateTeam = function(request, reply) {
  Joi.validate(request.payload, validPayloadSchema, function(err, validatedPayload) {

    var loggedInUser = request.loggedInUser && request.loggedInUser.name;
    var orgName = request.params.org;
    var teamName = request.params.teamName;
    var tab = '';
    var section = '/team/' + teamName;

    if (err) {
      return handleUserError(request, reply, '/org/' + orgName + '/team/' + teamName, err.message);
    }

    var updateMethod = function(type) {
      switch (type) {
        case 'updateWritePermissions':
          return Team(loggedInUser)
            .addPackage({
              scope: orgName,
              id: teamName,
              package: validatedPayload.name,
              permissions: validatedPayload.writePermission === 'on' ? 'write' : 'read'
            });

        case 'removePackage':
          return Team(loggedInUser)
            .removePackage({
              scope: orgName,
              id: teamName,
              package: validatedPayload.name
            });

        case 'removeUser':
          tab = '#members';
          section += tab;

          return Team(loggedInUser)
            .removeUser({
              scope: orgName,
              id: teamName,
              userName: validatedPayload.name
            });

        case 'removeTeam':
          section = '/teams';

          return Team(loggedInUser)
            .removeTeam({
              id: teamName,
              scope: orgName
            });

        case 'updateInfo':
          tab = '#settings';
          section += tab;

          return Team(loggedInUser)
            .updateInfo({
              scope: orgName,
              id: teamName,
              description: validatedPayload['team-description']
            });

        case 'addUsersToTeam':
          tab = '#members';
          section += tab;

          var members = validatedPayload.member || [];
          members = Array.isArray(members) ? members : [].concat(members);
          members = members.filter(function(member) {
            return !invalidUserName(member);
          });

          return Team(loggedInUser)
            .addUsers({
              teamName: teamName,
              scope: orgName,
              users: members
            });

        case 'addPackagesToTeam':
          var pkgs = validatedPayload.names || [];
          var writePermissions = validatedPayload.writePermissions;

          pkgs = Array.isArray(pkgs) ? pkgs : [].concat(pkgs);

          var packages = pkgs.filter(function(name) {
            return !validatePackageName(name).errors;
          }).map(function(pkg) {
            return {
              name: pkg,
              permissions: writePermissions[pkg] === 'on' ? 'write' : 'read'
            };
          });

          return Team(loggedInUser)
            .addPackages({
              id: teamName,
              scope: orgName,
              packages: packages
            });

        default:
          throw new Error('no update method');
      }
    };

    updateMethod(validatedPayload.updateType)
      .then(function() {
        return reply.redirect('/org/' + orgName + section);
      })
      .catch(function(err) {
        request.logger.error(err);
        if (err.statusCode === 404) {
          return reply.view('errors/not-found', err).code(404);
        } else if (err.statusCode < 500) {
          return handleUserError(request, reply, '/org/' + orgName + '/team/' + teamName + tab, err.message);
        } else {
          return reply.view('errors/internal', err);
        }
      });
  });
};

exports._handleTeamAdditions = function(request, reply, successPage) {
  var loggedInUser = request.loggedInUser && request.loggedInUser.name;

  var opts = {};

  opts.orgScope = request.params.org;
  opts.teamName = request.params.teamName;

  return Org(loggedInUser)
    .get(opts.orgScope)
    .then(function(org) {
      org = org || {};
      var users = org.users || [{
          count: 0,
          items: []
        }];

      var isAtLeastAdmin = users.items.filter(function(user) {
        return user.role.match(/admin/);
      })
        .some(function(user) {
          return user.name === loggedInUser;
        });

      if (!isAtLeastAdmin) {
        var err = new Error("User does not have the appropriate permissions to reach this page");
        err.statusCode = 403;
        return handleUserError(request, reply, '/org/' + opts.orgScope, err.message);
      }

      opts.orgTeams = org.teams.items;

      var teamPackages = Team(loggedInUser)
        .get({
          orgScope: opts.orgScope,
          teamName: opts.teamName
        });

      var personalPackages = User(request.loggedInUser).getOwnedPackages(loggedInUser);

      return P.all([teamPackages, personalPackages])
        .spread(function(team, personal) {
          opts.team = team;
          opts.personal = personal;
          return reply.view(successPage, opts);
        })
        .catch(function(err) {
          request.logger.error(err);

          if (err.statusCode === 404) {
            return reply.view('errors/not-found', err).code(404);
          } else if (err.statusCode < 500) {
            return handleUserError(request, reply, '/org/' + opts.orgScope, err.message);
          } else {
            return reply.view('errors/internal', err);
          }
        });
    });
};

exports.getAddTeamUserPage = function(request, reply) {
  if (invalidUserName(request.params.org)) {
    return reply.view('errors/not-found').code(404);
  }

  if (invalidUserName(request.params.teamName)) {
    return reply.view('errors/not-found').code(404);
  }

  return exports._handleTeamAdditions(request, reply, 'team/add-user');
};

exports.getAddTeamPackagePage = function(request, reply) {
  if (invalidUserName(request.params.org)) {
    return reply.view('errors/not-found').code(404);
  }

  if (invalidUserName(request.params.teamName)) {
    return reply.view('errors/not-found').code(404);
  }

  return exports._handleTeamAdditions(request, reply, 'team/add-package');
};

exports.showTeamMembers = function(request, reply) {
  return reply(200);
};

exports.getUsers = function(request, reply) {
  var loggedInUser = request.loggedInUser && request.loggedInUser.name;
  var orgScope = request.params.org;
  var teamName = request.params.teamName;

  return Team(loggedInUser)
    .getUsers({
      orgScope: orgScope,
      teamName: teamName
    })
    .then(function(users) {
      var resp = JSON.stringify(users);
      return reply(resp)
        .type('application/json');
    })
    .catch(function(err) {
      request.logger.error(err);

      if (err.statusCode === 404) {
        return reply({
          error: "Not Found"
        })
          .code(404)
          .type('application/json');
      } else if (err.statusCode < 500) {
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

exports.getPackages = function(request, reply) {
  var loggedInUser = request.loggedInUser && request.loggedInUser.name;
  var orgScope = request.params.org;
  var teamName = request.params.teamName;

  return Team(loggedInUser)
    .getPackages({
      orgScope: orgScope,
      teamName: teamName
    })
    .then(function(pkgs) {
      var resp = JSON.stringify(pkgs);
      return reply(resp)
        .type('application/json');
    })
    .catch(function(err) {
      request.logger.error(err);

      if (err.statusCode === 404) {
        return reply({
          error: "Not Found"
        })
          .code(404)
          .type('application/json');
      } else if (err.statusCode < 500) {
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
