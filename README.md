newww
=====

We're using [Hapi](https://github.com/spumko/hapi) as a framework for the
next iteration of the npm website. We wrote all about why we chose Hapi in
[a blog
post](http://blog.npmjs.org/post/88024339405/nearing-practical-maintainability).
If you'd like to contribute to this project and/or get an understanding of
what the goals and roadmap of the project are, check out the
[CONTRIBUTING.md](https://github.com/npm/newww/blob/master/CONTRIBUTING.md)
file.

## General Layout

There are two major pieces to the app, facets and services. Both are
implemented as Hapi plugins, though the way they are used in the application
are intentionally different.

### Facets

A **facet** is a mostly-self-involved piece of the website. Each facet is
entirely self-contained, and includes the following pieces:

* Routes (in `index.js`)
* Template controls (`show-[thing].js` for getting information from services and `presenters/[thing].js` for template-based utilities)
* Templates (`[thing].hbs`)
* Facet-specific tests (`test/*.js`).

Template partials are *not* housed in facets, as they are cross-facet (i.e.
headers, footers, etc).

By self-containing each facet, we can turn them into microservices (which
can be installed with npm) later, should we choose to do so.

There are currently four facets:

* The **company** facet focuses on all the npm, Inc. bits:
	* /
	* About page
	* Team page
	* Business partnerships (i.e. the Who's Hiring? page)
	* FAQ

* The **user** facet focuses on all the things that users who visit the site might care about:
	* Login/logout
	* Editing profiles
	* Editing email
	* Viewing profiles
	* Setting/Resetting passwords
	* Signing up
	* Starring packages

* The **registry** facet focuses on the bits that specifically pertain to the registry/using npm:
	* Package pages
	* Documentation
	* Browsing (i.e. keywords)
	* Search
	* Download counts

* The **ops** facet focuses on the things that we care about from an operational standpoint, but don't really fall into any of the other buckets:
	* Healthchecks
	* Content Security Policy logging

### Services

A service is a shared resource, like our couchDB instance. Services have
methods that can be called from any facet.

For example:

_In `services/hapi-couchdb/`:_

```
  service.method('getPackageFromCouch', function (package, next) {
    anonCouch.get('/registry/' + package, function (er, cr, data) {
      next(er, data);
    });
  });
```

_Then, in `facets/registry/package-page.js`:_

```
  var getPackageFromCouch = request.server.methods.getPackageFromCouch;

	// stuff before getting package

  getPackageFromCouch(couchLookupName(name), function (er, data) {

	// stuff now that we have the package

	reply.view('package-page', pkg);

  });

```

## Tests

There are tests! We're using [Lab](https://github.com/spumko/lab) as our
testing utility. Site-wide tests are currently located in the `test/` folder
and can be run with `npm test`. Facet-specific tests are located in their
respective `facet/[name]/test/` folders.

Expect this bit to evolve as things get more complex. But for now, just
having tests is a HUGE improvement.

## Templating and Styling

We're using [Handlebars](http://handlebarsjs.com/) as our templating engine.
Think of it as a compromise between Jade and EJS; also an opportunity to
learn a new templating language. It's got its ups and downs, but so far so
good. (Plus the spumko team uses it, so all the integration is basically
done for us.)

We're sticking with [Stylus](http://learnboost.github.io/stylus/) as our CSS
preprocessor. The Stylus-to-CSS conversion happens as an npm prestart
script.

## Code

Let's bring back semi-colons and comma-last. No rhyme or reason; just cuz.

## Running the server locally

First, clone this repo.

Second, copy numbat-config.example.js to numbat-config.js. Feel free to
modify it to suit your needs. You can also create a config.admin.js to
override any of the config.js values.

If you have a reasonably new machine, we strongly recommend using Virtualbox
and Vagrant to run a pre-configured VM containing [couchdb](http://couchdb.apache.org/),
[redis](http://redis.io/), and [elasticsearch](http://www.elasticsearch.org/),
all ready to go. If your machine struggles to run a VM, or you are suspicious
of VMs, you will need to install them yourself.

### 1. Recommended setup: pre-built VM

First [install VirtualBox](https://www.virtualbox.org/wiki/Downloads), which is
free for personal use.

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

Most of the dependencies are checked-in, but a few will get installed when
you run this.

### 3. Start your databases

Again, from inside the VM at /vagrant, run

`npm run dev-db`

You should see couch, redis and elasticsearch all being started. This can
take a little while, so wait until you see "STARTING DEV SITE NOW". Once it's
running, you can see the site by going to

[https://localhost:15443/](https://localhost:15443/)

That's it! You are good to go. You can edit the code from outside the VM and
the changes will be reflected in the VM. When you're done, remember to exit
the vm and run

`vagrant suspend`

which will save the VM. `vagrant up` will bring it back much faster after the
first run.

### 4. Start the web server

In a separate terminal outside of vagrant, run `npm run dev`. (You can also
run `npm run dev` from inside vagrant, but you'll need to change your host to
'0.0.0.0' in `config.js`. We recommend running it outside of vagrant, but
it's totally up to you.)

For ease of development, we've got a Gulpfile that uses
[gulp](http://gulpjs.com/). It watches appropriate directories and restarts
stuff for you when other stuff changes. Fortunately, you don't have to use
gulp if you don't want to; just change the `start` line in the root
`package.json` to `start: "node server.js"`.

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
