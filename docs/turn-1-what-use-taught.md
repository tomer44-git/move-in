# What the use taught — turn one

ASE-26 personal project · Tomer Ben Bassat · 22 August 2026

Two days of real use, on a real move to באזל 30 in Tel Aviv, by both people from
their own devices.

Everything here came out of use. It is written from an interview with Tomer on
22 August and holds what he said, including the two things he raised and then
decided against. The decisions matter more than the conclusions.

It is not a backlog. Four of the six things use turned up are not defects at all,
and reading the list as a list of bugs would lose what the milestone was for.

## The milestone

Noa signed in on her own device, joined with the code, and both people saw the
same state without either telling the other.

That closes check 3, the only one of the six that turn one could not demonstrate
from the agent's side, and it is the thing the whole turn rested on. It is
recorded in `docs/verification-turn-1.md`.

## What was missing, and it was the thing left out on purpose

The drafted request is the one feature in `framing.md` that this turn did not
build. It was cut from scope deliberately in the first message. Two days of use
found its absence, which is exactly the evidence the milestone was meant to
produce.

It was missed at two specific items, and they are not the same case:

**Electricity.** Tomer knew what had to be done and could not phrase the request.
This item already carries verified facts: the website, a form by email or fax to
1-800-200-103, the telephone number 103, and what to bring — contract number,
a current meter reading, personal details. A model phrasing a request from those
invents nothing. This is precisely the feature as designed, and it would have
worked.

**Home insurance.** The verified list holds nothing for this item but its name.
`framing.md` already answers this case: a general draft with placeholders that
names no form, department or procedure, and a screen that says the draft is
general.

So both examples are already covered by the design. Neither is new scope.

## The line, tested and kept

Alongside the drafting, Tomer described wanting the model to help with the
municipality's website and guide him through it.

That is a different thing. It asks the model for a fact about civic procedure,
and that is the exact reversal `framing-interview.md` records as the most useful
thing the first interview produced: the advice tool was cut because the advice
would need a model to invent facts, and `CLAUDE.md` settles it as "the model
drafts, and it is never asked for a fact".

Put to him as a decision rather than allowed to follow quietly from a feature
request, he chose to leave the line where it is.

**This is the most valuable thing in this document, and it is not a defect.** The
line held when there was a good reason to move it, and it held under real use
rather than in a conversation about a plan.

The risk is the same as the one the routes carry: a model that says confidently
which screen to click on Tel Aviv's website, having never seen it, sends a real
person to the wrong place, and nothing in the system reports it.

## Notifications: comfortable, not needed

Tomer raised sending the other person an email when an item is confirmed.

`framing.md` defers notifications with a written condition: they come back if use
shows they are needed. Asked whether anything was actually dropped in those two
days — work done twice, a wasted wait, a near miss — the answer was that it
simply felt convenient.

So the condition was not met, and this stays an open question rather than
becoming a conclusion. Two days is a short sample and the move itself will run
for weeks.

One correction to the idea, for whenever it is built: it needs no model and no
agent. "X's request was confirmed" is assembled from fields already in the
database. A model there would only add a place for something to be wrong, and it
would sit awkwardly against "the model never sends".

## Wanted, and deferred to the next turn

**Hiding an item.** Not every item applies to every move. Hiding rather than
deleting, because both people can touch everything and a deletion by one would
be unrecoverable for the other, taking any owner, date or reference with it.
It applies to the nineteen as well as to hand-added items.

**A log per item.** Date and action. It needs a table of its own: the schema
holds current state and no history. It should be written by a trigger, for the
same reason the dates already are — a log the browser can write is a log that can
be wrong.

Raised and left as he asked it: the log records what happened and when, not who
did it. In a board built for two people that is the next question anyone will
ask, and `updated_by` already holds the answer.

**The look.** Pastel light blue with light purple, the name `Move-in` centred at
the top, and sign-in and sign-out at the top right — confirmed as the right-hand
side in the right-to-left sense, the start of the line, not the end.

Offered a choice between doing this now and holding it, he held it, keeping turn
one closed on what it was defined as.

## Fixed before the turn closed

**The number on the row.** A hand-added item appeared as 100. `position` is a
sort key — hand-added items start at 100 so they can never collide with the
nineteen — and it was printed on screen. The board now shows a row's place in the
list, and `position` went back to being invisible.

The right kind of fault to find this way: nothing errored, nothing was
inconsistent, and no test would have caught it. It only looks wrong to a person
reading the board.

**The note on item 19.** Shortened to `לא מתוך כל-זכות.`

I argued for keeping it whole, because it is the only thing on screen separating
content that has a source from content that does not, and because hiding answers
a different question from provenance. The half that carries the distinction
stayed; the half about who added it went.

## What this leaves for turn two

- The drafted request, at last, and starting from the items where it was actually
  missed rather than from all nineteen at once.
- Hiding an item.
- The log per item.
- The look.
- Notifications, still as a question and not yet as work.
- The three route descriptions, still unverified in `docs/items.md`. Tel Aviv is
  a city, so only the first of the three touches this move.
