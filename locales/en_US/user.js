module.exports = {
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
  },

  login: {
    title: "login",
    subtitle: "you look lovely today, btw.",
    error: {
      missing: "Missing username or password",
      invalid: "Invalid username or password",
      invalidContext: "If you feel that this is a mistake, please <a href='/contact'>contact us</a> with the following unique error ID:"
    },
    form: {
      name: "username",
      password: "password",
      forgot: "forgot your password?",
      signup: "create an account",
      submit: "login"
    }
  }
};

