var P = require('bluebird');
var Org = require('../agents/org');
var invalidUserName = require('npm-user-validate').username;

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
        return request.saveNotifications([
          P.reject("You do not have access to that page")
        ]).then(function(token) {
          var url = '/org/' + orgName;
          var param = token ? "?notice=" + token : "";
          url = url + param;
          return reply.redirect(url);
        }).catch(function(err) {
          request.logger.log(err);
          return reply.view('errors/internal', err);
        });
      }
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

exports.addTeamToOrg = function(request, reply) {
  if (!request.features.org_billing) {
    return reply.redirect('/org');
  }

  var orgName = request.params.org;
  var loggedInUser = request.loggedInUser && request.loggedInUser.name;

  var teamName = request.payload["team-name"];
  var description = request.payload.description;

  var members = request.payload.member;

  if (invalidUserName(orgName)) {
    return request.saveNotifications([
      P.reject("Invalid Team Name.")
    ]).then(function(token) {
      var url = '/org';
      var param = token ? "?notice=" + token : "";
      url = url + param;
      return reply.redirect(url);
    }).catch(function(err) {
      request.logger.log(err);
      return reply.view('errors/internal', err);
    });
  }

  if (invalidUserName(teamName)) {
    return request.saveNotifications([
      P.reject("Invalid Team Name.")
    ]).then(function(token) {
      var url = '/org/' + orgName + '/team';
      var param = token ? "?notice=" + token : "";
      url = url + param;
      return reply.redirect(url);
    }).catch(function(err) {
      request.logger.log(err);
      return reply.view('errors/internal', err);
    });
  }

  Org(loggedInUser)
    .get(orgName)
    .catch(function(err) {
      request.logger.error(err);

      if (err.statusCode === 404) {
        return reply.view('errors/not-found', err).code(404);
      } else {
        return reply.view('errors/internal', err);
      }
    })
    .then(function(org) {
      return Org(loggedInUser)
        .addTeam({
          scope: orgName,
          teamName: teamName,
          description: description
        })
    })
    .catch(function(err) {
      request.logger.error(err);

      if (err.statusCode === 401) {
        return request.saveNotifications([
          P.reject("You do not have access to that")
        ]).then(function(token) {
          var url = '/org';
          var param = token ? "?notice=" + token : "";
          url = url + param;
          return reply.redirect(url);
        }).catch(function(err) {
          request.logger.log(err);
          return reply.view('errors/internal', err);
        });
      } else if (err.statusCode === 404) {
        return reply.view('errors/not-found', err).code(404);
      } else if (err.statusCode === 409) {
        return request.saveNotifications([
          P.reject(err.message)
        ]).then(function(token) {
          var url = '/org/' + orgName + "/team/create";
          var param = token ? "?notice=" + token : "";
          url = url + param;
          return reply.redirect(url);
        }).catch(function(err) {
          request.logger.log(err);
          return reply.view('errors/internal', err);
        });
      } else {
        return reply.view('errors/internal', err);
      }
    })
    .then(function(team) {});

  return reply.view('team/info');
};
