module.exports = {
  signup: {
    title: "create an account",
    subtitle: "sign all the way up",
    error: "There was a problem! The server said:",
    form: {
      username: "username",
      nameHelp: "must be lowercase and composed of URL-safe characters.",
      password: "password",
      verify: "verify password",
      email: "email address",
      emailHelp: "This <strong>will</strong> be public and shown on all the packages you publish. Accounts with invalid emails may be deleted without notice.",
      npmWeekly: "sign up for npm weekly emails",
      submit: "make it so"
    }
  },

  login: {
    title: "login",
    subtitle: "you look lovely today, btw.",
    error: {
      invalid: "invalid username or password",
      invalidContext: "If you feel that this is a mistake, please email <a href='mailto:support@npmjs.com'>support@npmjs.com</a> with the following unique error ID:"
    },
    form: {
      username: "username",
      password: "password",
      forgot: "forgot your password?",
      signup: "create an account",
      submit: "login"
    }
  },

  password: {
    title: "forgot your password?",
    subtitle: "don't worry. it happens to the best of us.",
    emailed: "An email has been sent. Click the link when you get it.",
    multipleUsernames: "Found multiple usernames for the given email address. Please choose one.",
    form: {
      submit: "email me a recovery link"
    }
  },

  profile: {
    not_found: {
      subtitle: "sorry, there's no user by that name."
    }
  }

};
