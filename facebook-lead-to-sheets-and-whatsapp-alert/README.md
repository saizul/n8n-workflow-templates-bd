# Facebook Lead Ads to Google Sheets and Owner Alert

When someone submits your **Facebook Lead Ad** form, the lead is normalised (Bangladesh phone numbers converted to international format), saved to **Google Sheets**, and the owner is alerted on **Telegram** (enabled) and/or **WhatsApp** (included but disabled by default).

## Nodes

| Node | Type | Purpose |
|------|------|---------|
| Facebook Lead Ads Trigger | `n8n-nodes-base.facebookLeadAdsTrigger` | Fires on each new lead |
| Normalize Lead | `n8n-nodes-base.code` | Flattens fields, formats phone `01XXXXXXXXX` -> `8801XXXXXXXXX`, builds alert text |
| Append Lead to Sheet | `n8n-nodes-base.googleSheets` | `appendOrUpdate` keyed on `LeadID` (no duplicates on retries) |
| Notify Owner (Telegram) | `n8n-nodes-base.telegram` | Sends alert to your chat |
| Notify Owner (WhatsApp) | `n8n-nodes-base.httpRequest` | Sends a WhatsApp template message (disabled by default) |

## Required credentials

- **Facebook Lead Ads OAuth2** (`facebookLeadAdsOAuth2Api`): needs a Meta app (App ID/Secret) with Lead Ads permissions; you must be admin of the Page
- **Google Sheets OAuth2**
- **Telegram API** (bot token from @BotFather) and your chat ID
- Optional: **Header Auth** with `Authorization: Bearer YOUR_TOKEN` for the WhatsApp Cloud API, plus an approved template named `new_lead_alert` with two body variables (name, phone)

## Setup

1. Create a `Leads` tab with header: `LeadID, Date, Name, Phone, Email, FormID, AdID, Status`.
2. Import the workflow. In the trigger node, re-select your **App, Page and Form** from the dropdowns (the placeholder values `YOUR_FACEBOOK_APP_ID`, `YOUR_PAGE_ID`, `YOUR_LEAD_FORM_ID` will not work as-is).
3. Set `YOUR_SPREADSHEET_ID`, and `YOUR_TELEGRAM_CHAT_ID` in the Telegram node.
4. Submit a test lead using Meta's Lead Ads Testing Tool, then activate.
5. For WhatsApp alerts: fill `YOUR_PHONE_NUMBER_ID` and `YOUR_OWNER_WHATSAPP_NUMBER`, select the credential, and enable the node. Business-initiated WhatsApp messages require an approved template.

## Customisation

- Add form-specific fields in `Normalize Lead` (the `pick(...)` helper takes several candidate field names).
- Add an auto-reply to the lead via WhatsApp or email.
- Add an IF node to route leads by `campaign` or `formId` to different owners.
- Facebook form field names depend on your form; check them in the first execution's output.
