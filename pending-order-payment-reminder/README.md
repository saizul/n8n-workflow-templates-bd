# Pending Order Payment Reminder and Auto-Cancel

Every hour the workflow looks at **unpaid orders** in your `Orders` sheet, sends **one** polite WhatsApp payment reminder after a few hours, and **auto-cancels** orders that are still unpaid two days later. Anything it is not sure about goes to the owner on Telegram instead.

It is the missing link between [whatsapp-order-bot](../whatsapp-order-bot/) (creates `Pending` orders) and [bkash-payment-confirmation-log](../bkash-payment-confirmation-log/) (marks them `Paid`).

## Flow

1. **Every Hour** reads `Orders` rows where `Status = Pending`.
2. **Pick Orders Due** (Code) decides per order:
   - `remind`: older than `REMIND_AFTER_HOURS` (6), no `ReminderSentAt` yet, valid Bangladeshi WhatsApp number, and not inside quiet hours (22:00-09:00 Dhaka).
   - `cancel`: older than `CANCEL_AFTER_HOURS` (48) **and** a reminder was already sent.
   - `review`: older than 48 h but no reminder could be sent (no valid number), or the `Date` cell cannot be read. Nothing is changed; the owner is told.
   - Orders with a `TrxID` already, or any status other than `Pending`, are left alone.
3. Reminders are sent as an approved WhatsApp **template** message, then `ReminderSentAt` is written to the row so the customer is never reminded twice. If WhatsApp rejects the message, the row is not marked and the owner gets an alert.
4. Cancelled orders get `Status = Cancelled` and the owner gets a Telegram note.

At most `MAX_PER_RUN` (50) orders are handled per run, reminders first.

## Nodes

| Node | Type | Purpose |
|------|------|---------|
| Every Hour | `n8n-nodes-base.scheduleTrigger` | Hourly trigger |
| Read Pending Orders | `n8n-nodes-base.googleSheets` | Reads `Orders` where `Status = Pending` |
| Pick Orders Due | `n8n-nodes-base.code` | Age, quiet hours and phone checks; outputs one item per action |
| Send Reminder? / Cancel Order? | `n8n-nodes-base.if` | Route by `action` |
| Send WhatsApp Reminder | `n8n-nodes-base.httpRequest` | WhatsApp Cloud API template message (error output enabled) |
| Mark Reminder Sent | `n8n-nodes-base.googleSheets` | Writes `ReminderSentAt` by `OrderID` |
| Mark Order Cancelled | `n8n-nodes-base.googleSheets` | Sets `Status = Cancelled` by `OrderID` |
| Alert Owner: Order Cancelled / Needs Review / Reminder Failed | `n8n-nodes-base.telegram` | Owner notifications |

## Required credentials

Google Sheets OAuth2, Header Auth for WhatsApp Cloud API (`Authorization: Bearer YOUR_TOKEN`), Telegram API.

## Setup

1. Add a **`ReminderSentAt`** column to the `Orders` tab (next to `OrderID, Date, Name, Phone, WhatsApp, Total, Status, TrxID`).
2. In WhatsApp Manager create a **Utility** message template, for example named `payment_reminder`, language Bangla (`bn`), with four body variables:

   > প্রিয় {{1}}, আপনার অর্ডার {{2}} (৳{{3}}) এখনো পরিশোধ করা হয়নি। অনুগ্রহ করে {{4}} নম্বরে বিকাশ/নগদ করে TrxID পাঠান। ধন্যবাদ!

   Business-initiated messages outside the 24-hour customer window must use an approved template; a plain text message would be rejected.
3. Import the workflow and replace `YOUR_SPREADSHEET_ID`, `YOUR_PHONE_NUMBER_ID`, `YOUR_TEMPLATE_NAME` (and the language code if it is not `bn`), `YOUR_TELEGRAM_CHAT_ID`, and `YOUR_BKASH_NUMBER` in the Code node.
4. Pick the credentials, run **Test workflow** on a copy of your sheet, then activate.

## Customisation

All settings are constants at the top of **Pick Orders Due**:

| Constant | Default | Meaning |
|----------|---------|---------|
| `REMIND_AFTER_HOURS` | 6 | when the single reminder is sent |
| `CANCEL_AFTER_HOURS` | 48 | when a reminded order is cancelled |
| `QUIET_START` / `QUIET_END` | 22 / 9 | no customer messages in this window (Dhaka time) |
| `MAX_PER_RUN` | 50 | cap per hourly run |
| `PAY_TO` | `YOUR_BKASH_NUMBER` | payment number shown in the message |

`Date` may be an ISO timestamp (as written by `whatsapp-order-bot`), `YYYY-MM-DD HH:mm` or `DD/MM/YYYY HH:mm` in Dhaka time, or a Google Sheets date serial. To never cancel automatically, delete the `Mark Order Cancelled` node and connect `Cancel Order?` straight to the owner alert.

## বাংলায়

প্রতি ঘণ্টায় অপরিশোধিত (`Pending`) অর্ডার দেখে ৬ ঘণ্টা পর গ্রাহককে একবার হোয়াটসঅ্যাপে পেমেন্টের কথা মনে করিয়ে দেয়, ৪৮ ঘণ্টা পরেও টাকা না এলে অর্ডার বাতিল করে এবং মালিককে টেলিগ্রামে জানায়। রাত ১০টা থেকে সকাল ৯টা পর্যন্ত গ্রাহককে কোনো মেসেজ যায় না।
