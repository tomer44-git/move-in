# What the use taught — turn four

ASE-26 personal project · Tomer Ben Bassat · 3 September 2026

The last of four. Written from an interview with Tomer after he opened a move at
גפן 8, כרמי יוסף - the address that started the turn, inside מועצה אזורית גזר,
and one that no version of this tool has ever resolved or ever will.

As in the three before it, it is not a backlog, and the most important thing in
it is not a fault.

## The milestone

**Somebody whose address cannot be resolved gets a working board and a way to the
council's own site.**

All seven checks passed. The four that needed a person were observed at that
address: the items could be acted on with no reload, no running move claimed to
have ended, the note stood above the first item, and the link was there beside
it.

## A screen that changed what somebody did

The note was built to inform. Asked whether it changed what he did, the answer
was that he went to the council's site and **added an item to his board because of
what he found there**.

That is a different kind of result from anything the previous three turns
produced. Every screen this project has built until now changed what a person
knew: what state an item is in, who owns it, how long it has waited, what a
finished move held. This one sent somebody out of the tool and they came back
with something the verified list did not have.

It is also the second time in two turns that a screen written to inform was read
as an instruction. Turn three's ending panel named the unconfirmed items and was
taken as "settle these before you close". This one lists nineteen items and
suggests looking further, and was taken as "go and look". Twice now the useful
thing was not the information but the sentence's shape.

Worth saying plainly: neither was designed that way. Both were written to state a
fact and let the person decide, and both were followed. That is luck twice, and a
thing to know about rather than a technique to claim.

## What the link proved

`CLAUDE.md` says detail lives at the level of authority type and not of the
individual municipality, and a maintained table of two hundred and fifty council
websites was refused on those grounds. The link is built from the name the
boundary layer returned a moment earlier, so it exists for every council and
there is nothing to keep up to date.

That was a defensible decision. It is now an evidenced one: the search landed on
Gezer immediately.

## A board with no authority is a working board

Asked whether nineteen items with no route read as a working board or a broken
one, the answer was that it worked.

The whole turn rests on that. Fifteen of the nineteen never needed an authority,
and turn two chose to show all nineteen rather than withhold them - reasoning
that leaving the four out would let a person conclude arnona did not apply to
them, when the truth was only that nobody knew which office. Two turns later,
somebody sat in front of exactly that board and used it.

## The hole that had been there since the first turn

The address failed because the authority came back with no `CR_LAMAS`. Reading
the layer's own data, every row of it: **all 127 regional councils in the country
have no `CR_LAMAS`, and never had.** It is the Central Bureau of Statistics code
for a locality, and a regional council is a grouping of localities rather than
one. Cities and local councils are localities, which is why the tool worked for
three turns without anyone noticing that it could not work at all for a third of
the country's authorities.

**And the symptom was written down for two of those turns.** `framing.md` listed,
as still open: *"The three route descriptions. Turn two tested only the city one;
the other two are recorded as checked but have not been used."* It was read as a
gap in testing - as waiting for the right person to move to the right sort of
place. Nobody asked why it had never happened. The answer was that it could not
have.

An open item that never closes is data. This one had been quietly reporting a
defect for two turns in the language of a missing opportunity.

## The fault that started the turn came from the turn before it

The board locked itself after every lookup: no action on any item, and a notice
reading `המעבר הסתיים ב-Invalid Date`.

Turn three added `hasEnded = move.ended_at !== null` and did not notice that the
lookup function returns a column list written in turn two, before that column
existed. The field arrived as `undefined`, and `undefined !== null` is true. It
healed on the first reload, which is why it read as intermittent and why it
survived a turn.

Four turns, and the count is unchanged: **every fault this project has had was
found by somebody using it, and none by building it.**

## The rule's first outing

`CLAUDE.md` gained a rule at the end of turn three: a check must be able to fail,
and before writing one down, say what result would mean the change did not land.

Turn four is the first written under it, and it did two things.

It changed what the verification document says. Where a check is settled, what is
recorded is the result that could have failed and did not, rather than the word
"passed".

And it made one more check answerable without a person - not by arguing harder,
but by running the changed code against the live boundary layer at three real
points. The service is public and needs no token. The only reason no previous
turn did it is that no previous turn thought to.

## Two questions with no answer

The interview asked five things. Three were answered and are above. Two were not,
and they are recorded as unanswered rather than settled, because a question
nobody answered is not the same as a question whose answer was no.

**The English error on a Hebrew screen.** `the boundary layer did not answer
within 8 seconds` appeared twice during this turn, in a tool whose first
convention is a Hebrew interface. Eleven such messages exist in the two
functions that talk to outside services, and any of them can reach a person.
Whether it belongs in `framing.md` as something open was asked and not answered.

**What the tool turned out to be, and what it never did.** The one question no
earlier turn was in a position to ask, asked at the end of the last one, and left
without an answer. There is no fifth turn to catch it.

Both are written here so that the next person to read this repository knows they
were asked. Neither is a finding.
