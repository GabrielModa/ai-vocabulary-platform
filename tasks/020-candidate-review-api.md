# 020 — Add candidate review and confirmation API

## Goal

Expose an application boundary for an authenticated learner to review, edit, reject, and confirm
their own draft candidates.

## Requirements

- Deny anonymous and non-owner access.
- Validate edits through domain rules and keep edited candidates proposed.
- Confirm only an explicit, non-empty selection.
- Return stable safe error codes without collection content.

## Files allowed

`packages/vocabulary/**`, `tasks/**`, API contract documentation.

## Expected commit

`feat(vocabulary): add candidate review service`
