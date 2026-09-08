# Endorsement administration

The current workflow uses Cloudflare Pages Functions, D1, Turnstile and Resend. Google Sheets and Apps Script are no longer used. See the README sections **Endorsement workflow**, **D1 setup and Pages binding**, **Email provider and Turnstile setup**, **Environment variables**, and **Review and debug endorsements** for current operating instructions.

Only approved name and role are public. Email, timestamps and moderation tokens remain private. Review links expire after seven days and require a confirmation POST; following a link alone never changes state.
