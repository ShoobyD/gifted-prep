# MySmartKid – notes

Source: https://mysmartkid.co.il/ (checked 2026-10-07)

## Summary

- **No free PDF can be downloaded directly.** The "free sample test" is offered as "מבחן לדוגמה (מקוצר) - חינם!", but its button ("קבלו מבחן בחינם") goes to `register.php?intent=free-sample`, which requires an account. The page HTML has no `.pdf` link. **Nothing was downloaded.**
- **There is a free demo with no sign-up:** https://mysmartkid.co.il/demo.php
  - Stage A demo: https://mysmartkid.co.il/demo.php?test_stage=stage_a
  - Inside the demo: "5 שאלות בכל דמו". You can pick a topic, in either practice mode (feedback and hints) or simulation mode (timed):
    - 📖 הבנת הנקרא – reading passages, word meaning from context, inference, finding details, main message
    - 🔢 פעולות חשבון – the four operations, inequalities, filling in missing values
    - 🧮 בעיות מילוליות – word problems
    - 🧩 חידות בציורים – picture riddles (symbols stand for numbers)
    - plus a "smart AI" mode that picks demo questions
  - The demo questions load in an interactive JavaScript quiz (`quiz.php?demo=1&topic_id=…&mode=…&test_stage=stage_a`). The demo page HTML holds no question text, so nothing was transcribed. A parent can open it in a browser and try it with the child.
  - There is also a demo parent dashboard, filled with sample data only.

## Product details (from the home page)

- Covers grades 2–4, Stage A and Stage B. Stage A covers reading comprehension and math.
- Plans:
  - Free plan (partial question access, one short test)
  - Premium: ₪49 per month
  - Family: ₪249 per 6 months
  - Printable PDF tests: from ₪30–40 each, and the short sample test is free after registering
- Claims "3000+" practice questions.

## Skipped

- The free short PDF test (needs registration: email and password).
- Registration and login pages were not touched.
