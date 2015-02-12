var avatar = require("../lib/avatar")

module.exports = function(collaborator) {
  collaborator.avatar = avatar(collaborator.email)
  return collaborator;
};
