# Daily Sales Report

Every day at 9 PM (Asia/Dhaka) the workflow reads your **Orders** sheet, summarises today's orders (count, revenue, average order, top products) and sends the report to **Telegram** and **email**.

## Nodes

| Node | Type | Purpose |
|------|------|---------|
| Every Day 9 PM | `n8n-nodes-base.scheduleTrigger` | Daily trigger |
| Read Orders | `n8n-nodes-base.googleSheets` | Reads all rows of `Orders` |
| Summarize Today | `n8n-nodes-base.code` | Filters today's rows (Dhaka date), computes totals, builds text and HTML |
| Send Telegram Report | `n8n-nodes-base.telegram` | Sends the summary |
| Send Email Report | `n8n-nodes-base.emailSend` | Sends the HTML summary via SMTP |

## Required credentials

Google Sheets OAuth2, Telegram API (optional if you only want email), SMTP.

## Setup

1. `Orders` tab columns: `Date, OrderID, Product, Qty, Total, Status` (extra columns are fine). `Date` can be an ISO timestamp (as written by `whatsapp-order-bot`) or `YYYY-MM-DD`. If `Product` is missing, `Items` is used.
2. Import, set `YOUR_SPREADSHEET_ID`, `YOUR_TELEGRAM_CHAT_ID`, and the email addresses (`reports@YOUR_DOMAIN.com`, `owner@YOUR_DOMAIN.com`).
3. Click **Test workflow**, check the output, then activate.

## Customisation

- Time: edit the schedule node (hour/minute), or switch to a cron expression.
- Counted statuses: edit `STATUS_COUNTED` in the Code node (for example only `Paid`).
- Currency label: `CURRENCY` constant.
- Delete one of the two send nodes if you only need one channel.
- Weekly or monthly reports: change the date filter to a range.
