# newww

[![Build Status](https://travis-ci.org/npm/newww.svg)](https://travis-ci.org/npm/newww)

We're using [Hapi](https://github.com/spumko/hapi) as our framework for the npm website. We wrote all about why we chose Hapi in [a blog
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

[assets/styles/index.styl](assets/styles/index.styl) is the master stylesheet, which is converted by the  [gulp process](gulpfile.js) to [static/styles/index.css](static/styles/index.css).

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

Every route in the application is defined in [routes.js](routes.js).

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

We're using [Lab](https://github.com/spumko/lab) as our testing utility and
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

```sh
cp .env.example .env
npm install
npm run dev
```

The server should be running at [localhost:15443](https://localhost:15443).
