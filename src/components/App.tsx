import React, { useState, useEffect } from "react";
import { useKeyboard } from "@opentui/react";
import { hasApiKey } from "../config";
import { resetClient } from "../api/resend";
import { Setup } from "./Setup";
import { Settings } from "./Settings";
import { Compose, ComposeContext } from "./Compose";
import { Inbox } from "./Inbox";

type View = "menu" | "setup" | "settings" | "compose" | "inbox";

export function App() {
  const [view, setView] = useState<View>(() =>
    hasApiKey() ? "menu" : "setup"
  );
  const [selectedMenuItem, setSelectedMenuItem] = useState(0);
  const [composeContext, setComposeContext] = useState<ComposeContext | null>(null);

  const menuItems = [
    { key: "c", label: "Compose", description: "Write a new email", view: "compose" as View },
    { key: "i", label: "Inbox", description: "View received emails", view: "inbox" as View },
    { key: "s", label: "Settings", description: "Configure email & signature", view: "settings" as View },
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
      const item = menuItems.find((m) => m.key === e.name);
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
    setView("menu");
  };

  const handleCompose = (context: ComposeContext) => {
    setComposeContext(context);
    setView("compose");
  };

  if (view === "setup") {
    return <Setup onComplete={handleSetupComplete} />;
  }

  if (view === "settings") {
    return <Settings onBack={handleBack} />;
  }

  if (view === "compose") {
    return <Compose onBack={handleBack} context={composeContext} />;
  }

  if (view === "inbox") {
    return <Inbox onBack={handleBack} onCompose={handleCompose} />;
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
