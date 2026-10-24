---
name: מחוננים – תרגול
description: The child's own sticker album, lying open on a blue cover; every screen is a white page of it.
colors:
  cover: "#1446a0"
  on-cover: "#ffffff"
  on-cover-soft: "rgba(255, 255, 255, .8)"
  primary: "#1446a0"
  on-primary: "#ffffff"
  bg: "#eef2fa"
  surface: "#ffffff"
  text: "#10224f"
  muted: "#5a6b96"
  reading: "#d6305f"
  math: "#ffb000"
  on-math: "#10224f"
  test: "#0f8a64"
  parents: "#6b4ae6"
  pack: "#c8264f"
  gold: "#ffd23f"
  flame: "#f26b1d"
  good: "#0f8a64"
  bad: "#d43a3a"
  warn: "#e09400"
  tint-soft: "#f2f5fb"
  tint: "#e6ecf8"
  tint-strong: "#c9d4ec"
  good-soft: "#dff4ec"
  bad-soft: "#fde8e8"
  warn-soft: "#fff3d6"
  accent-soft: "#fde6ee"
  test-soft: "#e2f3ee"
  line-soft: "#e3e8f2"
  line: "#c9d1e3"
  line-strong: "#9aa8c9"
  on-topbar-soft: "rgba(255, 255, 255, .16)"
  on-topbar-pressed: "rgba(255, 255, 255, .3)"
  overlay: "rgba(16, 34, 79, .5)"
typography:
  display:
    fontFamily: "Karantina, Rubik, Noto Sans Hebrew, Segoe UI, Arial, sans-serif"
    fontSize: "84px"
    fontWeight: 700
    lineHeight: 0.9
  headline:
    fontFamily: "Karantina, Rubik, Noto Sans Hebrew, Segoe UI, Arial, sans-serif"
    fontSize: "64px"
    fontWeight: 700
    lineHeight: 1
  title:
    fontFamily: "Karantina, Rubik, Noto Sans Hebrew, Segoe UI, Arial, sans-serif"
    fontSize: "46px"
    fontWeight: 700
    lineHeight: 1
  question:
    fontFamily: "Rubik, Noto Sans Hebrew, Segoe UI, Arial, sans-serif"
    fontSize: "34px"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Rubik, Noto Sans Hebrew, Segoe UI, Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.6
  body-strong:
    fontFamily: "Rubik, Noto Sans Hebrew, Segoe UI, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.3
  label:
    fontFamily: "Rubik, Noto Sans Hebrew, Segoe UI, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  page: "22px 6px 6px 22px"
  card: "18px"
  control: "16px"
  slot: "14px"
  label: "12px"
  pill: "999px"
  round: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "20px"
  xl: "24px"
  page-phone: "16px"
  page-tablet: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.card}"
    padding: "0 28px"
    height: "64px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.card}"
    padding: "0 28px"
    height: "64px"
  button-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "52px"
  choice-answer:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
    height: "84px"
  choice-answer-selected:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.text}"
  choice-answer-correct:
    backgroundColor: "{colors.good-soft}"
    textColor: "{colors.text}"
  choice-answer-wrong:
    backgroundColor: "{colors.bad-soft}"
    textColor: "{colors.text}"
  numpad-key:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    height: "72px"
  numpad-key-ok:
    backgroundColor: "{colors.good}"
    textColor: "{colors.on-primary}"
  album-tab-math:
    backgroundColor: "{colors.math}"
    textColor: "{colors.on-math}"
    rounded: "0 18px 18px 0"
    padding: "12px 10px"
    width: "88px"
    height: "112px"
  album-tab-reading:
    backgroundColor: "{colors.reading}"
    textColor: "{colors.on-primary}"
  album-tab-test:
    backgroundColor: "{colors.test}"
    textColor: "{colors.on-primary}"
  album-tab-friends:
    backgroundColor: "{colors.parents}"
    textColor: "{colors.on-primary}"
  chapter-head:
    textColor: "{colors.on-primary}"
    typography: "{typography.display}"
    rounded: "22px 6px 0 0"
    padding: "28px 32px 22px"
  index-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body-strong}"
    padding: "10px 4px"
    height: "100px"
  sticker-slot:
    textColor: "{colors.muted}"
    rounded: "{rounded.slot}"
  daily-pack:
    backgroundColor: "{colors.pack}"
    textColor: "{colors.on-primary}"
    typography: "{typography.headline}"
    padding: "44px 24px 40px 150px"
    height: "210px"
  feedback-slip:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "16px 20px"
  leaf-panel:
    backgroundColor: "{colors.tint-soft}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "20px"
---

# Design System: מחוננים – תרגול

## Overview

**Creative North Star: "The Child's Own Sticker Album"**

The app is a Panini or Pokémon sticker album that belongs to one child. A deep blue cover frames every screen. On it sits one white page with a rounded outer edge and a near-square spine edge, and coloured tabs stand out from that edge, one per area. Home is the album's sticker page: numbered slots, filled one by one with stickers the child earns. Each area is a chapter with a coloured head and a printed index. A practice round is the day's sticker pack. When it ends, the pack tears open and the new sticker drops into its slot, tilted.

Everything is built for a 7–8 year old reading Hebrew with nikud, alone, right to left, on an 800×1280 portrait Android tablet. It also works on phones. Targets are big, type is big, and every press gives physical feedback. The lettering is Karantina, a narrow display face that runs very large. The reading text is Rubik. Colour is used generously but always follows a role: blue for the cover and the main action, one colour per area, gold for anything earned, and green, amber and red for answers.

The world rejects the category default: a grid of same-size app tiles, a streak or XP bar, and emoji used as decoration. Icons are drawn in one stroke (AppIcon, a 24×24 grid with a 2.4 stroke in the current text colour). Emoji remain in exactly two places, and both are user data or question content, not decoration: the avatar each child picks, and the picture-riddle questions (generated in `src/generators/pictureRiddles.ts`).

Scope: this system covers the child's screens and the app shell. The parent screens (`src/styles/parents.css`, the `.parents` subtree, the question-bank editor, the families admin) and the device-setup screens were outside the redesign. They inherit these tokens but are not part of the world. Do not take them as a pattern source.

**Key Characteristics:**
- A blue cover around one white page, with the corner at the spine nearly square.
- Coloured album tabs on the page's edge, one per area. On a phone they run along the page's top.
- Stickers have a white die-cut border, a slight tilt and a soft lifted shadow. Empty slots are dashed and numbered.
- Karantina 700 for titles and big numbers. Rubik for everything that is read.
- Soft shadows tinted navy. A press pushes the element down or squeezes it, and it springs back slowly.

## Colors

A saturated album palette on white paper: a blue cover, one colour per chapter, and gold for whatever is earned.

### Primary
- **Album Cover Blue** (`cover` / `primary`): the cover around the page, the cover bar, and on the page the main action (the "next question" and "finish" buttons, the selected answer, the round's progress dots).

### Secondary
- **Sticker-Pack Crimson** (`pack`): the day's foil packet on home, the practice packs in the math chapter, the pack at the end of a round, and the "new stickers" heading. The foil sheen and crimp seals are local shades around it (the gradient's light #d93560 / #e25a7d, the dark #b01f45, and the seal #9e1b3d). They belong to the pack alone.
- **Earned Gold** (`gold`): the star icon, the sticker count on the cover, the pack's burst and band, and the stars pill at the end of a round. It is also the focus ring and the text-selection colour.
- **Streak Flame** (`flame`): the flame beside the day streak, on the cover and on the friend cards. One token for both grounds: it reads on the cover's blue and on white.

### Tertiary (chapter colours)
- **Reading Pink-Red** (`reading`): the reading tab and chapter head, the passage icon, and the numpad's erase key (on `accent-soft`).
- **Math Amber** (`math`) with **Navy Ink** (`on-math`): the math tab and head, the stars a topic has earned, and the mistake-review strip (on `warn-soft`).
- **Test Green** (`test`): the tests tab and head, and the real-test pack.
- **Friends Violet** (`parents`): the friends tab. The token keeps its old name.

### Answer states
- **Correct Green** (`good` on `good-soft`), **Try-Again Amber** (`warn` on `warn-soft`) for a first wrong try, and **Revealed Red** (`bad` on `bad-soft`) once the answer is shown.

### Neutral
- **Page White** (`surface`): the page, sticker borders, answer cards and keys.
- **Navy Ink** (`text`): all text on the page, the 3px rule under index headings, and the stroke on the pack's burst.
- **Faded Navy** (`muted`): instructions, meta lines, slot numbers and empty states.
- **Tinted Paper** (`tint-soft`, `tint`, `tint-strong`): passage leaves, test cards, pressed rows, the label tile on an answer.
- **Printed Lines** (`line-soft`, `line`, `line-strong`): dividers, dashed slots, the index's dotted leaders, and the 3px borders on pressable controls.
- **Cover Whites** (`on-cover`, `on-cover-soft`, `on-topbar-soft`, `on-topbar-pressed`): text, stats and the back button on the cover.

### Named Rules
**The Chapter Colour Rule.** Each area owns one colour. Its tab, chapter head and index tiles all wear it, and no other area borrows it.

**The Gold Is Earned Rule.** Gold marks what the child has earned (stars, the sticker count, the pack's burst) and the focus ring. It is never the fill for an ordinary button or panel.

**The Dark Ink on Amber Rule.** Anything on `math` or `gold` uses navy ink (`on-math` / `text`), never white.

## Typography

**Display Font:** Karantina 700 (falling back to Rubik), self-hosted with Hebrew and Latin subsets.
**Body Font:** Rubik 400 and 700 (with Noto Sans Hebrew, Segoe UI and Arial as fallbacks), self-hosted with Hebrew and Latin subsets.

**Character:** Karantina is the album's printed lettering: narrow, inky and loud, and it carries nikud well at very large sizes. Rubik is a round, calm reading face, set large with generous leading so nikud has room.

### Hierarchy
- **Display** (Karantina 700, 84px, 0.9; 56px on a phone): the chapter title in the coloured chapter head.
- **Headline** (Karantina 700, 64px, 1; 44–48px on a phone): the album name on the cover, the pack's "today's pack", and the end-of-round title. The cover's gold count (60px) and the chapter count (56px) use the same lettering.
- **Title** (Karantina 700, 46px, 1; 38px on a phone): section headings in the index and on the sticker page. Profile names (40px), passage titles (40px) and slot numbers (44px) sit on this step.
- **Question** (Rubik 400, 34px, 1.55 on a tablet; 26px, 1.7 on a phone): the question itself. It is the main thing on its page.
- **Body** (Rubik 400, 22px, 1.6): base text and instructions. Answers are 28px on a tablet and 24px on a phone.
- **Body Strong** (Rubik 700, 24px, 1.3): index row titles, button labels, feedback messages (28px).
- **Label** (Rubik 400, 16px, 1.4): meta lines, sticker hints, and the stats on the profile card (13–15px there).

### Named Rules
**The Lettering Rule.** Karantina is used only at display sizes, for titles, counts, slot numbers and the pack. Anything the child reads in order to act (instructions, questions, answers, buttons) is set in Rubik.

**The Room for Nikud Rule.** Running text keeps a line-height of 1.55 or more, and the question grows on a tablet rather than shrinking to fit.

## Layout

The page is one white sheet centred on the cover, at most 1200px wide (1100px when the tabs are beside it). Its padding is 16px on a phone and 32px from 700px up, exposed as `--page-pad` and `--page-top` so heads can bleed to its edges. From 700px, the page shifts inward by the tab width (88px plus 16px), and the tabs hang off its right edge onto the cover, starting 24px from the top. Under 700px there is no room beside the page, so the tabs become a row of equal columns hanging from the page's top edge, with the chapter head directly below them.

The cover bar spans the full width. On home it is a three-column grid: the album name with the stars and streak beneath it, the gold count, and the avatar. Elsewhere it holds a round back button and the screen title.

Home stacks the pack, the mistake-review strip if there are mistakes, then the sticker page: a 4-column grid of 3:4 slots with 16px gaps (10px on a phone). Chapters stack a full-bleed head, then index sections, each a heading with a 3px navy rule followed by rows. Reading questions and mock tests place the passage beside the question at 1000px and above, and above it otherwise.

Spacing follows 4px steps, mostly 8, 12, 16, 20 and 24. Breakpoints are 700px (phone versus tablet) and 1000px (landscape, side by side).

## Elevation & Depth

Depth is paper on paper: the page lifts off the cover, stickers lift off the page, and tabs cast a shadow onto the cover. Every shadow is soft and blurred, tinted navy (rgba of 16, 34, 79 on the page, 5, 16, 50 on the cover). There are no hard offsets and no black. Stickers and the pack use `drop-shadow` so the shadow follows their die-cut shape. A press reduces or removes the shadow along with the downward move.

### Shadow Vocabulary
- **Page lift** (`box-shadow: 0 18px 40px rgba(5, 16, 50, .35)`): the page on the cover.
- **Float** (`box-shadow: 0 10px 24px rgba(5, 16, 50, .35)`): the update banner.
- **Raised** (`box-shadow: 0 6px 14px rgba(16, 34, 79, .16)`): the primary button and the stars pill.
- **Resting** (`box-shadow: 0 2px 4px rgba(16, 34, 79, .16)`): answer cards, keys, the speak button, secondary buttons.
- **Tab** (`box-shadow: 4px 6px 12px rgba(5, 16, 50, .3)`; on a phone `0 4px 8px rgba(16, 34, 79, .2)`): the album tabs.
- **Sticker** (`filter: drop-shadow(0 4px 6px rgba(16, 34, 79, .28))`): sticker art. The pack uses `drop-shadow(0 10px 12px rgba(16, 34, 79, .3))`.

### Named Rules
**The Lifted Paper Rule.** Shadows are soft and navy-tinted, and they say "this is a piece of paper on top of another". A hard offset shadow does not belong in this world.

## Shapes

The page is the shape that defines the world: 22px corners on its outer edge and 6px at the spine. Things a finger presses are gently rounded, 16–18px. Sticker slots and stickers have 3:4 proportions with 14px corners (10px on a phone). Small chips and counts are pills, and the back, speak and next-arrow controls are circles.

Lines are printed rules. A dashed 3px `line` marks an empty sticker slot or a progress dot not yet answered. A dashed 2px line divides index rows, and a dotted 3px leader runs from a row's title to its end, as in a printed index (hidden on a phone). Solid 3px borders belong to pressable controls. A sticker's white die-cut edge is 4–6px of `surface` around a coloured face.

### Named Rules
**The Spine Rule.** The page, and the chapter head that bleeds to its top, are round on the outer edge and nearly square at the spine.

**The Crooked Sticker Rule.** Anything stuck into the album sits a little crooked: owned stickers at -3°, 2° and -1° in a repeating pattern, area tiles at -3°, friend cards at ±1.5°, answered progress dots at -4° and 3°, and the feedback stamp at -8°. Empty slots and everything printed on the page stay upright.

## Components

### Buttons
- **Shape:** gently rounded (18px), 64px tall, 28px of horizontal padding, 3px border.
- **Primary:** Album Cover Blue with white Rubik 700 at 24px, the raised shadow, and an AppIcon arrow at the end.
- **Secondary:** white with a `line` border and navy text, and the resting shadow.
- **Pill:** white with a 2px `line` border and muted text, 52–56px tall (for "someone else practicing?" and "change picture").
- **Press:** `translateY(2px)`. Answer cards and keys also lose their shadow when pressed.

### Answer choices
- A full-width white card (16px corners, 3px `line` border, resting shadow), 84px tall on a tablet and 72px on a phone. Each starts with a letter tile: Karantina on `tint`, 56px with 12px corners.
- Selected: blue border on `tint`, and the tile turns blue. Correct: green border on `good-soft` with a 0.35s pop. Wrong: red border on `bad-soft` at 0.7 opacity with a 0.35s shake.

### Number pad
- A 3-column grid, at most 380px wide, of white 72px keys in Rubik 700 at 34px with tabular figures. The erase key is pink on `accent-soft`. The OK key is solid `good`.

### Album tabs (navigation)
- 88px wide and at least 112px tall, with corners rounded only on the outer side (0 18px 18px 0). Each has its area's colour, an AppIcon at 34px over a Karantina label at 28px, and the tab shadow. The open chapter's tab stands 12px further out.
- Press: pulled out 10px in 0.08s, then eased back over 0.35s with `cubic-bezier(.16, 1, .3, 1)`. On a phone the tabs hang down (corners 0 0 14px 14px, 64px tall, 74px when open) and lift 6px when pressed. With reduced motion this becomes a 4px or 3px nudge with no transition.

### Chapter head
- A full-bleed band in the area's colour at the top of the page, with corners 22px 6px 0 0. The display title sits on the right and the done/total count in Karantina 56px on the left.

### Index rows
- A row at least 100px tall: an area tile (64px, white 4px border, -3° tilt, numbered 58×76 when it is a sticker-shaped tile), a Rubik 700 title with a meta line, a dotted leader, an optional end item (stars, a done chip), and a 44px circular "next" button with a `line` border. The row's background turns `tint-soft` when pressed.

### Sticker slot and sticker
- Slot: 3:4, a 3px dashed `line` border, 14px corners, and the slot number in Karantina in `muted`.
- Sticker: drawn SVG with a white 12px-radius die-cut, a coloured face, the art in white with navy strokes, and a numbered strip at its foot. It has the sticker drop-shadow and a tilt.

### The day's pack (signature)
- A foil packet on home, at least 210px tall (160px on a phone). It has a 115° crimson gradient sheen, a dotted print at 22px intervals, toothed crimp seals 26px wide standing out past both ends, a gold band along the bottom, and a gold 12-point burst holding the question count. The album's name is printed small across its top, as on a real packet's wrapper. That small line belongs to this object only and is not a label style.
- Press: squeezed (`scale(.96) rotate(-1.5deg)`) in 0.08s, back over 0.45s with `cubic-bezier(.16, 1, .3, 1)`. With reduced motion, `translateY(3px)`.

### End of round (signature motion)
- The pack rises in (0.5s), shakes (0.4s), and its strip tears off (0.6s). The gold stars pill rises in, and each new sticker drops from above into its dashed slot and settles at -4° (0.7s, `cubic-bezier(.34, 1.4, .64, 1)`, staggered by `--delay`). With reduced motion, everything appears in its final state.

### Feedback slip
- A tinted slip with 18px corners in the answer's soft colour. It has a 52px round stamp in the tone colour, holding an AppIcon tilted -8°, the message in Rubik 700 at 28px, the explanation with a speak button, and a primary "next" button. It slides in 12px over 0.25s.

### Leaf panels
- Passages and test cards are tinted paper slipped into the album: `tint-soft` with a 2px `line-soft` border and 18px corners.

### Profile card
- A sticker-like card: a white 6px die-cut border, 20px corners, the child's colour behind their avatar, the name in Karantina at 40px, and a 4-column stats row under a dashed rule. The current child's card has a 4px blue ring.

## Do's and Don'ts

### Do:
- **Do** put every screen on the white page on the blue cover, with the page's 22px outer and 6px spine corners.
- **Do** give each area its own colour across its tab, chapter head and tiles, with navy ink on amber and gold.
- **Do** set titles, counts and slot numbers in Karantina 700 at display sizes, and everything the child reads to act in Rubik.
- **Do** draw icons with AppIcon (one 2.4 stroke on a 24×24 grid, `currentColor`).
- **Do** give every pressable thing a physical press (`translateY(2px)`, a tab pulled out, the pack squeezed) and a reduced-motion version.
- **Do** keep stuck-in things a little crooked and printed things upright.
- **Do** keep shadows soft and navy-tinted.

### Don't:
- **Don't** lay the areas out as a grid of same-size app tiles, or add a streak or XP bar.
- **Don't** use emoji as decoration. Only a child's chosen avatar and picture-riddle question content may be emoji.
- **Don't** use text glyphs (arrows, ticks, crosses) as icons.
- **Don't** add small tracked kicker or eyebrow lines above headings. The pack's printed wrapper line is part of that object and is not a pattern to copy.
- **Don't** use hard offset or black shadows.
- **Don't** put white text on `math` amber or `gold`.
- **Don't** take patterns from the parent screens. They inherit these tokens but are not part of the album.
