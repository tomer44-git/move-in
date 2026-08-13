# move-in — Reverse interview

ASE-26 · Module 6 · 13 August 2026

I gave the agent a one-paragraph sketch and asked it to interview me, one focused
question at a time, pressing on every vague answer rather than accepting it. What
follows is the questions it asked and the assumptions it had to make where I said
nothing. The second list is the useful one.

## Questions asked

1. When does this tool stop being useful to you?
2. Does your partner use it, or only benefit from it?
   - 2b. How — one shared device, each from their own, or synced by talking?
   - 2c. Is there a real reason someone with the link should not get in?
3. Does the tool know what needs doing, or do you tell it? And what makes it
   worth building rather than a shared note?
4. Where does that knowledge come from, and who is responsible if it is wrong?
5. When does an item count as done?
6. What does an item look like between submitted and confirmed?
7. Is an item assigned to a person, or do you both watch everything?
8. Does the tool ever tell you something you did not ask?
9. Where does the personalised advice come from?
10. Does the tool send the request, or only write it?
11. What will it deliberately not do, that a reasonable person might expect?

## Where the interview changed the project

Question 8 pushed the idea from a status board to an advice tool, and question 9
showed that the advice would need a model to invent facts about civic procedure —
which is exactly where a model is most dangerous. I cut the advice back out and
kept the model for one job it is actually good at: phrasing a request from facts
I supply. That reversal is the most useful thing the interview produced.

## Assumptions the agent had to make

**Resolved during the interview**

- Interface language — Hebrew, right to left.
- Screen — desktop first, not mobile.
- Whether confirmation identifiers are stored — yes, as short text. No files.
- Size of the list — roughly 15 to 20 items.
- What happens when the move ends — the tool is reset, not deleted.

**Still open, on purpose**

1. Does the board show elapsed time — "request sent 12 days ago" — or only state?
2. Is the starting list fixed in the code, or editable in the tool?
3. Do items have an order or dependencies? Some do in reality: no water account
   before a signed contract.
4. What does the model know about me when it drafts? Name, address, account
   numbers — supplied once, or typed each time?
5. Does either of us get told when the other updates something, or do we only see
   it on opening?
6. Does an item added by hand also get a drafted request?

Each of these depends on whether it actually bothered us in use, which is not
something I can decide from a chair. They are the material for turn two.
