# newww

[![Build Status](https://travis-ci.org/npm/newww.png)](https://travis-ci.org/npm/newww)

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

### Locales

A rudimentary localization effort is under way. The [locales](locales) directory contains javascript files that export translations of various strings used throughout the app.

### Content Security Policy (CSP)

We use the [blankie](https://github.com/nlf/blankie) Hapi plugin to enforce a strict content security policy that disallows execution of unsafe Javascript. It's defined in [config.js](config.js).

### Routes

Every route in the application is defined in [routes.js](routes.js).

### Facets

A **facet** is a way of separating different business-logic bits of the app. They're essentially just folders for holding handlers (aka controllers) for various routes.

There are currently five facets:

* The **company** facet focuses on all the npm, Inc. bits:
	* / (Home)
	* Business partnerships (i.e. the Who's Hiring? page)
	* Static documents (i.e. jobs, about, contact, policies)

* The **enterprise** facet takes care of our npm Enterprise signup process.

* The **user** facet focuses on all the things that users who visit the site might care about:
	* Login/logout
	* Editing profiles
	* Editing email
	* Viewing profiles
	* Setting/Resetting passwords
	* Signing up

* The **registry** facet focuses on the bits that specifically pertain to the registry/using npm:
	* Package pages
	* Documentation
	* Browsing (i.e. keywords)
	* Search
	* Download counts
  * Starring packages

* The **ops** facet focuses on the things that we care about from an operational standpoint, but don't really fall into any of the other buckets:
	* Healthchecks
	* Content Security Policy logging

### Services

A service is a Hapi plugin that can be used by any handler. They're a lot like models, but they are completely encapsulated so that they can (eventually) be spun out into entirely independent services. This may change eventually, though, because the separated tests make it hard to keep track of all the moving pieces.

An example:

_In `services/downloads/`:_

```js
  service.method('downloads.getAllDownloadsForPackage', ...);
```

_Then, in `handlers/package.js`:_

```js
  var getAllDownloadsForPackage = request.server.methods.downloads.getAllDownloadsForPackage;

  // Show download count for the last day, week, and month
  getAllDownloadsForPackage(pkg.name, function (err, downloads) {

    opts.package.downloads = downloads;

    reply.view('package/show', opts);
  });

```

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

First, clone this repo. Then copy some configuration files, and modify them to suit your needs:

```sh
cp numbat-config.example.js numbat-config.js
cp .env.example .env
touch config.admin.js
```

If you have a reasonably new machine, we strongly recommend using Virtualbox
and Vagrant to run a pre-configured VM containing [couchdb](http://couchdb.apache.org/),
[redis](http://redis.io/), and [elasticsearch](http://www.elasticsearch.org/),
all ready to go. If your machine struggles to run a VM, or you are suspicious
of VMs, you will need to install them yourself.

### 1. Recommended setup: pre-built VM

First [install the latest version of VirtualBox](https://www.virtualbox.org/wiki/Downloads), which is
free for personal use. There is [an issue](https://github.com/npm/newww/issues/265) with some earlier versions of VirtualBox, so you may need to update it.

Then [install Vagrant](https://www.vagrantup.com/downloads.html), also free.

Now go into the root of the repo and run

`vagrant up`

this will download the VM image (~700MB, so go grab a cup of coffee) and start
the VM. After this first run, the VM image will already be available on your
machine, so vagrant up will only take a few seconds.

Now get access to the machine, super simple:

`vagrant ssh`

You are now inside the VM! The code in the repo is linked to `/vagrant`, the
directory you find yourself in when you login. Changes made outside the VM
will be immediately reflected inside of it and vice versa.

### 2. npm install

Note that you should be *inside* the VM and at /vagrant when you do this:

`npm install`

### 3. Start your databases

Again, from inside the VM at /vagrant, run

`npm run dev-db`

You should see couch, redis and elasticsearch all being started. This can
take a little while the first time you start up (the couch instance will replicate a few popular packages from the main registry), so wait until you see "STARTING DEV SITE NOW".

### 4. Start the web server

In a separate terminal outside of vagrant but inside the `newww` directory, run `npm run dev`. (You can also
run `npm run dev` from inside vagrant, but you'll need to change your host to
'0.0.0.0' in `config.js`. We recommend running it outside of vagrant, but
it's totally up to you.)

For ease of development, we've got a Gulpfile that uses
[gulp](http://gulpjs.com/). It watches appropriate directories and restarts stuff for you when other stuff changes. Now, you don't have to use gulp if you don't want to; just change the `start` line in the root `package.json` to `start: "node server.js"`.

At this point you should be able to go to `https://localhost:15443`.

That's it! You are good to go. You can edit the code from outside the VM and the changes will be reflected in the VM. When you're done, remember to exit the vm and run `vagrant suspend` which will save the VM. `vagrant up` will bring it back much faster after the
first run.

### Under the hood

All the `npm run` commands are simply running the script `dev/go.js` with
different arguments. They dump redis and couchdb logs to stdio, and
automatically run the server logs (which are just JSON) into bunyan, which
parses and prints them neatly.

The couchdb clones 1/256th of the published packages, and comes with a
hard-coded set of user accounts for testing. It has a user named 'admin' with
the password 'admin', which you can use to log in and do stuff using futon,
by going here:

[http://localhost:15984/_utils/](http://localhost:15984/_utils/)

It is also running a copy of Elasticsearch, which you can hit locally if you
want to test queries or perform admin:

[http://localhost:9200/](http://localhost:9200/)

You should also have access to both the
[head](http://mobz.github.io/elasticsearch-head/) and
[kopf](https://github.com/lmenezes/elasticsearch-kopf) Elasticsearch
plugins, accessible at http://localhost:9200/_plugin/head/ and
http://localhost:9200/_plugin/kopf/, respectively.
