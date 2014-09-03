var Hoek = require('hoek');

var en = {
  signup: {
    title: "create an account",
    subtitle: "sign all the way up",
    error: "There was a problem! The server said:",
    form: {
      name: "username",
      nameHelp: "Must be all lower-case, and not have any non-urlsafe chars",
      password: "password",
      verify: "verify password",
      email: "email address",
      emailHelp: "This <strong>will</strong> be public and shown on all the packages you publish. Accounts with invalid emails may be deleted without notice.",
      submit: "make it so"
    }
  }
};

module.exports = function t (path) {
  return Hoek.reach(en, path);
};
