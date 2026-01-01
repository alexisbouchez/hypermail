import React, { useState } from "react";
import { useKeyboard } from "@opentui/react";
import { sendEmail } from "../api/resend";
import { getDefaultFrom, getSignature } from "../config";

export type ComposeMode = "new" | "reply" | "forward";

export interface ComposeContext {
  mode: ComposeMode;
  to?: string;
  subject: string;
  originalBody?: string;
  originalFrom?: string;
  originalTo?: string;
  originalDate?: string;
}

interface ComposeProps {
  onBack: () => void;
  context?: ComposeContext | null;
}

type Field = "from" | "to" | "subject" | "body";
type Status = "composing" | "sending" | "sent" | "error";

function formatReplyBody(ctx: ComposeContext): string {
  const lines: string[] = ["\n\n---\n"];
  if (ctx.originalFrom) {
    lines.push(`On ${ctx.originalDate || "unknown date"}, ${ctx.originalFrom} wrote:\n`);
  }
  if (ctx.originalBody) {
    const quoted = ctx.originalBody.split("\n").map(line => `> ${line}`).join("\n");
    lines.push(quoted);
  }
  return lines.join("");
}

function formatForwardBody(ctx: ComposeContext): string {
  const lines: string[] = ["\n\n---------- Forwarded message ----------\n"];
  if (ctx.originalFrom) {
    lines.push(`From: ${ctx.originalFrom}\n`);
  }
  if (ctx.originalTo) {
    lines.push(`To: ${ctx.originalTo}\n`);
  }
  if (ctx.originalDate) {
    lines.push(`Date: ${ctx.originalDate}\n`);
  }
  lines.push(`Subject: ${ctx.subject}\n\n`);
  if (ctx.originalBody) {
    lines.push(ctx.originalBody);
  }
  return lines.join("");
}

function formatSubject(ctx: ComposeContext): string {
  const subj = ctx.subject;
  if (ctx.mode === "reply") {
    return subj.startsWith("Re: ") ? subj : `Re: ${subj}`;
  } else if (ctx.mode === "forward") {
    return subj.startsWith("Fwd: ") ? subj : `Fwd: ${subj}`;
  }
  return subj;
}

function formatBody(ctx: ComposeContext | null, signature?: string): string {
  const sig = signature ? `\n\n--\n${signature}` : "";

  if (!ctx) {
    return sig;
  }

  if (ctx.mode === "reply") {
    return sig + formatReplyBody(ctx);
  } else if (ctx.mode === "forward") {
    return sig + formatForwardBody(ctx);
  }
  return sig;
}

export function Compose({ onBack, context }: ComposeProps) {
  const defaultFrom = getDefaultFrom() || "";
  const signature = getSignature();
  const mode = context?.mode || "new";
  const isForward = mode === "forward";
  const isReply = mode === "reply";

  const [field, setField] = useState<Field>(isForward ? "to" : "body");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(context?.to || "");
  const [subject, setSubject] = useState(context ? formatSubject(context) : "");
  const [body, setBody] = useState(formatBody(context || null, signature));
  const [status, setStatus] = useState<Status>("composing");
  const [error, setError] = useState("");

  const fields: Field[] = ["from", "to", "subject", "body"];
  const currentIndex = fields.indexOf(field);

  const getValue = (f: Field) => {
    switch (f) {
      case "from":
        return from;
      case "to":
        return to;
      case "subject":
        return subject;
      case "body":
        return body;
    }
  };

  const setValue = (f: Field, value: string) => {
    switch (f) {
      case "from":
        setFrom(value);
        break;
      case "to":
        setTo(value);
        break;
      case "subject":
        setSubject(value);
        break;
      case "body":
        setBody(value);
        break;
    }
  };

  useKeyboard(async (e) => {
    if (status !== "composing") {
      if (e.name === "escape" || e.name === "q") {
        onBack();
      }
      return;
    }

    if (e.name === "escape") {
      onBack();
    } else if (e.name === "tab") {
      const nextIndex = (currentIndex + 1) % fields.length;
      setField(fields[nextIndex]);
    } else if (e.name === "up") {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : fields.length - 1;
      setField(fields[prevIndex]);
    } else if (e.name === "down") {
      const nextIndex = (currentIndex + 1) % fields.length;
      setField(fields[nextIndex]);
    } else if (e.ctrl && e.name === "s") {
      if (!from || !to || !subject) {
        setError("From, To, and Subject are required");
        return;
      }
      setStatus("sending");
      setError("");
      try {
        await sendEmail({
          from,
          to: to.split(",").map((s) => s.trim()),
          subject,
          text: body,
        });
        setStatus("sent");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send email");
        setStatus("error");
      }
    } else if (e.name === "backspace") {
      setValue(field, getValue(field).slice(0, -1));
    } else if (e.name === "return" && field === "body") {
      setValue(field, getValue(field) + "\n");
    } else if (e.name === "return") {
      const nextIndex = (currentIndex + 1) % fields.length;
      setField(fields[nextIndex]);
    } else if (e.name.length === 1) {
      setValue(field, getValue(field) + e.name);
    } else if (e.name === "space") {
      setValue(field, getValue(field) + " ");
    }
  });

  const renderField = (f: Field, label: string) => {
    const isActive = field === f;
    const value = getValue(f);
    return (
      <box flexDirection="row">
        <text color={isActive ? "cyan" : "white"} bold={isActive}>
          {label}:{" "}
        </text>
        <text>{value}</text>
        {isActive && <text color="gray">_</text>}
      </box>
    );
  };

  const getTitle = () => {
    if (isReply) return "Reply to Email";
    if (isForward) return "Forward Email";
    return "Compose Email";
  };

  const getSuccessMessage = () => {
    if (isReply) return "Reply sent successfully!";
    if (isForward) return "Email forwarded successfully!";
    return "Email sent successfully!";
  };

  if (status === "sent") {
    return (
      <box flexDirection="column" padding={1}>
        <text bold color="green">
          {getSuccessMessage()}
        </text>
        <text> </text>
        <text color="gray">Press Esc or Q to go back</text>
      </box>
    );
  }

  if (status === "error") {
    return (
      <box flexDirection="column" padding={1}>
        <text bold color="red">
          Failed to send email
        </text>
        <text color="red">{error}</text>
        <text> </text>
        <text color="gray">Press Esc or Q to go back</text>
      </box>
    );
  }

  return (
    <box flexDirection="column" padding={1}>
      <text bold color="cyan">
        {getTitle()}
      </text>
      <text color="gray">
        Tab/Arrows: navigate | Ctrl+S: send | Esc: back
      </text>
      <text> </text>

      {renderField("from", "From")}
      {renderField("to", "To  ")}
      {renderField("subject", "Subj")}
      <text> </text>
      <text color={field === "body" ? "cyan" : "white"} bold={field === "body"}>
        Body:
      </text>
      <box borderStyle="single" padding={1} minHeight={5}>
        <text>{body}</text>
        {field === "body" && <text color="gray">_</text>}
      </box>

      {error && (
        <>
          <text> </text>
          <text color="red">{error}</text>
        </>
      )}

      {status === "sending" && (
        <>
          <text> </text>
          <text color="yellow">Sending...</text>
        </>
      )}
    </box>
  );
}

// Keep backward compatibility
export type ReplyContext = ComposeContext;
