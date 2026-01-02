import React, { useState } from "react";
import { useKeyboard } from "@opentui/react";
import { getDrafts, deleteDraft, Draft } from "../config";

interface DraftsProps {
  onBack: () => void;
  onEditDraft: (draft: Draft) => void;
}

export function Drafts({ onBack, onEditDraft }: DraftsProps) {
  const [drafts, setDrafts] = useState<Draft[]>(getDrafts());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useKeyboard((e) => {
    if (confirmDelete) {
      if (e.name === "y") {
        const draft = drafts[selectedIndex];
        deleteDraft(draft.id);
        setDrafts(getDrafts());
        setSelectedIndex((prev) => Math.max(0, prev - 1));
        setConfirmDelete(false);
      } else if (e.name === "n" || e.name === "escape") {
        setConfirmDelete(false);
      }
      return;
    }

    if (e.name === "escape" || e.name === "q") {
      onBack();
    } else if (e.name === "up" || e.name === "k") {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (e.name === "down" || e.name === "j") {
      setSelectedIndex((prev) => Math.min(drafts.length - 1, prev + 1));
    } else if (e.name === "return" && drafts.length > 0) {
      onEditDraft(drafts[selectedIndex]);
    } else if (e.name === "d" && drafts.length > 0) {
      setConfirmDelete(true);
    }
  });

  if (confirmDelete && drafts.length > 0) {
    const draft = drafts[selectedIndex];
    return (
      <box flexDirection="column" padding={1}>
        <text bold color="red">
          Delete Draft?
        </text>
        <text> </text>
        <text>To: {draft.to || "(no recipient)"}</text>
        <text>Subject: {draft.subject || "(no subject)"}</text>
        <text> </text>
        <text>
          Press <text color="green" bold>y</text> to confirm or <text color="red" bold>n</text> to cancel
        </text>
      </box>
    );
  }

  return (
    <box flexDirection="column" padding={1}>
      <text bold color="cyan">
        Drafts
      </text>
      <text color="gray">
        j/k: navigate | Enter: edit | d: delete | Esc: back
      </text>
      <text> </text>

      {drafts.length === 0 ? (
        <text color="yellow">No drafts saved.</text>
      ) : (
        <>
          {drafts.map((draft, index) => (
            <box key={draft.id} flexDirection="row">
              <text color={index === selectedIndex ? "cyan" : "white"}>
                {index === selectedIndex ? "> " : "  "}
              </text>
              <text bold={index === selectedIndex} color="green">
                {(draft.to || "(no recipient)").slice(0, 20).padEnd(20)}
              </text>
              <text color="gray"> | </text>
              <text bold={index === selectedIndex}>
                {(draft.subject || "(no subject)").slice(0, 35)}
              </text>
            </box>
          ))}
          <text> </text>
          <text color="gray">
            {drafts.length} draft{drafts.length !== 1 ? "s" : ""}
          </text>
        </>
      )}
    </box>
  );
}
