# Design decisions

- The existing Admin shell is reused; the account page does not introduce another sidebar/layout.
- Account summary cards: total, Admin, User, inactive.
- Table: name, email, role, status, creation date, actions.
- Toolbar: search, role/status filters, refresh; client-side pagination after Edge Function loads up to 1000 users.
- Add Account drawer: display name, email, role, temporary password.
- Role/status mutations require explicit confirmation.
- Disable preserves Auth user and all report rows; it applies an Auth ban and updates profile status.
- Last active Admin protection is enforced in the Edge Function.
- Reset-password flow is intentionally not added until the email recovery configuration and audit requirements are verified.
