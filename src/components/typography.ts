/**
 * The chrome's heading voice, declared once.
 *
 * SPEC 4.4 asks for ONE heading voice and the interface shipped three: an 11px
 * ALL-CAPS micro-label on the sidebar sections, 16px sentence case at 500 on the
 * preset-group and popover headings, and 16px at 400 on one accordion trigger
 * whose sibling trigger, stacked directly below it in the same panel, rendered
 * at 500.
 *
 * WHY 16px SENTENCE CASE WINS, AND NOT THE ALL-CAPS MICRO
 * Both binding tables name it. SPEC 4.4's scale gives `--text-base` to "Section
 * headings, drawer titles", and the mapping rule in globals.css spells the role
 * out in full - "Section heading, accordion trigger, drawer title, preset-group
 * heading -> --text-base". The ALL-CAPS micro was the single dissenting site, and
 * it was outnumbered six to one across the app.
 *
 * The decision procedure's step 1 ("Is it ALL-CAPS? -> text-micro") does not
 * argue the other way. It routes text that is *already* all-caps to the right
 * size; it is not a licence to set a section heading in all-caps and then claim
 * the micro token. `--text-micro` keeps its real job below: eyebrows and group
 * labels *inside* a control, which are not headings of anything.
 *
 * There is no separate accordion-trigger voice. A trigger is a section heading
 * that happens to be clickable, so it takes the same size, weight, and colour,
 * and adds only the button chassis it needs to be operable.
 */
export const SECTION_HEADING = 'text-base font-medium text-ink';

/**
 * A section heading that opens a disclosure. Same voice as SECTION_HEADING plus
 * the chassis both accordion triggers share: full-bleed hit area, the chevron
 * pushed to the far edge, and a focus ring that is outline-only so no transition
 * can ever catch it.
 */
export const ACCORDION_TRIGGER = [
  SECTION_HEADING,
  'flex w-full cursor-pointer items-center justify-between gap-2 rounded-md py-2',
  'focus-visible:outline-2 focus-visible:outline-offset-2',
].join(' ');

/**
 * An eyebrow or a group label sitting *inside* a control - the sticky
 * Recent/Featured/All dividers in the font list, for instance. This is what
 * `--text-micro` is for, and it is deliberately not a heading: it labels a run of
 * rows within one widget rather than a region of the page. The token carries its
 * own letter-spacing, so never add `tracking-wide` alongside it.
 */
export const MICRO_LABEL = 'text-micro uppercase text-muted';
