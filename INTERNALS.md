We're in the process of migrating the codebase from several approaches used
before to be more consistent.

We've settled on using promises, and will be using bluebird's `.nodeify` to
maybe-call callbacks to retain compatibility when we rewrite a function or
method to return promises. If we're reworking calling code of something that
uses callbacks, we liberally use `.promisify` to give internally
callback-driven designs a callback-or-promise interface temporarily, until we
have time to rewrite the internals -- it's all about limiting the scope of work
for a feature task while still driving the codebase toward coherency.

There is a `handlers/` and a `facets/` directory. Both are web request handling
parts, and need to be split up, probably as informed by trying for modularity.
They're both loaded from `routes/index.js`, which loads
`routes/authenticated.js` and `routes/public.js` for the public and
logged-in-users-only routes.

There are `models/` and `agents/` and `services/`. The final home will be
agents, we're refactoring to get rid of the ruby style `SomeClass.new` of the
implementations in `models/` but otherwise those are sound. `services/` are too
coupled to Hapi and should be extracted and made independent, to become agents.

Agents are instantiated frequently, but carry little state themselves -- just
context, such as a user they carry the permissions of. They're transient
instances, agnostic of any configuration or policy.
