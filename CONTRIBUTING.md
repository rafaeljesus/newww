# Contributing to newww

Looking to help out with npm's next iteration of its website? Great!

## How to Contribute

Below is a checklist of functionality. If you're keen on tackling something, go for it! To contribute:

* Fork the repo
* Pick *one* thing to work on
* Create a branch
* Work on that thing - write code, write tests, make sure everything works beautifully
* Use `git rebase` to keep your code in sync with the master branch
* Push up your branch
* Put in a pull request

## Roadmap

As we begin this project, our first goal is to create feature parity with the current npm-www. Once we achieve that goal, then we shall update its design and start adding new features.

## Things to Do

### Tests

If all else fails, there are tests to write. Unlike npm-www, newww will *not* accept pull requests that don't also come with tests. If there are no tests, there will be no merging. [Capisci](https://translate.google.com/?text=capisci#it/en/capisci%3F)?

### Functionality

Please remember that each piece of functionality is totally encompassed in the facet under which it falls.

**User Facet**

[ ] `/profile-edit`
[ ] `/email-edit`
[x] `/profile/{name}` | `/profile` | `/profile/{name}`
[x] `/~{name}`
[ ] `/password`
[x] `/signup`
[ ] `/forgot`

**Registry Facet**

[ ] `/package/{name}/{version}`
[ ] `/keyword/{kw}`
[ ] `/browse/?*`
[ ] `/star`

**Company Facet**

[ ] `/about`
[ ] `/whoshiring`

**Ops Facet**

[ ] Healthchecks
[ ] csp-logs