# Quiz Data Requirements (Max Pair + Missing Data Behavior)

This doc explains how quiz data is interpreted by the engine, and what minimum data is required for correct unlock behavior.

## 1) How `maxPair` is computed
- `maxPair` is derived **only** from `quiz_questions`:
  ```sql
  SELECT MAX(topic_pair_index) FROM quiz_questions WHERE course_id = ? AND module_no = ?
  ```
- This value determines whether a passed quiz should mark the **module** as passed.

## 2) Minimum required quiz data per module
For every module you want to gate:
- At least **1 quiz question** per `topic_pair_index` that exists in that module.
- The **highest** `topic_pair_index` must exist, or the module can never pass.

Recommended minimum:
- For each module with N lessons → topic pairs = `ceil(N / 2)`.
- For each pair, seed at least 1 question + options.

## 3) Behavior when data is missing
- If `quiz_questions` has **no rows** for a module:
  - `/quiz/sections/:courseKey` returns **no sections** for that module.
  - The frontend will not show a quiz for that module, but lessons can still appear.
  - **Module unlock gating becomes inconsistent** because module state depends on quiz sections.

- If the **last topic pair** is missing:
  - `maxPair` is lower than expected.
  - Module pass can only occur at that lower pair.
  - If a user passes a later quiz (that isn’t maxPair), the module will **not** be marked passed.

- If a quiz attempt has **no questions**:
  - `/quiz/attempts/:id/submit` returns `400` "Attempt has no questions to grade".

## 4) Module count derivation (used in tutor dashboard)
- Tutor progress totals are based on `topics` table:
  - Distinct `module_no` where `module_no > 0`.
- If topics are missing or module_no values are incorrect, progress totals will be wrong even if quiz data is correct.

## 5) Summary: required consistency
To avoid unlock bugs, keep these aligned:
- `topics` (module_no + topic_number)
- `quiz_questions` (module_no + topic_pair_index)
- `quiz_options` (for each question)

