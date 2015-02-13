var avatar = require("../lib/avatar")

module.exports = function(collaborator) {
  collaborator.avatar = avatar(collaborator.email)
  collaborator.write = collaborator.permissions === "write"
  return collaborator;
};
