module.exports = {
  signup: {
    title: "Create an Account",
    subtitle: "Sign all the way up",
    error: "There was a problem! The server said:",
    form: {
      username: "Username",
      nameHelp: "Must be lowercase and composed of URL-safe characters.",
      password: "Password",
      verify: "Verify Password",
      email: "Email Address",
      emailHelp: "This <strong>will</strong> be public and shown on all the packages you publish. Accounts with invalid emails may be deleted without notice.",
      npmWeekly: "Sign up for npm Weekly emails",
      submit: "Make it so"
    }
  },

  login: {
    title: "Login",
    subtitle: "You look lovely today, btw.",
    error: {
      invalid: "Invalid username or password",
      invalidContext: "If you feel that this is a mistake, please email <a href='mailto:support@npmjs.com'>support@npmjs.com</a> with the following unique error ID:"
    },
    form: {
      username: "Username",
      password: "Password",
      forgot: "Forgot your password?",
      signup: "Create an Account",
      submit: "Login"
    }
  },

  password: {
    title: "Forgot your password?",
    subtitle: "Don't worry. It happens to the best of us.",
    emailed: "An email has been sent. Click the link when you get it.",
    multipleUsernames: "Found multiple usernames for the given email address. Please choose one.",
    form: {
      submit: "Email me a recovery link"
    }
  },

  profile: {
    not_found: {
      subtitle: "Sorry, there's no user by that name."
    }
  }

};
