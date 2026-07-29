# HOAI final review fixes — design

## Goal

Close the final review findings without changing the POC's product scope.

## Changes

1. Reject impossible calendar dates for compact numeric and delimited date inputs. Preserve the original value and add `invalid_date`.
2. When any spend-line chunk fails, retain the batch for diagnostics but change its status from `ready` to `failed`.
3. Enforce that every `spend_line.user_id` owns the referenced `import_batch`.

## Non-goals

- No retry or batch cleanup UX.
- No new analytics filters in this fix.
- No schema beyond the owner-consistency trigger.
