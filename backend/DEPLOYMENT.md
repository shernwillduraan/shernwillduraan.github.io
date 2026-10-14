# Hybrid Traders Online Academy — One-time backend deployment

The website pages in the repository are updated to use the Academy API. The live Google Apps Script deployment is separate and must be updated once before the new flow can work end-to-end.

## What this backend records

- **Students**: the existing 12 columns are preserved: Timestamp, Student ID, Full Name, Email, WhatsApp, Package, Status, Payment Status, Access Code, Activated At, Last Login, Notes.
- **Activity**: registration, student login/failures, owner login, activation, status changes and module completion.
- **Progress**: module completion by student.
- **Journal** and **Assessments**: prepared as records tabs for future website tools.
- Owner dashboard: student list, counts, payment status, activity log, activation and suspension/status controls.

## Deploy once

1. Open the current Academy Apps Script project.
2. Make a backup copy of the current `Code.gs` before replacing anything.
3. Open this file in GitHub: `backend/Code.gs`. Copy its entire contents into the existing `Code.gs`, replacing the old source. Do not paste it underneath the old source; that would cause duplicate function/constant errors.
4. In the new source, find `spreadsheetId: ''`. If your Apps Script project is **standalone**, paste the existing Google Sheet ID between the quotes. If the script is bound directly to the Academy spreadsheet, leave it blank.
5. Save the script. Select and run `setupAcademy()` once, approve the Google permissions, and check the execution log says it completed. It only writes headers when a tab's first row is empty; it does not replace the existing Students header or records.
6. Select and run `sendOwnerSetupLink()` once. Approve email permission if asked. A one-time owner password setup link will be sent to `shernwillduraan@gmail.com`. Open that email and set a unique password of at least 14 characters on the Academy admin page. Do not share this password in chat or add it to GitHub.
7. Go to **Deploy → Manage deployments → Edit** (pencil) → choose **New version** → **Deploy**. Keep the deployment as a web app that executes as you and is accessible to anyone, because students use the public registration/login page. The backend still requires an owner password for admin actions.
8. Open the existing `/exec` URL and confirm the response says the Academy service is online, version 5.2.
9. Hard-refresh the website with Ctrl+F5. Test a registration using your own email first. Check the Students row and registration email. Do not test with a real student's details until this passes.



**Important safety note:** The GitHub backend source is now version 5.2 and fixes duplicate-email detection. This change does not alter the private Google Apps Script deployment automatically. The existing deployed backend remains in place until the new source is copied into Apps Script and redeployed. No student rows or sheet headers are changed by this code fix.

## Payment and activation

Until Stripe or another verified payment provider webhook is configured, **payment is not auto-confirmed by the website**. The owner must independently verify the $100 payment in the payment provider/bank record, then use **Owner Dashboard → Verify & activate**. The backend then sets Payment Status to Paid, sets Status to Active, generates a fresh access code, emails it to the student and records the action in Activity. The public website cannot activate an account by sending a fake “payment successful” message.

Automatic activation immediately after successful payment is a separate payment-provider integration. It requires a verified provider webhook and private credentials; do not paste secret keys into GitHub or a public page.

## Live test checklist

- Registration creates exactly one new row in Students and sends confirmation emails.
- Duplicate email registration is rejected.
- Pending/unpaid student cannot log in.
- Owner login works only with the configured owner email and password.
- Owner dashboard shows students, counts and recent Activity.
- After payment is independently verified, Verify & activate marks the student Paid/Active and emails the code.
- Active student can log in; invalid code and suspended accounts are rejected.
- Marking a module complete writes to Progress and Activity.
- Signing out removes the browser's student session.

If a browser reports a cross-origin/network error, check **Apps Script → Executions** to see whether the server received the request before retrying, so you do not create duplicate registrations.
