# move-in

A shared board for the paperwork of moving into an apartment in Israel. Two
people, one list derived from the authority they are moving into, and at any
moment an honest answer to what is confirmed, what is waiting, and what nobody
has started.

The specification is in `docs/framing.md`. Read it before proposing anything.

## The record

The git history is as much a product of this project as the code. It is read and
judged on its own, so it is written on purpose and never left as a side effect.

Commit before you begin a step, not only after. A commit that exists before the
work is the record that the work was directed.

Push after every commit. A commit that only exists on this machine is not part of
the record.

One message, one change. A schema change and a screen change never share a
commit.

Say what actually changed. If it cannot be said in one line, the commit is too
big.

Never amend, squash, rebase or force push. A messy honest history is worth more
than a clean invented one.

Work stays on its branch until I merge it myself.

If you correct the same thing twice, stop and tell me — it belongs here as a rule,
not in the chat.

## Conventions

TypeScript throughout. Supabase for data and authentication, Netlify for hosting,
OpenRouter for the model. Same stack as my other project, deliberately.

Hebrew interface, right to left. Desktop first.

The authority comes from the Ministry of the Interior boundary layer at
`services-eu1.arcgis.com/ORARfqfyRwgjcEva`, layer `muni_il`. Public, no token.
Query it once per move and store the result; do not call it on every page load.

`Sug_Muni` decides the route for each item — which office, which channel, what
has to be brought. It is logic, not a label on the screen.

## Boundaries

An item is finished only when the authority has confirmed it. Sending the request
is a state of its own and never the end.

The model drafts. It never sends, and it is never asked for a fact. It receives
the address, the authority and the authority type — not a name, not an identity
number.

Items hold short identifiers as text: a reference, an account, a permit number.
No files, ever.

Do not build notifications, dependencies between items, cost tracking, or
anything for the old apartment. Each of those is out of scope on purpose, and it
is written down in `framing.md`.

Detail lives at the level of authority type. Do not add anything that is true of
one municipality and not another.

## What good work looks like

Every item shows its state, its owner, and how long it has been waiting — without
being opened.

A drafted request is good when it can be sent after one reading. If it has to be
rewritten, the prompt is wrong, not the model.

A draft for an item added by hand says on the screen that it is general, and
names no form, department or procedure.

When the boundary layer is slow or unreachable, say so and stop. Never fall back
to a guessed authority.

Document what the code does. Do not invent why — if the reason is not written
down, ask me.

## Known traps

The boundary layer is public but it is someone else's service. Treat it as
something that can be absent.

Right to left breaks layouts quietly. Check every screen in Hebrew, not in
English with Hebrew planned for later.

A wrong entry in the list sends a real person to the wrong office, and nothing in
the system will report it. This is the failure that matters most here.

A check must be able to fail. Before writing one down, say what result would mean
the change did not land. If no result would, the check is about something else —
usually a property that was already true, or the thing itself rather than a
person's ability to reach it. Three faults in turn three had exactly this shape,
all three found by use and none by building.

An address can fall outside every polygon — a new neighbourhood, a bad match, a
place with no municipal status. Handle it as a real case, not an impossible one.

I joined this course halfway through. If something looks like a project
convention and has no written source, ask me — do not assume.

Dates and times come from me. You have no clock: what the environment reports is
read once and goes stale inside a long session. Never infer a date, a duration,
or how long something took — ask.

## When to stop and ask me

Do not add an authority or an item to the verified list on your own. The list is
the product.

Do not add a dependency without asking.

Anything that adds a model call needs my approval.

If the fix is turning into a rewrite, stop and tell me.
