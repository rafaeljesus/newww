# newww

[![Build Status](https://travis-ci.org/npm/newww.svg)](https://travis-ci.org/npm/newww)

We're using [Hapi](https://github.com/hapijs/hapi) as our framework for the npm website. We wrote all about why we chose Hapi in [a blog
post](http://blog.npmjs.org/post/88024339405/nearing-practical-maintainability).

If you'd like to contribute to this project,
[please do](https://github.com/npm/newww/blob/master/CONTRIBUTING.md)!

## Application Structure

Let's take a tour of the app.

### Assets

The [assets](assets) directory contains all the frontend stuff: JavaScript, stylesheets, images, fonts, robots.txt, favicon.ico, etc. The [gulp process](gulpfile.js) watches this directory for file changes, and outputs everything to the [static](static) directory, which is [ignored by git](.gitignore) to prevent automated version control noise.

- Browserify [assets/scripts/index.js](assets/scripts/index.js)
- Concatenate non-browserify JavaScripts in [assets/scripts/vendor](assets/scripts/vendor)

### Styles

We're using Stylus, a CSS preprocessor with clean syntax and all the bells and whistles one would expect from a CSS preprocessor like variables, mixins, color manipulation functions, autoprefixing, etc. It's less of a hassle than Sass because it doesn't have C or Ruby dependencies.

[assets/styles/index.styl](assets/styles/index.styl) is the master stylesheet, which is converted by the  [gulp process](gulpfile.js) to static/styles/index.css.

For more information, see the [style guide](assets/styles/README.md).

### Templates

We're using [Handlebars](http://handlebarsjs.com/) as our templating engine. Server-rendered templates live in [templates](templates). Frontend templates live in [assets/templates](assets/templates). They are browserified into the bundled JS file using the `hbsfy` transform.

### Partials

Handlebars partials are handy for markup that is needed in more than one place. All the partials are located in [templates/partials](templates/partials). Every `.hbs` file in the partials directory becomes avaiable in all handlebars templates. For a good explanation of how to use partials, check out [Passing variables through handlebars partial](http://stackoverflow.com/questions/11523331/passing-variables-through-handlebars-partial) on Stack Overflow, or search for `{{>` in this codebase to see how we're using them.

### Locales

A rudimentary localization effort is under way. The [locales](locales) directory contains javascript files that export translations of various strings used throughout the app.

### Content Security Policy (CSP)

We use the [blankie](https://github.com/nlf/blankie) Hapi plugin to enforce a strict content security policy that disallows execution of unsafe Javascript. It's defined in [csp.js](lib/csp.js).

### Routes

Every route in the application is defined in [routes](/routes).

### Handlers

Handlers (sometimes called controllers) are functions that accept two parameters: `request` and `reply`.

The `request` parameter is an object with details about the end user's request, such as path parameters, an associated payload, authentication information, headers, etc.

The second parameter, `reply`, is the method used to respond to the request.

Here's an example of a simple handler:

```js
server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply('Hello!');
    }
});
```

The above handler is defined inline, but most of the handlers in this application are defined in their own file in the [handlers](handlers) directory.

## Tests

We're using [Lab](https://github.com/hapijs/lab) as our testing utility and
[Code](https://www.npmjs.com/package/code) for assertions.

```sh
npm install
npm test
```

If you have npm 2.0.0 or greater installed ([which you should](https://docs.npmjs.com/getting-started/installing-node)),
you can pass [additional arguments](https://docs.npmjs.com/cli/run-script) to scripts. This handy feature
allows for more granular control of the tests you want to run:

```sh
# a directory
npm test -- test/handlers

# a file
npm test -- test/models/user.js
```

## Code

We're using semi-colons and comma-last. No rhyme or reason; just cuz.

## Running the server locally

It is not currently possible for non-employees to run the development server. This is being tracked at [github.com/npm/newww/issues/761](https://github.com/npm/newww/issues/761).

```sh
# run redis in a background process
redis-server&

# copy environment-based config/secrets
cp .env.example .env

# install deps
npm install

# run the hapi server
npm run dev
```

The server should be running at [localhost:15443](https://localhost:15443).

If you have any trouble getting the site running locally, please [open an issue](https://github.com/npm/newww/issues/new) and we'll help you figure it out.

# Environment variables

`newww` uses many environment variables for configuration.

## API Endpoints

* `BILLING_API`, the URL to the billing API service
* `CANONICAL_HOST`, the canonical hostname users should visit for this service
* `DOWNLOADS_API`, the URL of the downloads API
* `ELASTICSEARCH_URL`, the URL to the elastic search database to use for search
* `LICENSE_API`, the URL to the license API
* `USER_API`, the URL to the user-acl API
* `CMS_API`, the URL to the npm v1 CMS API

## Zendesk integration

* `ZENDESK_URI`, the URL to the Zendesk API
* `ZENDESK_TOKEN`, the Zendesk access token
* `ZENDESK_USERNAME`, the Zendesk account username

## Configuration

* `REDIS_URL`, the URL to a redis instance for this service
* `SESSION_PASSWORD`, a password for sessions
* `SESSION_SALT`, a salt to randomize encryption of sessions
* `SESSION_COOKIE`, the cookie name for session IDs
* `MAIL_ACCESS_KEY_ID`, the access key ID for sending mail
* `MAIL_SECRET_ACCESS_KEY`, the secret key for sending mail
* `USE_CACHE`, ???


## Marketing integration

* `HUBSPOT_FORM_NPME_SIGNUP`, uuid of a hubspot form
* `HUBSPOT_FORM_NPME_AGREED_ULA`, uuid of a hubspot form
* `HUBSPOT_FORM_NPME_CONTACT_ME`, uuid of a hubspot form
* `HUBSPOT_FORM_PRIVATE_NPM, uuid of a hubspot form`
* `HUBSPOT_FORM_PRIVATE_NPM_SIGNUP, uuid of a hubspot form`
* `HUBSPOT_PORTAL_ID`, the hubspot portal ID
* `MAILCHIMP_KEY`, the mailchimp key

## New Relic integration

* `NEW_RELIC_LICENSE_KEY`, the license key
* `NEW_RELIC_APP_NAME`, the app name
* `NEW_RELIC_NO_CONFIG_FILE`, must be set to true because we provide config in the environment
* `NEW_RELIC_ENABLED`, boolean

## Feature Flags

* `FEATURE_ORG_BILLING`, users who are allowed to use Teams and Orgs
* `FEATURE_BYPASS_EMAIL_VERIFY`, users who can bypass email verification, for testing
* `FEATURE_NPMO`, boolean, whether to run in npm On-site mode, which is a stripped-down configuration

## Miscellaneous

* `NPME_PRODUCT_ID`, uuid of the npm On-site product
* `NPMO_COBRAND`, the user's brand displayed in the npm On-site product
* `CMS_CACHE_TIME`, in seconds, how long to cache CMS content without refetching
