module.exports = {
  signup: {
    title: "Create an Account",
    subtitle: "Sign all the way up",
    error: "There was a problem! The server said:",
    form: {
      username: "Username",
      nameHelp: "Must be all lower-case, and not have any non-urlsafe chars",
      password: "Password",
      verify: "Verify Password",
      email: "Email Address",
      emailHelp: "This <strong>will</strong> be public and shown on all the packages you publish. Accounts with invalid emails may be deleted without notice.",
      submit: "Make it so"
    }
  },

  login: {
    title: "Login",
    subtitle: "You look lovely today, btw.",
    error: {
      missing: "Missing username or password",
      invalid: "Invalid username or password",
      invalidContext: "If you feel that this is a mistake, please <a href='/contact'>contact us</a> with the following unique error ID:"
    },
    form: {
      username: "Username",
      password: "Password",
      forgot: "Forgot our password?",
      signup: "Create an Account",
      submit: "Login"
    }
  }
};
