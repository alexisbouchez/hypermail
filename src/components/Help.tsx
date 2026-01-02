import React from "react";
import { useKeyboard } from "@opentui/react";

interface HelpProps {
  onBack: () => void;
}

export function Help({ onBack }: HelpProps) {
  useKeyboard((e) => {
    if (e.name === "escape" || e.name === "q" || e.char === "?") {
      onBack();
    }
  });

  return (
    <box flexDirection="column" padding={1}>
      <text bold color="cyan">
        Keyboard Shortcuts
      </text>
      <text color="gray">Press Esc, Q, or ? to close</text>
      <text> </text>

      <text bold color="yellow">Main Menu</text>
      <text>  c         Compose new email</text>
      <text>  d         View drafts</text>
      <text>  i         Open inbox</text>
      <text>  t         View sent emails</text>
      <text>  s         Settings</text>
      <text>  ?         This help screen</text>
      <text>  q         Quit</text>
      <text> </text>

      <text bold color="yellow">Email Lists (Inbox/Sent)</text>
      <text>  j/k       Navigate up/down</text>
      <text>  n/p       Next/previous page</text>
      <text>  /         Search emails</text>
      <text>  Enter     View email detail</text>
      <text>  r         Refresh list</text>
      <text>  a         Mark all as read (inbox only)</text>
      <text>  d         Delete email (inbox only)</text>
      <text>  Esc       Clear search or go back</text>
      <text> </text>

      <text bold color="yellow">Email Detail</text>
      <text>  r         Reply to email</text>
      <text>  f         Forward email</text>
      <text>  d         Delete email</text>
      <text>  Esc/Q     Back to list</text>
      <text> </text>

      <text bold color="yellow">Compose</text>
      <text>  Tab       Next field</text>
      <text>  Shift+Tab Previous field</text>
      <text>  Ctrl+S    Send email</text>
      <text>  Ctrl+D    Save as draft</text>
      <text>  Esc       Cancel and go back</text>
      <text> </text>

      <text bold color="yellow">Settings</text>
      <text>  Tab       Next field</text>
      <text>  Ctrl+S    Save settings</text>
      <text>  Esc       Go back</text>
    </box>
  );
}
