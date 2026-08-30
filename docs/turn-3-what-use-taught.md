# What the use taught — turn three

ASE-26 personal project · Tomer Ben Bassat · 30 August 2026

Three people used it. A friend of Tomer's who had already finished a real move
closed one in the tool and opened the next; his partner was on the same move and
watched it close from her own screen; and Tomer exercised the ending panel on a
move made for the purpose.

Written from an interview with Tomer and holding what he and they said. As in
turn two, it is not a backlog, and the most important thing in it is not a fault.

## The milestone

**Somebody finished a real move in the tool, and nothing they recorded was
lost.**

He ended it, opened the next one with nothing to set up again, and went back into
the closed one afterwards. His partner saw it close without being told. Both of
them said the tool did what they had expected of it.

That is the milestone as the plan wrote it, and it is met.

## Why he went back, which nobody predicted

The door built in steps 8 and 9 was justified by a use that was not the one it
was built for.

He did not return to the finished board to remember the move. He returned to work
out **which bodies he has to deal with, and whether the requests he had sent were
the right ones** — the ones the model had drafted for him. He read them back
against what the authorities had actually accepted, and found that every draft
had been phrasing that carried through all of them.

What he took from that was confidence. In his own account, checking the closed
board is what made him willing to keep using the drafts.

Three things follow, and they matter in different directions.

**A finished move is a reference, not an archive.** It was justified as a record
that must not be destroyed — "reset for a future one rather than deleted" — and
that argument was about loss. This is a different argument and a stronger one:
the closed board is read, on purpose, for what it can tell somebody about the
move they are doing next. An archive is kept in case. A reference is used.

**It is the third turn of evidence for the line the model is held to.** Turn one
put it as a decision, turn two showed that drafts sent unchanged got serious
replies, and turn three has somebody going back weeks later to audit those drafts
against what worked — and finding them right. The line was defended twice on
principle. It has now been checked from the far end.

**Confidence turned out to be the thing being produced.** He did not say the
drafts saved him time. He said reading them back made him trust them. That is
worth knowing about a tool whose whole job is to tell two people the truth about
where they stand.

## What the ending panel turned out to be

It was built to inform: name the items no authority has confirmed, and let the
person close anyway. Telling, not refusing, on the grounds that a person knows
they have moved in long before a bureaucracy agrees.

Used, it read as an instruction. The wording — check what is not closed, and
close it before opening a new one — is what both of them took from it, and the
friend said he would have gone back to settle those items and only then moved on
to the new move.

So a screen written to inform is being used to decide. That is a better outcome
than the one intended and it should be recorded as luck rather than design: the
panel does not enforce anything, and the fact that it reads as though it does is
a property of the wording, not of the tool.

## A concern raised by reading, and dismissed by use

Before the interview, reading the code raised this: the second person, who is on
the finished move and not on the new one, is offered `פתח מעבר חדש` — while the
move she needs is one her partner has already made. The screen that offer leads
to has carried both doors since turn one, the address form and the join code,
but the offer itself speaks only of starting something new.

It was not a problem. She followed the offer and it put her exactly where she
needed to be: joining the move he had opened. The guard held and she found it
without help.

Recorded because the shape is worth keeping. A worry produced by reading the
source was answered by one question to the person it concerned, and the answer
was no.

## Notifications, asked for the third time

Nothing was dropped because nobody was told.

The reason given is the one that matters: the history is clear, and it carries
dates, names and references. The names are this turn's — check 1 built them, and
this is the first account of them doing work rather than existing.

`framing.md` has said since its second version that notifications return if use
shows a case of something dropped because nobody was told. Three turns, and the
condition still stands untriggered. It is not forgotten and it has not been met.

## What did not get exercised

**The two route descriptions.** He moved into a city, so the city route was used
for the third time and the local council and regional council routes remain
checked-but-never-used. Open since turn two, and still open, because it needs
somebody moving into one of them and no amount of building produces that.

**Deleting a move.** There is none, by design, and the move Tomer made to test
the ending panel is on his list permanently. He was not troubled by it: it was a
test, and everything on it was invented. Worth writing down anyway, because the
judgement was made about one board and not about a list that accumulates them.

## The three faults, and their single shape

Three faults were found this turn. All three were found by use, none by building,
and all three had the same shape.

1. The check written after the actor migration asked whether the log trigger was
   `security definer`. It was, and had been since turn two — so it passed while
   the migration's actual change had not landed.
2. Step 8 measured the panel that returns a person to a finished move: its
   direction, its edges, its rules. Every measurement was about the panel being
   right and none about the panel being *there*. It was rendered in one branch of
   one screen, and not the branch anybody would be standing in.
3. Check 4 proved that `end_move` writes two columns and deletes nothing. True,
   and still true. It never asked whether a person could reach what survived —
   and for the person holding it, a board that survives in the database and is
   behind no door is not meaningfully different from one that was deleted.

Each check was true. Each was adjacent to the thing that mattered. In every case
the check described a property of the change rather than the effect the change
was made for, and in every case the gap was invisible from the source and
obvious to somebody using it.

Whether this belongs in `CLAUDE.md` as a rule is Tomer's to decide, and it is
asked there rather than settled here.
