# AI Customer Support for Facebook Messenger

Answers customer messages on a Facebook Page using an LLM that is instructed to use **only your FAQ text**. If the customer writes a handoff keyword (for example "human", "agent", or Bangla equivalents), the bot stops answering, tells the customer a team member will reply, and alerts the owner on Telegram.

## Nodes

| Node | Type | Purpose |
|------|------|---------|
| Webhook Verify (GET) / Verify Token OK? / Respond Challenge / Respond Forbidden | webhook, if, respondToWebhook | Meta webhook verification |
| Webhook Incoming (POST) | `n8n-nodes-base.webhook` | Receives Messenger events |
| Extract Message | `n8n-nodes-base.code` | Gets sender ID and text, ignores echoes, flags handoff keywords |
| Wants Human? | `n8n-nodes-base.if` | Routes handoff vs. AI |
| Send Handoff Reply | `n8n-nodes-base.httpRequest` | Graph API Send API |
| Alert Owner: Handoff | `n8n-nodes-base.telegram` | Notifies you |
| FAQ and Settings | `n8n-nodes-base.set` | Holds the FAQ text (edit it here) |
| AI Reply | `@n8n/n8n-nodes-langchain.chainLlm` | Basic LLM Chain with a grounded system prompt |
| OpenAI Chat Model | `@n8n/n8n-nodes-langchain.lmChatOpenAi` | Model sub-node (`gpt-4o-mini`) |
| Send AI Reply | `n8n-nodes-base.httpRequest` | Sends the answer via Graph API |

## Required credentials

- **OpenAI API** (`openAiApi`). You can swap the model sub-node for any other chat model node (Anthropic, Gemini, Ollama...).
- **Header Auth** (`httpHeaderAuth`): `Authorization: Bearer YOUR_TOKEN` using a Page access token with `pages_messaging`
- **Telegram API** (for handoff alerts)
- A Meta app with the Messenger product, connected to your Page and subscribed to `messages`

## Setup

1. Import the workflow and attach credentials.
2. Edit the `faq` value in **FAQ and Settings**: hours, delivery, payment, returns, contact. Keep it factual; the bot is told not to invent anything.
3. Replace `YOUR_VERIFY_TOKEN` in **Verify Token OK?** and `YOUR_TELEGRAM_CHAT_ID` in the Telegram node.
4. Activate; copy the Production URL (`.../webhook/messenger-support`).
5. In Meta for Developers -> Messenger -> Webhooks, add the callback URL with your verify token and subscribe the Page to `messages`.
6. Message your Page from another account to test (the app may need to be in Live mode, or the tester added as a role).

## Customisation

- **Handoff words:** `HANDOFF_WORDS` in `Extract Message`.
- **Tone and rules:** the system message in `AI Reply`.
- **Conversation memory:** replace the chain with an AI Agent plus Window Buffer Memory keyed on `senderId`.
- **Pausing the bot after handoff:** store `senderId` in a Sheet and skip AI replies for it; or use Meta's Handover Protocol.
- **Cost control:** `maxTokens` and the model in the OpenAI node.

## Notes

- Messenger's standard messaging window is 24 hours after the customer's last message.
- Do not put secrets or private customer data into the FAQ; it is sent to the LLM provider on each request.
- LLMs can make mistakes. Keep the human handoff available and review conversations.
