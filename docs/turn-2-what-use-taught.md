# What the use taught — turn two

ASE-26 personal project · Tomer Ben Bassat · 24 August 2026

Real use on the move to באזל 30, both people from their own devices, with
replies received from some of the authorities.

Written from an interview with Tomer and holding what he said. It is not a
backlog: the most important thing in it is not a fault.

## The milestone

**Requests the tool drafted were sent unchanged, and the authorities answered.**

He filled in the bracketed placeholders and sent them as they stood - no
rewriting - and the replies that came back were serious ones. Electricity was
named specifically.

That closes check 1, and check 1 is the whole point of the turn. `framing.md` has
asked since its first version for "a request that can be sent after reading it
once", and it was the one thing in that document turn one did not build. It now
exists and has been used on a real move against real authorities.

It also closes the question that opened this turn. Turn one's use found the
drafted request missing, at electricity and at home insurance. Both are answered.

## The line held in practice

Nothing in the week produced a draft that named a form, a department or a
procedure that was not in the verified list. The model was never given a name or
an identity number and never invented one.

This matters more than it sounds. The line was re-affirmed as a decision at the
end of turn one, when Tomer chose to keep the model away from facts about civic
procedure even though he had a good reason to move it. Drafts sent to real
authorities are the first evidence that keeping it costs nothing in usefulness.

## What the log turned out to be for

It was used, and not for what it was asked for.

It was asked for as a record - what happened and when. What it became was a
decision tool: whether an authority had been silent long enough to be worth a
telephone call. And an end-of-day review, both of them at one board, checking
that everything sent was sent and what was still waiting.

Two things follow.

**The row was failing at its job.** The board already carries "ממתין 3 ימים" on
every waiting item, and they saw it. They opened the log anyway, because what
they wanted was the date itself. A person opening a history to read a field the
row could have carried is a screen falling short, not a feature missing. The date
is now on the row beside the elapsed time; both are shown, because "three days"
and "the 24th" are different questions and the week had both being asked.

**"Who" is missing, and the owner does not cover it.** Asked directly, after the
use: *"חסר לי לדעת, כן. למרות שיש אחראי לכל משימה."*

The "although" is the point. Owner and actor are the same person on a board where
each person has their own tasks. On this one either may touch anything, so they
come apart: Noa can mark an item sent that Tomer owns, and the log as it stands
would let a later reader assume Tomer sent it. `updated_by` already holds the
answer.

Recorded when the log was designed as the first question anyone would put to it.
It was, at the first opportunity.

## Hiding, used as intended

Three items were hidden: registration for kindergarten or school, the certificate
of residence, and car insurance. More may follow.

And a decision came with it, unprompted: **keep them in the list.** They do not
apply to this move, and they do apply to somebody - a family with children needs
the school registration. That is the distinction hiding was built for, and it
confirms the choice made at the end of turn one to hide at the level of the move
rather than edit the list.

Nothing about restoring was reported, so the assumption that hiding must be
reversible is still only exercised, not tested by need.

## Two faults, both mine

**A truncated draft was shown as a finished one.** On items the verified list
says little about - home insurance, banks - a draft sometimes arrived as a single
line. Regenerating produced a good one, so the model was never the problem.

Two things were wrong. The code never read `finish_reason`, so an answer cut off
mid-sentence was stored and displayed exactly like a complete one. And the token
budget was being spent before the text began: Sonnet 5 thinks before it writes,
and those tokens come out of the same allowance. A thin item gives it more to
work out and less to say, which is precisely where it failed.

The budget is raised, and a cut-off answer is now refused with a message rather
than saved. Six drafts on the three thinnest items, twice each, came back whole.

This is the failure this project is built to avoid, and it was in my code rather
than in the domain: something incomplete presented as though it were finished.

**Item numbers changed depending on which list was open.** In the hidden view,
items 6, 7 and 15 were shown as 1, 2 and 3. The number described a row's position
in whatever list happened to be open, when its job is to identify the item.

The same fault turn one fixed, in a place turn one did not have. Numbers are now
computed once over every item on the move.

## Nothing else

Asked what was annoying and had no name - the question that produced the most
useful material in turn one - the answer was that nothing was. It simply worked.

## What this leaves for turn three

- **Who did it, in the log.** Asked for, and the reason given.
- **Notifications**, still a question. Two turns of use have not met the
  condition written into `framing.md`; this one produced no case of something
  dropped for want of being told.
- **The three route descriptions**, verified for a city, a local council and a
  regional council on 22 August. Nothing in this use tested the other two,
  because Tel Aviv is a city.
- **Whether items 16, 17 and 18 apply.** Answered for this move by hiding them.
  Still open for the list.
- **Whether an unresolved address gives a useful board.** Built this turn, and
  deliberately never run: testing it means breaking the board two people are
  using.
