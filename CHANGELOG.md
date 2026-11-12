# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- New template `pending-order-payment-reminder`: hourly WhatsApp payment reminder for
  unpaid orders (approved template message, quiet hours, one reminder per order),
  auto-cancel after 48 hours and Telegram alerts for anything that needs a human.
- Unit tests for Code node logic (`test/`), run with `node --test`, covering the
  bKash/Nagad SMS parser, payment matching and the new reminder rules.
- Validator: Code node JavaScript must compile, and each template folder must have a README.
- CI runs the unit tests after validation.

## [1.0.0]

- Five templates: WhatsApp order bot, Facebook lead alert, bKash/Nagad payment log,
  daily sales report and Messenger support bot, plus the workflow validator.
