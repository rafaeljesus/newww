var P = require('bluebird');
var Org = require('../agents/org');
var Team = require('../agents/team');
var invalidUserName = require('npm-user-validate').username;

var handleUserError = function(request, reply, redirectUrl, message) {
  return request.saveNotifications([
    P.reject(message)
  ]).then(function(token) {
    var url = redirectUrl;
    var param = token ? "?notice=" + token : "";
    url = url + param;
    return reply.redirect(url);
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
    return handleUserError(request, reply, '/org' + orgName + '/team', "Invalid Team Name.");
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
      return reply.view('team/show');
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
