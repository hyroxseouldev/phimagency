# PHIM STUDIO Contact Form Apps Script

1. Open the target spreadsheet:
   https://docs.google.com/spreadsheets/d/1VqB0qy-r7ZDdlgS99TGGl84e0RQD3V60hJj4_o5sSck/edit
2. Go to Extensions > Apps Script.
3. Paste `contact-form.gs` into the Apps Script editor.
4. Deploy > New deployment > Web app.
5. Use these settings:
   - Execute as: Me
   - Who has access: Anyone
6. Authorize the script once with your own Google account if Apps Script asks.
   - If Google shows `Google hasn't verified this app`, click `Advanced`, then continue to the project.
   - This warning is expected for a personal Apps Script that has not gone through Google's public app verification.
   - Only the script owner should complete this authorization step. Site visitors should not see this screen when the deployment is configured as below.
7. Copy the deployed Web app URL that ends with `/exec`.
   - Do not use the test URL that ends with `/dev`; it requires editor access and can ask visitors to authorize Google account access.
   - If visitors still see an authorization screen, open Deploy > Manage deployments, edit the deployment, and confirm `Execute as: Me` is selected.
   - If `Anyone` is unavailable, your Google Workspace admin may be blocking public web apps.
8. Replace `PASTE_APPS_SCRIPT_WEB_APP_URL_HERE` in `index.html` with the `/exec` URL.

The script appends submissions to the `Contact Submissions` tab and ignores requests where the hidden `website` field is filled.

## Slack Notification

The script can send a Slack notification after a contact submission is saved.

1. In Slack, create an Incoming Webhook for the channel that should receive contact alerts.
2. Copy the Slack webhook URL.
3. In Apps Script, open Project Settings.
4. Under Script Properties, add:
   - Property: `SLACK_WEBHOOK_URL`
   - Value: the Slack Incoming Webhook URL
5. Save the property.
6. Deploy > Manage deployments > Edit the active web app deployment.
7. Create a new version and deploy it.

Do not paste the Slack webhook URL into this repository. Treat it like a secret.

If the Slack webhook is missing or invalid, the form submission still saves to the sheet. The Slack failure is only written to Apps Script logs.
