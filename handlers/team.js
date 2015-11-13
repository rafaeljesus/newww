var avatar = require("../lib/avatar");
var P = require('bluebird');
var Joi = require('joi');
var Org = require('../agents/org');
var Team = require('../agents/team');
var invalidUserName = require('npm-user-validate').username;
var URL = require('url');

var handleUserError = function(request, reply, redirectUrl, message) {
  return request.saveNotifications([
    P.reject(message)
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
  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }

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
  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }

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
  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }

  var orgName = request.params.org;
  var teamName = request.params.teamName;

  var loggedInUser = request.loggedInUser && request.loggedInUser.name;

  if (invalidUserName(orgName)) {
    return handleUserError(request, reply, '/org', "Invalid Org Name.");
  }

  if (invalidUserName(teamName)) {
    return handleUserError(request, reply, '/org/' + orgName + '/team', "Invalid Team Name.");
  }

  return Team(loggedInUser)
    .get({
      orgScope: orgName,
      teamName: teamName
    })
    .then(function(team) {
      team.packages.items.forEach(function(pkg) {
        if (pkg.permission === 'write') {
          pkg.canWrite = true;
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
    then: Joi.string().required()
  }).when('updateType', {
    is: 'removePackage',
    then: Joi.string().required()
  }).when('updateType', {
    is: 'removeUser',
    then: Joi.string().required()
  }),
  writePermission: Joi.string().when('updateType', {
    is: 'updateWritePermissions',
    then: Joi.string().required()
  }),
  'team-description': Joi.string().when('updateType', {
    is: 'updateInfo',
    then: Joi.string().required()
  }),
  member: Joi.any().when('updateType', {
    is: 'addUsersToTeam',
    then: Joi.any().required()
  }),
  teams: Joi.any().optional()
};

exports.updateTeam = function(request, reply) {
  Joi.validate(request.payload, validPayloadSchema, function(err, validatedPayload) {

    var loggedInUser = request.loggedInUser && request.loggedInUser.name;
    var orgName = request.params.org;
    var teamName = request.params.teamName;
    var tab = '';

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
          return Team(loggedInUser)
            .removeUser({
              scope: orgName,
              id: teamName,
              userName: validatedPayload.name
            });

        case 'updateInfo':
          tab = '#settings';
          return Team(loggedInUser)
            .updateInfo({
              scope: orgName,
              id: teamName,
              description: validatedPayload['team-description']
            });

        case 'addUsersToTeam':
          tab = '#members';

          var members = request.payload.member || [];
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

        default:
          throw new Error('no update method');
      }
    };

    updateMethod(validatedPayload.updateType)
      .then(function() {
        return reply.redirect('/org/' + orgName + '/team/' + teamName + tab);
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

exports.getAddTeamUserPage = function(request, reply) {

  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }


  var loggedInUser = request.loggedInUser && request.loggedInUser.name;


  var orgName = request.params.org;
  var teamName = request.params.teamName;
  var opts = {};


  if (invalidUserName(orgName)) {
    return reply.view('errors/not-found').code(404);
  }

  if (invalidUserName(teamName)) {
    return reply.view('errors/not-found').code(404);
  }

  Org(loggedInUser)
    .get(orgName)
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
        throw err;
      }

      opts.orgScope = orgName;
      opts.orgTeams = org.teams.items;

      return Team(loggedInUser).get({
        orgScope: orgName,
        teamName: teamName
      });
    })
    .then(function(team) {
      opts.team = team;
      return reply.view('team/add-user', opts);
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

exports.showTeamMembers = function(request, reply) {
  return reply(200);
};

exports.getUsers = function(request, reply) {
  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }

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
      return reply({
        error: resp
      })
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
