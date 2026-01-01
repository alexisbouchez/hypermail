# Hypermail

A terminal email client powered by [Resend](https://resend.com) and [OpenTUI](https://github.com/sst/opentui).

## Features

- Send emails via Resend API
- View sent emails history
- View received emails (via Resend's receiving API)
- Search emails by sender, recipient, or subject
- Read email details with full body content
- Reply to emails with quoted original message
- Forward emails to other recipients
- Delete/archive emails locally
- Configurable email signature
- API key setup wizard with secure storage
- Vim-style navigation (j/k keys)

## Installation

```bash
bun install
```

## Usage

```bash
bun run start
```

On first run, you'll be prompted to enter your Resend API key. Get one at https://resend.com/api-keys.

Configuration is stored in `~/.config/hypermail/config.json`.

## Keyboard Shortcuts

### Main Menu
- `c` - Compose new email
- `i` - View inbox/domains
- `t` - View sent emails
- `s` - Settings (reconfigure API key)
- `q` - Quit
- `j/k` or arrows - Navigate
- `Enter` - Select

### Compose
- `Tab` or arrows - Navigate between fields
- `Ctrl+S` - Send email
- `Esc` - Go back

### Inbox (list view)
- `j/k` or arrows - Navigate emails
- `/` - Search emails (by from, to, subject)
- `Enter` - View email detail
- `d` - Delete email
- `r` - Refresh
- `Esc` - Clear search or go back to menu

### Email Detail
- `r` - Reply to email
- `f` - Forward email
- `d` - Delete email
- `Esc/Q` - Go back to list

### Sent Emails
- `j/k` or arrows - Navigate emails
- `/` - Search emails (by from, to, subject)
- `Enter` - View email detail
- `r` - Refresh
- `Esc` - Clear search or go back

### Settings
- `Tab` or arrows - Navigate fields
- `Ctrl+S` - Save settings
- `Esc` - Go back

## Development

```bash
bun run dev  # Run with watch mode
```

## Receiving Emails

To receive emails with Hypermail:

1. Add a receiving domain at https://resend.com/domains (or use the free `.resend.app` subdomain)
2. Emails sent to your domain will appear in the Inbox view
3. The app uses Resend's `GET /emails/receiving` API to fetch received emails
