# Blue stays the accent, with a scoped job

Framr's chrome wraps a photograph the user is colour-judging, so the interface has to stay
colour-neutral around it - a warm accent bleeds into how you read the image's white balance,
which is why Lightroom, Capture One, and physical darkrooms are all neutral-cool. We keep blue
(anchor hue 250) as the accent for that reason, not because it was already there.

What changed is the accent's job, not its hue. It previously did eight jobs at once - primary
button, active segment, toggle track, selected chip, slider thumb, focus ring, selected-row
border, and progress fill - across 67 usages, so "selected" carried no hierarchy when several
controls were active at once. The accent is now capped at 3% of any viewport with exactly two
jobs: the focus ring and the single primary action. Selection is expressed through surface
elevation, an accent hairline, and font weight instead.

## Considered options

A fully neutral chrome with no chromatic accent at all (the Capture One position) was the most
colour-honest, but it leaves the primary action with no pull and reads cold. A warm accent
(amber or terracotta) was the most visually distinctive and the furthest from the generic
look blue invites - rejected because warm chrome shifts the perceived white balance of the
photograph being judged, which is the one thing this tool must not do.

## Consequences

Blue in Framr is a deliberate instrument choice, not a default. Before changing it, check that
the replacement does not tint perception of the image it surrounds. Distinctiveness has to come
from the neutrals, the type scale, and the data voice - see `SPEC_WEB_VERSION.md` sections 4.3
and 4.4, and the `Accent budget` entry in `CONTEXT.md`.
