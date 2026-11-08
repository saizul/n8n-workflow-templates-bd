# n8n Workflow Templates for Bangladeshi Small Businesses

Importable [n8n](https://n8n.io) workflows for common small-business jobs in Bangladesh: taking orders on WhatsApp, capturing Facebook leads, logging bKash/Nagad payment SMS, daily sales reports, and an AI support bot for Messenger. Built and maintained by [Saizul Amin](https://saizul.com).

> All credentials, IDs and numbers in the JSON files are placeholders (`YOUR_TOKEN`, `YOUR_SPREADSHEET_ID`, ...). Nothing is pre-configured. Review every workflow before activating it.

## Templates

| # | Template | Trigger | What it does | Services |
|---|----------|---------|--------------|----------|
| 1 | [whatsapp-order-bot](whatsapp-order-bot/) | WhatsApp Cloud API webhook | Parses Bangla/English order messages, saves to Google Sheets, auto-replies with a summary | WhatsApp Cloud API, Google Sheets |
| 2 | [facebook-lead-to-sheets-and-whatsapp-alert](facebook-lead-to-sheets-and-whatsapp-alert/) | Facebook Lead Ads | Saves new leads to Sheets and alerts the owner on Telegram or WhatsApp | Facebook Lead Ads, Google Sheets, Telegram, WhatsApp |
| 3 | [bkash-payment-confirmation-log](bkash-payment-confirmation-log/) | Webhook (forwarded SMS) | Extracts amount, sender, TrxID from bKash/Nagad SMS, logs it, matches pending orders, replies | Android SMS forwarder, Google Sheets, WhatsApp, Telegram |
| 4 | [daily-sales-report](daily-sales-report/) | Schedule (9 PM Dhaka) | Summarises today's sales from Sheets and sends it by Telegram and email | Google Sheets, Telegram, SMTP |
| 5 | [ai-customer-support-messenger](ai-customer-support-messenger/) | Messenger webhook | Answers customers from your FAQ with an LLM, with a human-handoff keyword | Messenger, OpenAI, Telegram |

Each folder contains `workflow.json` and a `README.md` with the node list, required credentials, setup steps and customisation tips.

## Import instructions

1. Open your n8n instance (self-hosted or cloud, n8n 1.x).
2. Go to **Workflows -> Add workflow**, then the **...** menu -> **Import from file** and choose a `workflow.json`. (Or paste the JSON into the canvas with Ctrl/Cmd+V.)
3. Open each node that shows a credential warning and select or create the credential.
4. Replace every placeholder (`YOUR_...`) in node parameters.
5. Run with **Test workflow** using sample data, then switch the workflow to **Active**.

The workflows are set to the `Asia/Dhaka` timezone. Credential IDs in the files are `REPLACE_ME`; n8n will ask you to pick your own.

## Google Sheets layout

Templates 1, 3 and 4 share one spreadsheet with an `Orders` tab. Suggested header row:

`OrderID | Date | Name | Phone | WhatsApp | Address | Items | Product | Qty | Total | Status | TrxID | RawMessage`

Template 3 also uses a `Payments` tab (`TrxID | Date | Provider | Amount | SenderNumber | MatchedOrder`) and template 2 a `Leads` tab (`LeadID | Date | Name | Phone | Email | FormID | AdID | Status`). Column headers must match exactly.

## Safety and privacy notes

- Never put real tokens in workflow JSON you share. Use n8n credentials.
- Only collect customer data you need, and tell customers how it is used.
- The bKash/Nagad template is **not** an official integration and must never see PINs or OTPs; read its README first.
- WhatsApp and Messenger have platform policies (24-hour reply window, approved templates for business-initiated messages). Follow them.
- These templates are provided as-is under the MIT license. Test before relying on them for real money or customers.

## Validation

Every `workflow.json` is checked by `scripts/validate-workflows.js` on each push and pull request (`.github/workflows/validate.yml`). It verifies that the file parses, that nodes have a unique name, type and position, that connections point to existing nodes, that no node is left unconnected, and that no API keys, bearer tokens or other secrets are embedded. Run it locally before opening a pull request:

```bash
node scripts/validate-workflows.js
```

## বাংলায় সারসংক্ষেপ

এই রিপোজিটরিতে বাংলাদেশের ছোট ব্যবসার জন্য পাঁচটি রেডি n8n ওয়ার্কফ্লো আছে:

1. **হোয়াটসঅ্যাপ অর্ডার বট** - বাংলা বা ইংরেজিতে পাঠানো অর্ডার পড়ে গুগল শিটে সংরক্ষণ করে এবং গ্রাহককে সারাংশ পাঠায়।
2. **ফেসবুক লিড অ্যালার্ট** - ফেসবুক লিড অ্যাড থেকে আসা লিড শিটে রাখে এবং মালিককে টেলিগ্রাম বা হোয়াটসঅ্যাপে জানায়।
3. **বিকাশ/নগদ পেমেন্ট লগ** - ফরওয়ার্ড করা পেমেন্ট এসএমএস থেকে পরিমাণ, প্রেরকের নম্বর ও TrxID বের করে শিটে লগ করে এবং অপেক্ষমাণ অর্ডারের সাথে মেলায়। **এটি বিকাশ বা নগদের কোনো অফিসিয়াল API ব্যবহার করে না এবং কখনোই পিন বা ওটিপি সংরক্ষণ করা যাবে না।**
4. **দৈনিক সেলস রিপোর্ট** - প্রতিদিন রাতে আজকের বিক্রির সারাংশ টেলিগ্রাম ও ইমেইলে পাঠায়।
5. **মেসেঞ্জার এআই সাপোর্ট** - আপনার FAQ থেকে গ্রাহকের প্রশ্নের উত্তর দেয়; "human" লিখলে মানুষের কাছে হস্তান্তর করে।

**ব্যবহারের ধাপ:** n8n খুলুন -> Import from file -> `workflow.json` নির্বাচন করুন -> নিজের ক্রেডেনশিয়াল দিন -> `YOUR_...` লেখাগুলো বদলান -> টেস্ট করে অ্যাক্টিভ করুন।

কাস্টমাইজ বা সেটআপে সাহায্য লাগলে: [saizul.com](https://saizul.com)

## License

[MIT](LICENSE) (c) Saizul Amin
