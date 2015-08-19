We're in the process of migrating the codebase from several approaches used
before to be more consistent.

We've settled on using promises, and will be using bluebird's `.nodeify` to
maybe-call callbacks for compatibility, or `.promisify` to give internally
callback-driven designs a callback-or-promise interface.

There is a `handlers/` and a `facets/` directory. Both are web request handling
parts, and need to be split up, probably as informed by trying for modularity.

There are `models/` and `agents/` and `services/`. The final home will be
agents, we're refactoring to get rid of the ruby style `SomeClass.new` of the
implementations in `models/` but otherwise those are sound. `services/` are too
coupled to Hapi and should be extracted and made independent, to become agents.

Agents are instantiated frequently, but carry little state themselves -- just
context, such as a user they carry the permissions of. They're transient
instances, agnostic of any configuration or policy.
