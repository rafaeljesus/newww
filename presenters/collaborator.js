var avatar = require("../lib/avatar")

module.exports = function(collaborator, packageName) {

  // TODO: figure out a way to create a collaborator
  // deletion form without having to do this:
  if (packageName)
    collaborator.packageName = packageName;

  collaborator.avatar = avatar(collaborator.email)
  collaborator.write = collaborator.permissions === "write"
  return collaborator;
};
