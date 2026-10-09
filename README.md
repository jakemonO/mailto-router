# Mailto Router

A Firefox extension that opens `mailto:` links in the webmail service of your choice: Gmail, Outlook.com, Yahoo Mail, AOL Mail, or any other provider you add with a URL template.

When you click an email link, Mailto Router reads the recipients, subject and body from it and opens a pre-filled compose window in your chosen provider.

## Features

- **Built-in providers:** AOL Mail, Gmail, Outlook.com and Yahoo Mail work out of the box.
- **Custom providers:** add any webmail service that accepts compose fields in its URL.
- **Default provider or chooser:** send every link straight to your default, or have it ask each time and show what the message contains first.
- **"Use this provider from now on":** from the chooser, set a new default in one click.
- **Full `mailto:` parsing (RFC 6068):** handles multiple recipients, `cc`, `bcc`, `subject` and `body`, including multi-line bodies.
- **Live preview:** the settings page shows the exact URL a sample link will open.
- **Synced settings:** your providers are stored with `storage.sync`, so they follow your Firefox account.

## Requirements

Firefox 142 or later.

## Installation

As of October 9, 2026, the extension has been submitted to [addons.mozilla.org](https://addons.mozilla.org/) and is awaiting review. Until it's approved, you can load it from source:

1. Clone this repository.
2. In Firefox, open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select `manifest.json` from the cloned folder.

Temporary add-ons are removed when Firefox restarts. To install it permanently, the extension has to be signed through Mozilla (for example with [`web-ext sign`](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-sign)).

## Setup

After installing, make Firefox send email links to the extension:

1. Open **Settings → General → Applications**.
2. Search for **mailto**.
3. Choose **Use Mailto Router**.

If Mailto Router isn't listed, click any `mailto:` link once (the settings page has a test link) and choose Mailto Router in the dialog that appears.

## Usage

Click the toolbar button to open the settings page. From there you can:

- choose the default provider with the radio button next to it
- add, rename, reorder or remove providers
- turn on **Ask which provider to use every time**
- test a sample `mailto:` link and preview the resulting URL
- restore the built-in provider list

## Adding a provider

Each provider is a name and a URL template. When a link is opened, the extension replaces these placeholders with values from the link:

| Placeholder | Replaced with |
|---|---|
| `{to}` | Recipient addresses, comma-separated |
| `{cc}` | CC addresses |
| `{bcc}` | BCC addresses |
| `{subject}` | Subject line |
| `{body}` | Message body |
| `{raw:to}`, `{raw:subject}`, … | The same value, inserted without URL encoding |
| `{mailto}` | The complete original `mailto:` link, URL-encoded |

Values are URL-encoded unless you use the `raw:` form. Query parameters that end up empty are removed, so a link with no CC doesn't send `cc=` to the provider.

For example, this is the built-in Gmail template:

```
https://mail.google.com/mail/?view=cm&fs=1&to={to}&cc={cc}&bcc={bcc}&su={subject}&body={body}
```

The link `mailto:alice@example.com?subject=Hello` becomes:

```
https://mail.google.com/mail/?view=cm&fs=1&to=alice%40example.com&su=Hello
```

## Privacy

Mailto Router collects no data. Its only permission is `storage`, used to save your provider list. Link contents go only to the provider you choose.

## Project structure

| File | Purpose |
|---|---|
| `manifest.json` | Extension manifest; registers the `mailto` protocol handler |
| `common.js` | Default providers, settings storage, `mailto:` parsing and template filling |
| `handler.html` / `handler.js` | Receives `mailto:` links, then redirects or shows the provider chooser |
| `options.html` / `options.js` | Settings page |
| `background.js` | Opens the settings page from the toolbar button |
| `style.css` | Shared styles |
| `icons/` | Extension icon |
