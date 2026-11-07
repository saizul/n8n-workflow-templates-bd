# bKash / Nagad Payment SMS Log and Order Match

Logs incoming mobile-money payments from **forwarded SMS text**, matches them to pending orders, and replies to the customer.

> **Important:**
> - This template does **not** use any official bKash or Nagad API. It only parses the text of SMS messages that your own phone already received and forwarded to an n8n webhook.
> - **Never store, forward, or process PINs, OTPs, or passwords.** Real payment-received SMS do not contain them. The Code node drops any message mentioning PIN/OTP and never stores the raw SMS text.
> - SMS text formats are controlled by bKash/Nagad and may change. Test with your own messages and adjust the regexes.
> - SMS text can be faked (for example a spoofed sender name). Protect the webhook with the shared secret, forward only from your own phone, and verify large payments in your real bKash/Nagad app before delivering goods.
> - Not affiliated with bKash or Nagad. Check their terms for merchant use.

## Flow

1. An Android SMS-forwarder app (any app that can POST JSON on incoming SMS, restricted to sender `bKash` / `NAGAD`) sends `{ "from": "bKash", "message": "<sms text>" }` to the webhook with header `x-webhook-secret`.
2. The Code node extracts **amount, sender number, TrxID** and provider.
3. The payment is logged to Google Sheets (keyed on TrxID, so retries do not duplicate).
4. Pending orders are read; the payment is matched by amount (and by sender number if several orders share the amount).
5. Match: order marked `Paid`, customer gets a WhatsApp confirmation. No match: owner gets a Telegram alert for manual review.

## Nodes

| Node | Type | Purpose |
|------|------|---------|
| SMS Webhook | `n8n-nodes-base.webhook` | Receives forwarded SMS JSON |
| Secret OK? | `n8n-nodes-base.if` | Checks `x-webhook-secret` header; wrong secret = ignored |
| Parse Payment SMS | `n8n-nodes-base.code` | Regex extraction for bKash and Nagad, sensitive-message filter |
| Parsed OK? | `n8n-nodes-base.if` | Valid payment vs. unreadable |
| Log Payment | `n8n-nodes-base.googleSheets` | `appendOrUpdate` into `Payments` |
| Read Pending Orders | `n8n-nodes-base.googleSheets` | Reads `Orders` where `Status = Pending` |
| Match Against Pending Orders | `n8n-nodes-base.code` | Amount (and phone) matching |
| Matched? | `n8n-nodes-base.if` | Routes result |
| Mark Order Paid | `n8n-nodes-base.googleSheets` | Updates `Orders` row by `OrderID` |
| Reply to Customer (WhatsApp) | `n8n-nodes-base.httpRequest` | WhatsApp Cloud API confirmation |
| Alert Owner: Unmatched Payment / Unreadable SMS | `n8n-nodes-base.telegram` | Manual review alerts |

## Required credentials

Google Sheets OAuth2, Telegram API, Header Auth for WhatsApp Cloud API (`Authorization: Bearer YOUR_TOKEN`).

## Setup

1. Sheets: `Payments` tab with `TrxID, Date, Provider, Amount, SenderNumber, MatchedOrder`; `Orders` tab with at least `OrderID, Phone, WhatsApp, Total, Status, TrxID` (compatible with `whatsapp-order-bot`).
2. Import, set `YOUR_SPREADSHEET_ID`, `YOUR_WEBHOOK_SECRET`, `YOUR_PHONE_NUMBER_ID`, `YOUR_TELEGRAM_CHAT_ID`, and credentials.
3. Activate and copy the Production URL (`.../webhook/payment-sms`). It must be reachable over HTTPS from the phone.
4. In the SMS-forwarder app, add a rule: sender contains `bKash` (and another for `NAGAD`), method POST, JSON body with `from` and `message` fields (field names `from/sender/address` and `message/text/body/content` are all accepted), header `x-webhook-secret: YOUR_WEBHOOK_SECRET`.
5. Send yourself a test payment or paste a sample SMS into a manual request.

## Customisation

- Update the regexes in `Parse Payment SMS` if the message wording changes. Add Rocket or other providers the same way.
- Change matching rules (for example require the order reference in the payment's reference field) in `Match Against Pending Orders`.
- Replace WhatsApp with SMS, email or Messenger for the customer reply.
- The "Unreadable SMS" alert also fires for non-payment SMS that slip through; restrict senders in the forwarder app to keep it quiet.
