import React, { useState, useEffect } from "react";
import { useKeyboard } from "@opentui/react";
import { listSentEmails, getSentEmail } from "../api/resend";

interface SentProps {
  onBack: () => void;
}

interface SentEmail {
  id: string;
  from: string;
  to: string[];
  subject: string;
  created_at: string;
}

interface EmailDetail {
  id: string;
  from: string;
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  created_at: string;
}

type View = "list" | "detail";

const ITEMS_PER_PAGE = 10;

export function Sent({ onBack }: SentProps) {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [view, setView] = useState<View>("list");
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [page, setPage] = useState(0);

  const filteredEmails = emails.filter((email) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      email.from.toLowerCase().includes(query) ||
      email.subject.toLowerCase().includes(query) ||
      email.to.some((t) => t.toLowerCase().includes(query))
    );
  });

  const totalPages = Math.ceil(filteredEmails.length / ITEMS_PER_PAGE);
  const paginatedEmails = filteredEmails.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  useEffect(() => {
    loadEmails();
  }, []);

  async function loadEmails() {
    try {
      setLoading(true);
      setError("");
      const result = await listSentEmails();
      if (result.data?.data) {
        setEmails(result.data.data as SentEmail[]);
      } else {
        setEmails([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sent emails");
    } finally {
      setLoading(false);
    }
  }

  async function loadEmailDetail(id: string) {
    try {
      setLoadingDetail(true);
      const result = await getSentEmail(id);
      if (result.data) {
        setSelectedEmail(result.data as EmailDetail);
        setView("detail");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load email");
    } finally {
      setLoadingDetail(false);
    }
  }

  useKeyboard((e) => {
    if (view === "detail") {
      if (e.name === "escape" || e.name === "q" || e.name === "backspace") {
        setView("list");
        setSelectedEmail(null);
      }
      return;
    }

    if (searching) {
      if (e.name === "escape") {
        setSearching(false);
        setSearchQuery("");
        setSelectedIndex(0);
        setPage(0);
      } else if (e.name === "return") {
        setSearching(false);
      } else if (e.name === "backspace") {
        setSearchQuery((prev) => prev.slice(0, -1));
        setSelectedIndex(0);
        setPage(0);
      } else if (e.char && e.char.length === 1) {
        setSearchQuery((prev) => prev + e.char);
        setSelectedIndex(0);
        setPage(0);
      }
      return;
    }

    if (e.name === "escape" || e.name === "q") {
      if (searchQuery) {
        setSearchQuery("");
        setSelectedIndex(0);
        setPage(0);
      } else {
        onBack();
      }
    } else if (e.name === "up" || e.name === "k") {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (e.name === "down" || e.name === "j") {
      setSelectedIndex((prev) => Math.min(paginatedEmails.length - 1, prev + 1));
    } else if (e.name === "r") {
      loadEmails();
    } else if (e.char === "/") {
      setSearching(true);
    } else if (e.char === "n" && totalPages > 1) {
      setPage((prev) => Math.min(totalPages - 1, prev + 1));
      setSelectedIndex(0);
    } else if (e.char === "p" && totalPages > 1) {
      setPage((prev) => Math.max(0, prev - 1));
      setSelectedIndex(0);
    } else if (e.name === "return" && paginatedEmails.length > 0) {
      loadEmailDetail(paginatedEmails[selectedIndex].id);
    }
  });

  if (loading) {
    return (
      <box flexDirection="column" padding={1}>
        <text bold color="cyan">
          Sent
        </text>
        <text> </text>
        <text color="yellow">Loading sent emails...</text>
      </box>
    );
  }

  if (error) {
    return (
      <box flexDirection="column" padding={1}>
        <text bold color="cyan">
          Sent
        </text>
        <text> </text>
        <text color="red">{error}</text>
        <text> </text>
        <text color="gray">Press Esc or Q to go back</text>
      </box>
    );
  }

  if (view === "detail" && selectedEmail) {
    return (
      <box flexDirection="column" padding={1}>
        <text bold color="cyan">
          Sent Email Detail
        </text>
        <text color="gray">Esc/Q: back to list</text>
        <text> </text>
        <box flexDirection="row">
          <text color="gray">From: </text>
          <text>{selectedEmail.from}</text>
        </box>
        <box flexDirection="row">
          <text color="gray">To: </text>
          <text>{Array.isArray(selectedEmail.to) ? selectedEmail.to.join(", ") : selectedEmail.to}</text>
        </box>
        <box flexDirection="row">
          <text color="gray">Subject: </text>
          <text bold>{selectedEmail.subject}</text>
        </box>
        <box flexDirection="row">
          <text color="gray">Date: </text>
          <text>{new Date(selectedEmail.created_at).toLocaleString()}</text>
        </box>
        <text> </text>
        <text color="gray">--- Body ---</text>
        <text> </text>
        <text>{selectedEmail.text || "(No text content)"}</text>
      </box>
    );
  }

  return (
    <box flexDirection="column" padding={1}>
      <text bold color="cyan">
        Sent
      </text>
      <text color="gray">
        j/k: navigate | n/p: page | /: search | Enter: view | r: refresh | Esc: back
      </text>
      <text> </text>

      {(searching || searchQuery) && (
        <>
          <box flexDirection="row">
            <text color="cyan">Search: </text>
            <text>{searchQuery}</text>
            {searching && <text color="cyan">_</text>}
          </box>
          <text> </text>
        </>
      )}

      {emails.length === 0 ? (
        <>
          <text color="yellow">No sent emails yet.</text>
          <text> </text>
          <text>
            Compose and send an email to see it here.
          </text>
        </>
      ) : filteredEmails.length === 0 ? (
        <text color="yellow">No emails match "{searchQuery}"</text>
      ) : (
        <>
          {paginatedEmails.map((email, index) => (
            <box key={email.id} flexDirection="row">
              <text color={index === selectedIndex ? "cyan" : "white"}>
                {index === selectedIndex ? "> " : "  "}
              </text>
              <text bold={index === selectedIndex} color="green">
                {(Array.isArray(email.to) ? email.to[0] : email.to).slice(0, 20).padEnd(20)}
              </text>
              <text color="gray"> | </text>
              <text bold={index === selectedIndex}>
                {email.subject.slice(0, 40)}
              </text>
            </box>
          ))}
          <text> </text>
          <text color="gray">
            {filteredEmails.length}{searchQuery ? ` of ${emails.length}` : ""} email{filteredEmails.length !== 1 ? "s" : ""}
            {totalPages > 1 && ` | Page ${page + 1}/${totalPages}`}
          </text>
        </>
      )}

      {loadingDetail && (
        <>
          <text> </text>
          <text color="yellow">Loading email...</text>
        </>
      )}
    </box>
  );
}
