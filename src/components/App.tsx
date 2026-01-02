import React, { useState, useEffect } from "react";
import { useKeyboard } from "@opentui/react";
import { hasApiKey, Draft } from "../config";
import { resetClient } from "../api/resend";
import { Setup } from "./Setup";
import { Settings } from "./Settings";
import { Compose, ComposeContext } from "./Compose";
import { Inbox } from "./Inbox";
import { Sent } from "./Sent";
import { Help } from "./Help";
import { Drafts } from "./Drafts";
import { Contacts } from "./Contacts";

type View = "menu" | "setup" | "settings" | "compose" | "inbox" | "sent" | "help" | "drafts" | "contacts";

export function App() {
  const [view, setView] = useState<View>(() =>
    hasApiKey() ? "menu" : "setup"
  );
  const [selectedMenuItem, setSelectedMenuItem] = useState(0);
  const [composeContext, setComposeContext] = useState<ComposeContext | null>(null);
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);

  const menuItems = [
    { key: "c", label: "Compose", description: "Write a new email", view: "compose" as View },
    { key: "d", label: "Drafts", description: "View saved drafts", view: "drafts" as View },
    { key: "i", label: "Inbox", description: "View received emails", view: "inbox" as View },
    { key: "t", label: "Sent", description: "View sent emails", view: "sent" as View },
    { key: "b", label: "Contacts", description: "Address book", view: "contacts" as View },
    { key: "s", label: "Settings", description: "Configure email & signature", view: "settings" as View },
    { key: "?", label: "Help", description: "Keyboard shortcuts", view: "help" as View },
    { key: "q", label: "Quit", description: "Exit hypermail", view: null },
  ];

  useKeyboard((e) => {
    if (view !== "menu") return;

    if (e.name === "up" || e.name === "k") {
      setSelectedMenuItem((prev) => Math.max(0, prev - 1));
    } else if (e.name === "down" || e.name === "j") {
      setSelectedMenuItem((prev) => Math.min(menuItems.length - 1, prev + 1));
    } else if (e.name === "return") {
      const item = menuItems[selectedMenuItem];
      if (item.view === null) {
        process.exit(0);
      } else {
        setView(item.view);
      }
    } else {
      const key = e.char || e.name;
      const item = menuItems.find((m) => m.key === key);
      if (item) {
        if (item.view === null) {
          process.exit(0);
        } else {
          setView(item.view);
        }
      }
    }
  });

  const handleSetupComplete = () => {
    resetClient();
    setView("menu");
  };

  const handleBack = () => {
    setComposeContext(null);
    setEditingDraft(null);
    setView("menu");
  };

  const handleCompose = (context: ComposeContext) => {
    setComposeContext(context);
    setEditingDraft(null);
    setView("compose");
  };

  const handleEditDraft = (draft: Draft) => {
    setEditingDraft(draft);
    setComposeContext(null);
    setView("compose");
  };

  if (view === "setup") {
    return <Setup onComplete={handleSetupComplete} />;
  }

  if (view === "settings") {
    return <Settings onBack={handleBack} />;
  }

  if (view === "compose") {
    return <Compose onBack={handleBack} context={composeContext} draft={editingDraft} />;
  }

  if (view === "drafts") {
    return <Drafts onBack={handleBack} onEditDraft={handleEditDraft} />;
  }

  if (view === "inbox") {
    return <Inbox onBack={handleBack} onCompose={handleCompose} />;
  }

  if (view === "sent") {
    return <Sent onBack={handleBack} />;
  }

  if (view === "help") {
    return <Help onBack={handleBack} />;
  }

  if (view === "contacts") {
    return <Contacts onBack={handleBack} />;
  }

  return (
    <box flexDirection="column" padding={1}>
      <box flexDirection="column" marginBottom={1}>
        <text bold color="cyan">
          ╦ ╦╦ ╦╔═╗╔═╗╦═╗╔╦╗╔═╗╦╦
        </text>
        <text bold color="cyan">
          ╠═╣╚╦╝╠═╝║╣ ╠╦╝║║║╠═╣║║
        </text>
        <text bold color="cyan">
          ╩ ╩ ╩ ╩  ╚═╝╩╚═╩ ╩╩ ╩╩╩═╝
        </text>
        <text color="gray">Terminal email client powered by Resend</text>
      </box>

      <text> </text>

      {menuItems.map((item, index) => (
        <box key={item.key} flexDirection="row">
          <text color={index === selectedMenuItem ? "cyan" : "white"}>
            {index === selectedMenuItem ? "> " : "  "}
          </text>
          <text bold={index === selectedMenuItem} color="yellow">
            [{item.key}]
          </text>
          <text bold={index === selectedMenuItem}> {item.label}</text>
          <text color="gray"> - {item.description}</text>
        </box>
      ))}

      <text> </text>
      <text color="gray">
        Use j/k or arrows to navigate, Enter to select, or press the hotkey
      </text>
    </box>
  );
}
