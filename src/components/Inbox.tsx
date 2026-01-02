import React, { useState, useEffect } from "react";
import { useKeyboard } from "@opentui/react";
import { listReceivedEmails, getReceivedEmail } from "../api/resend";
import { archiveEmail, getArchivedEmails, markEmailAsRead, getReadEmails } from "../config";
import { ComposeContext } from "./Compose";

interface InboxProps {
  onBack: () => void;
  onCompose: (context: ComposeContext) => void;
}

interface ReceivedEmail {
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

type View = "list" | "detail" | "confirmDelete";

const ITEMS_PER_PAGE = 10;

export function Inbox({ onBack, onCompose }: InboxProps) {
  const [emails, setEmails] = useState<ReceivedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [view, setView] = useState<View>("list");
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [page, setPage] = useState(0);
  const [readEmailIds, setReadEmailIds] = useState<Set<string>>(new Set(getReadEmails()));

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
      const result = await listReceivedEmails();
      if (result.data?.data) {
        const archived = getArchivedEmails();
        const allEmails = result.data.data as ReceivedEmail[];
        setEmails(allEmails.filter(e => !archived.includes(e.id)));
      } else {
        setEmails([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load emails");
    } finally {
      setLoading(false);
    }
  }

  async function loadEmailDetail(id: string) {
    try {
      setLoadingDetail(true);
      const result = await getReceivedEmail(id);
      if (result.data) {
        setSelectedEmail(result.data as EmailDetail);
        setView("detail");
        if (!readEmailIds.has(id)) {
          markEmailAsRead(id);
          setReadEmailIds(prev => new Set([...prev, id]));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load email");
    } finally {
      setLoadingDetail(false);
    }
  }

  function handleReply() {
    if (!selectedEmail) return;
    onCompose({
      mode: "reply",
      to: selectedEmail.from,
      subject: selectedEmail.subject,
      originalBody: selectedEmail.text,
      originalFrom: selectedEmail.from,
      originalDate: new Date(selectedEmail.created_at).toLocaleString(),
    });
  }

  function handleForward() {
    if (!selectedEmail) return;
    onCompose({
      mode: "forward",
      subject: selectedEmail.subject,
      originalBody: selectedEmail.text,
      originalFrom: selectedEmail.from,
      originalTo: selectedEmail.to.join(", "),
      originalDate: new Date(selectedEmail.created_at).toLocaleString(),
    });
  }

  function handleDelete() {
    if (!selectedEmail) return;
    archiveEmail(selectedEmail.id);
    setEmails(prev => prev.filter(e => e.id !== selectedEmail.id));
    setSelectedEmail(null);
    setSelectedIndex(prev => Math.max(0, prev - 1));
    setView("list");
  }

  useKeyboard((e) => {
    if (view === "confirmDelete") {
      if (e.name === "y") {
        handleDelete();
      } else if (e.name === "n" || e.name === "escape") {
        setView("detail");
      }
      return;
    }

    if (view === "detail") {
      if (e.name === "escape" || e.name === "q" || e.name === "backspace") {
        setView("list");
        setSelectedEmail(null);
      } else if (e.name === "r") {
        handleReply();
      } else if (e.name === "f") {
        handleForward();
      } else if (e.name === "d") {
        setView("confirmDelete");
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
    } else if (e.name === "d" && paginatedEmails.length > 0) {
      loadEmailDetail(paginatedEmails[selectedIndex].id).then(() => {
        setView("confirmDelete");
      });
    }
  });

  if (loading) {
    return (
      <box flexDirection="column" padding={1}>
        <text bold color="cyan">
          Inbox
        </text>
        <text> </text>
        <text color="yellow">Loading emails...</text>
      </box>
    );
  }

  if (error) {
    return (
      <box flexDirection="column" padding={1}>
        <text bold color="cyan">
          Inbox
        </text>
        <text> </text>
        <text color="red">{error}</text>
        <text> </text>
        <text color="gray">Press Esc or Q to go back</text>
      </box>
    );
  }

  if (view === "confirmDelete" && selectedEmail) {
    return (
      <box flexDirection="column" padding={1}>
        <text bold color="red">
          Delete Email?
        </text>
        <text> </text>
        <text>From: {selectedEmail.from}</text>
        <text>Subject: {selectedEmail.subject}</text>
        <text> </text>
        <text color="yellow">
          This will archive the email locally (Resend API doesn't support deletion).
        </text>
        <text> </text>
        <text>
          Press <text color="green" bold>y</text> to confirm or <text color="red" bold>n</text> to cancel
        </text>
      </box>
    );
  }

  if (view === "detail" && selectedEmail) {
    return (
      <box flexDirection="column" padding={1}>
        <text bold color="cyan">
          Email Detail
        </text>
        <text color="gray">r: reply | f: forward | d: delete | Esc: back</text>
        <text> </text>
        <box flexDirection="row">
          <text color="gray">From: </text>
          <text>{selectedEmail.from}</text>
        </box>
        <box flexDirection="row">
          <text color="gray">To: </text>
          <text>{selectedEmail.to.join(", ")}</text>
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
        Inbox
      </text>
      <text color="gray">
        j/k: navigate | n/p: page | /: search | Enter: view | d: delete | r: refresh | Esc: back
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
          <text color="yellow">No emails received yet.</text>
          <text> </text>
          <text>
            To receive emails, configure a receiving domain at resend.com
          </text>
        </>
      ) : filteredEmails.length === 0 ? (
        <text color="yellow">No emails match "{searchQuery}"</text>
      ) : (
        <>
          {paginatedEmails.map((email, index) => {
            const isUnread = !readEmailIds.has(email.id);
            return (
              <box key={email.id} flexDirection="row">
                <text color={index === selectedIndex ? "cyan" : "white"}>
                  {index === selectedIndex ? "> " : "  "}
                </text>
                <text color={isUnread ? "magenta" : "gray"}>
                  {isUnread ? "* " : "  "}
                </text>
                <text bold={index === selectedIndex || isUnread} color="yellow">
                  {email.from.slice(0, 18).padEnd(18)}
                </text>
                <text color="gray"> | </text>
                <text bold={index === selectedIndex || isUnread}>
                  {email.subject.slice(0, 40)}
                </text>
              </box>
            );
          })}
          <text> </text>
          <text color="gray">
            {filteredEmails.length}{searchQuery ? ` of ${emails.length}` : ""} email{filteredEmails.length !== 1 ? "s" : ""}
            {(() => {
              const unreadCount = filteredEmails.filter(e => !readEmailIds.has(e.id)).length;
              return unreadCount > 0 ? ` (${unreadCount} unread)` : "";
            })()}
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
