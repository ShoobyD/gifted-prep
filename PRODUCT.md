# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

An installable PWA (Vue 3 + Vite + TypeScript, served by Cloudflare Pages with D1). The child's primary device is an Android tablet; parents use the same site on a phone or computer.

## Users

- **The child (primary):** a second-grader in Israel (about 7–8) preparing for stage A of the Ministry of Education's gifted-identification test (usually early December). Uses the app **alone on a tablet, in one short session a day** (10–15 minutes), with no adult beside them. Reads Hebrew with nikud.
- **The parent:** tracks the child's progress from a phone or computer, changes the child's settings, and manages the family's children. Never practices in the app.
- **The admin (the app's owner):** a parent who also edits the shared question bank and creates accounts for the other families.
- **Other families:** a few close relatives' families with children of the same age, each with its own password and children.

## Product Purpose

Prepare children for the stage-A test: reading comprehension (informational and story passages with multiple-choice questions) and math (exercises, missing number, inequalities, word problems, picture riddles, symbol digits), plus full mock tests in the 2025 booklet's structure.

Success is a child who **wants to come back every day** for a short session. When enjoyment and test realism pull apart, habit and enjoyment win in daily practice; realism belongs to the mock tests.

## Positioning

A free, private family app: the real official test material and prep-site samples, infinite generated math questions that adapt their level, and read-aloud, working offline on the child's own tablet. Children see each other's achievements across the families (stars, stickers, streaks) as profiles, never as a ranking.

## Operating Context

- The child opens the installed app on the tablet, practices a short set (10 questions) or a mock test, and collects stars and stickers. A tablet is either one child's or shared, with a "who is practicing?" screen.
- Progress syncs to the server; the parent looks at it later on a phone or computer.
- New versions arrive through an in-app "new version" banner; an update never interrupts a test.

## Capabilities and Constraints

- **Private by necessity:** the question bank holds copyrighted official tests and prep-site samples for personal use only. Everything sits behind a password-only family login; nothing may be made public.
- **Offline-first:** the app, fonts and the last-loaded question bank must work without internet after the first load.
- **Hebrew, right-to-left.** Child-facing text carries nikud; parent-facing text does not.
- **Gender-neutral toward the child:** children are boys and girls, so the app never addresses the child in the masculine singular (plural instructions like "קִרְאוּ", or neutral nouns).
- **No ranking between children,** so nobody comes last.
- Runs on Cloudflare's free plan (small CPU budget per request).

## Brand Commitments

- Name: **מחוננים – תרגול**.
- Voice toward the child: warm and encouraging, praising effort rather than only the score, never punishing a mistake ("לֹא נוֹרָא, נְנַסֶּה שׁוּב").
- Voice toward parents: plain and factual, no nikud.

## Evidence on Hand

- Official test material and research: `resources/` (the 2025 test, its answer key, the sample booklet, prep-site samples, and a research summary).
- The question bank lives in the database (exported with `npm run db:export`); it is not in the code.
- No testimonials, reviews, or usage statistics exist; none may be invented.

## Product Principles

1. **Come back tomorrow:** a short, pleasant daily session beats a long, exhausting one.
2. **The child can do it alone:** every screen explains itself to a 7-year-old without an adult.
3. **Mistakes are safe:** feedback encourages, explains, and offers another try.
4. **Mock tests stay true to the real test,** so the real one holds no surprises.
5. **Together, not against each other:** children share achievements without competing for a place.
