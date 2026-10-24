---
version: 1
slug: "src-views-homeview-vue"
primary_target: "src/views/HomeView.vue"
related_targets: ["src/views/MathView.vue","src/views/ReadingView.vue","src/views/TestView.vue","src/views/PracticeView.vue","src/views/FriendsView.vue","src/views/ProfileView.vue","src/views/StickersView.vue","src/components/SessionSummary.vue"]
---

# Child screens

Scope: the child's screens (home, area lists, practice, session end, friends, profile). Mode: Operate. Audience: a 7-8 year old practicing alone on a tablet, one short session a day. Job: start today's 10 questions in one tap, see the collection grow, want to come back tomorrow. Constraints: RTL with nikud, gender-neutral wording, offline, no ranking between children. Parent screens are out of scope.

## Direction contract

THESIS: The app is the child's own sticker album, not a menu of app tiles. Its 16 stickers are achievements earned across all the areas (product truth: no new behavior, user's answer), each stuck into its numbered slot on the album's one sticker page; the areas themselves are the album's chapters, each a page with a printed index. Refuses the category default of a grid of same-size icon cards and a streak/XP bar.

OWN-WORLD: A deep blue album cover (#1446a0) around a white page with a rounded outer edge and a near-square spine edge. Coloured page tabs per area (reading pink-red, math amber with dark ink, tests green, friends violet). Stickers are coloured tiles with a thick white die-cut border, a slight tilt and a soft lifted shadow; empty slots are dashed outlines with the slot number. Lettering is Karantina, large; body is Rubik. Drawn SVG icons in one stroke, no emoji.

STORY: The child sees the album is theirs (their name on the cover), sees how many slots are filled, opens today's pack by answering 10 questions, and watches the new sticker land in its slot.

FIRST VIEWPORT: Cover band: "האלבום של <name>" in large Karantina on the right, filled/total count in gold on the left, streak and stars small under the title. Area tabs run down the right edge of the page. On the page: the red daily pack (the primary action) across the top, then "הַמַּדְבֵּקוֹת שֶׁלִּי" with its count and a 4-column grid of upright numbered slots (one undivided page: the stickers are cross-area achievements, so they have no chapters).

FORM: Panini and Pokemon sticker albums, the model's pick (2nd on the ordered list). seed:55e66c8fa206b26a

Signature interaction: at session end the pack tears open and the new sticker flies into its slot and settles with a tilt.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
