# WhatsApp Order Bot (Bangla/English)

Receives customer messages through the **WhatsApp Cloud API**, parses an order written in Bangla or English (Bangla digits supported), appends it to **Google Sheets**, and replies with an order summary. Unreadable messages get a short "how to order" help reply in the customer's language.

## Example customer message

```
নাম: রহিম
ফোন: ০১৭১২৩৪৫৬৭৮
ঠিকানা: মিরপুর, ঢাকা
২ x Panjabi
Saree x 1
```

## Nodes

| Node | Type | Purpose |
|------|------|---------|
| Webhook Verify (GET) | `n8n-nodes-base.webhook` | Meta webhook verification request |
| Verify Token OK? | `n8n-nodes-base.if` | Checks `hub.verify_token` |
| Respond Challenge / Respond Forbidden | `n8n-nodes-base.respondToWebhook` | Returns `hub.challenge` or 403 |
| Webhook Incoming (POST) | `n8n-nodes-base.webhook` | Receives WhatsApp messages (responds 200 immediately) |
| Parse Order | `n8n-nodes-base.code` | Extracts name, phone, address, items, total; builds reply text |
| Valid Order? | `n8n-nodes-base.if` | Routes valid vs. unreadable messages |
| Append to Orders Sheet | `n8n-nodes-base.googleSheets` | Appends the order row |
| Send Order Summary / Send Help Message | `n8n-nodes-base.httpRequest` | Calls the WhatsApp Cloud API `/messages` endpoint |

## Required credentials

- **Google Sheets OAuth2** (`googleSheetsOAuth2Api`)
- **Header Auth** (`httpHeaderAuth`) for the WhatsApp Cloud API: name `Authorization`, value `Bearer YOUR_TOKEN` (use a permanent System User token)
- A Meta app with the WhatsApp product, a phone number ID, and a webhook subscription to `messages`

## Setup

1. Create a spreadsheet with an `Orders` tab and header row: `OrderID, Date, Name, Phone, WhatsApp, Address, Items, Total, Status, RawMessage`.
2. Import `workflow.json`. Set `YOUR_SPREADSHEET_ID` in the Sheets node and choose credentials on both HTTP nodes.
3. In **Verify Token OK?** replace `YOUR_VERIFY_TOKEN` with a random string you choose.
4. Activate the workflow and copy the **Production URL** of the webhook (`.../webhook/whatsapp-orders`).
5. In Meta for Developers -> WhatsApp -> Configuration, set that URL as the callback and your verify token, then subscribe to `messages`.
6. Send a test message from a phone. Check the sheet and the reply.

## Customisation

- **Prices:** edit the `PRICES` object at the top of the `Parse Order` code (BDT). Unknown items are saved without a price.
- **Reply text / language:** edit the `replyText` strings in the same node.
- **Different order format:** adjust the label regexes (`name|নাম`, `address|ঠিকানা`, ...) and the item regexes.
- **Notify the owner:** add a Telegram node after "Append to Orders Sheet".
- **Payment confirmation:** combine with `bkash-payment-confirmation-log`.

## Notes

- Free-form replies only work within 24 hours of the customer's last message (WhatsApp policy).
- Status updates and non-text messages are ignored by returning no items.
