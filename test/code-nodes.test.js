'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { runCode } = require('./helpers');

// ---- bkash-payment-confirmation-log ------------------------------------------------

const BKASH = 'bkash-payment-confirmation-log';
const sms = (message, from = 'bKash') => [{ body: { from, message } }];

test('bKash received SMS is parsed', async () => {
  const [out] = await runCode(BKASH, 'Parse Payment SMS', {
    items: sms('You have received Tk 1,250.00 from 01712345678. Fee Tk 0.00. Balance Tk 5,000.00. TrxID ABC12345XY at 07/11/2026 14:22'),
  });
  assert.equal(out.parsed, true);
  assert.equal(out.provider, 'bKash');
  assert.equal(out.amount, 1250);
  assert.equal(out.senderNumber, '01712345678');
  assert.equal(out.trxId, 'ABC12345XY');
});

test('Nagad received SMS is parsed', async () => {
  const [out] = await runCode(BKASH, 'Parse Payment SMS', {
    items: sms('Money Received. Amount: Tk 500.00 Sender: 01812345678 Ref: N/A TxnID: 7A1B2C3D4 Fee: 0.00 Balance: Tk 1,000.00', 'NAGAD'),
  });
  assert.deepEqual(
    [out.parsed, out.provider, out.amount, out.senderNumber, out.trxId],
    [true, 'Nagad', 500, '01812345678', '7A1B2C3D4']
  );
});

test('PIN/OTP and outgoing SMS are dropped', async () => {
  const [otp] = await runCode(BKASH, 'Parse Payment SMS', { items: sms('Your bKash OTP is 123456. Do not share.') });
  assert.deepEqual(otp, { parsed: false, reason: 'sensitive_message_dropped' });
  const [sent] = await runCode(BKASH, 'Parse Payment SMS', {
    items: sms('Send Money Tk 200.00 to 01712345678 successful. TrxID ZZZ1234567'),
  });
  assert.equal(sent.reason, 'not_incoming');
});

test('payment matching: unique amount, phone tie-break, ambiguity', async () => {
  const pay = { trxId: 'T1', amount: 1200, provider: 'bKash', senderNumber: '01712345678' };
  const orders = [
    { OrderID: 'A', Total: '1200', Phone: '01900000000' },
    { OrderID: 'B', Total: '900', Phone: '01712345678' },
  ];
  let [out] = await runCode(BKASH, 'Match Against Pending Orders', { items: orders, nodes: { 'Parse Payment SMS': [pay] } });
  assert.equal(out.matched, true);
  assert.equal(out.orderId, 'A');
  assert.equal(out.customerWa, '8801900000000');

  orders.push({ OrderID: 'C', Total: '1200.00', Phone: '+8801712345678' });
  [out] = await runCode(BKASH, 'Match Against Pending Orders', { items: orders, nodes: { 'Parse Payment SMS': [pay] } });
  assert.equal(out.orderId, 'C', 'sender phone breaks the tie');

  orders.push({ OrderID: 'D', Total: '1200', Phone: '01712345678' });
  [out] = await runCode(BKASH, 'Match Against Pending Orders', { items: orders, nodes: { 'Parse Payment SMS': [pay] } });
  assert.equal(out.matched, false);
  assert.match(out.note, /Candidates with same amount: 3/);
});

// ---- pending-order-payment-reminder ------------------------------------------------

const REMIND = 'pending-order-payment-reminder';
const NOW = '2026-11-10T06:00:00Z'; // 12:00 in Dhaka
const order = (o) => ({ OrderID: 'ORD-1', Name: 'Rahim', Status: 'Pending', Total: 1200, WhatsApp: '8801712345678', ...o });
const pick = (items, now = NOW) => runCode(REMIND, 'Pick Orders Due', { items, now });

test('reminds an unpaid order after 6 hours, once', async () => {
  const [out] = await pick([order({ Date: '2026-11-09T23:00:00Z' })]); // 7 h old
  assert.equal(out.action, 'remind');
  assert.equal(out.customerWa, '8801712345678');
  assert.equal(out.payTo, 'YOUR_BKASH_NUMBER');
  assert.equal(out.sentAt, '2026-11-10T06:00:00.000Z');
  assert.deepEqual(await pick([order({ Date: '2026-11-09T23:00:00Z', ReminderSentAt: '2026-11-10T05:00:00Z' })]), []);
});

test('too young, paid, linked or non-pending orders are ignored', async () => {
  const out = await pick([
    order({ Date: '2026-11-10T04:00:00Z' }), // 2 h old
    order({ Date: '2026-11-08T00:00:00Z', Status: 'Paid' }),
    order({ Date: '2026-11-08T00:00:00Z', TrxID: 'ABC123' }),
    { Name: 'no id', Status: 'Pending', Date: '2026-11-08T00:00:00Z' },
  ]);
  assert.deepEqual(out, []);
});

test('quiet hours hold reminders but not cancellations', async () => {
  const night = '2026-11-09T18:30:00Z'; // 00:30 in Dhaka
  const items = [
    order({ OrderID: 'R', Date: '2026-11-09T10:00:00Z' }),
    order({ OrderID: 'C', Date: '2026-11-07T10:00:00Z', ReminderSentAt: 'x' }),
  ];
  const out = await pick(items, night);
  assert.deepEqual(out.map((o) => [o.orderId, o.action]), [['C', 'cancel']]);
});

test('cancels after 48 h only when a reminder was sent; otherwise asks for review', async () => {
  const out = await pick([
    order({ OrderID: 'X', Date: '2026-11-08T05:00:00Z', ReminderSentAt: '2026-11-08T12:00:00Z' }),
    order({ OrderID: 'Y', Date: '2026-11-08T05:00:00Z', WhatsApp: '', Phone: '12345' }),
  ]);
  const byId = Object.fromEntries(out.map((o) => [o.orderId, o]));
  assert.equal(byId.X.action, 'cancel');
  assert.match(byId.X.note, /auto-cancelled: unpaid after 49 h/);
  assert.equal(byId.Y.action, 'review');
  assert.match(byId.Y.note, /no valid WhatsApp number/);
});

test('date formats: Dhaka local, DD/MM/YYYY, Sheets serial, unreadable', async () => {
  // All three are 2026-11-10 05:00 Dhaka = 7 h before NOW.
  const out = await pick([
    order({ OrderID: 'L', Date: '2026-11-10 05:00' }),
    order({ OrderID: 'D', Date: '10/11/2026 05:00' }),
    order({ OrderID: 'S', Date: 46336 + 5 / 24 }),
    order({ OrderID: 'Bad', Date: 'yesterday' }),
  ]);
  assert.deepEqual(out.map((o) => [o.orderId, o.action]), [['L', 'remind'], ['D', 'remind'], ['S', 'remind'], ['Bad', 'review']]);
});

test('phone numbers are normalised and invalid ones are never messaged', async () => {
  const out = await pick([
    order({ OrderID: 'A', WhatsApp: '', Phone: '01812-345678', Date: '2026-11-09T20:00:00Z' }),
    order({ OrderID: 'B', WhatsApp: '', Phone: '0181234', Date: '2026-11-09T20:00:00Z' }),
  ]);
  assert.deepEqual(out.map((o) => [o.orderId, o.customerWa]), [['A', '8801812345678']]);
});

test('reminders are sorted first and the batch is capped', async () => {
  const items = [];
  for (let i = 0; i < 60; i++) items.push(order({ OrderID: `C${i}`, Date: '2026-11-07T00:00:00Z', ReminderSentAt: 'x' }));
  items.push(order({ OrderID: 'R1', Date: '2026-11-09T20:00:00Z' }));
  const out = await pick(items);
  assert.equal(out.length, 50);
  assert.equal(out[0].orderId, 'R1');
});
