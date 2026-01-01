import React, { useState } from "react";
import { useKeyboard } from "@opentui/react";
import {
  getDefaultFrom,
  setDefaultFrom,
  getSignature,
  setSignature,
  getApiKey,
  setApiKey,
} from "../config";
import { validateApiKey, resetClient } from "../api/resend";

interface SettingsProps {
  onBack: () => void;
}

type SettingField = "from" | "signature" | "apiKey";
type Status = "editing" | "saving" | "saved" | "error";

export function Settings({ onBack }: SettingsProps) {
  const [field, setField] = useState<SettingField>("from");
  const [fromValue, setFromValue] = useState(getDefaultFrom() || "");
  const [signatureValue, setSignatureValue] = useState(getSignature() || "");
  const [apiKeyValue, setApiKeyValue] = useState(getApiKey() || "");
  const [status, setStatus] = useState<Status>("editing");
  const [error, setError] = useState("");

  const fields: SettingField[] = ["from", "signature", "apiKey"];
  const currentIndex = fields.indexOf(field);

  const getValue = () => {
    switch (field) {
      case "from":
        return fromValue;
      case "signature":
        return signatureValue;
      case "apiKey":
        return apiKeyValue;
    }
  };

  const setValue = (value: string) => {
    switch (field) {
      case "from":
        setFromValue(value);
        break;
      case "signature":
        setSignatureValue(value);
        break;
      case "apiKey":
        setApiKeyValue(value);
        break;
    }
  };

  async function saveSettings() {
    setStatus("saving");
    setError("");

    try {
      // Validate API key if changed
      const currentKey = getApiKey();
      if (apiKeyValue && apiKeyValue !== currentKey) {
        const valid = await validateApiKey(apiKeyValue);
        if (!valid) {
          setError("Invalid API key");
          setStatus("error");
          return;
        }
        setApiKey(apiKeyValue);
        resetClient();
      }

      if (fromValue) {
        setDefaultFrom(fromValue);
      }
      if (signatureValue) {
        setSignature(signatureValue);
      }

      setStatus("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setStatus("error");
    }
  }

  useKeyboard(async (e) => {
    if (status === "saved" || status === "error") {
      if (e.name === "escape" || e.name === "q" || e.name === "return") {
        onBack();
      }
      return;
    }

    if (e.name === "escape") {
      onBack();
    } else if (e.name === "tab" || e.name === "down") {
      const nextIndex = (currentIndex + 1) % fields.length;
      setField(fields[nextIndex]);
    } else if (e.name === "up") {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : fields.length - 1;
      setField(fields[prevIndex]);
    } else if (e.ctrl && e.name === "s") {
      await saveSettings();
    } else if (e.name === "backspace") {
      setValue(getValue().slice(0, -1));
    } else if (e.name === "return" && field === "signature") {
      setValue(getValue() + "\n");
    } else if (e.name === "return") {
      const nextIndex = (currentIndex + 1) % fields.length;
      setField(fields[nextIndex]);
    } else if (e.name.length === 1) {
      setValue(getValue() + e.name);
    } else if (e.name === "space") {
      setValue(getValue() + " ");
    }
  });

  if (status === "saved") {
    return (
      <box flexDirection="column" padding={1}>
        <text bold color="green">
          Settings saved!
        </text>
        <text> </text>
        <text color="gray">Press Enter or Esc to go back</text>
      </box>
    );
  }

  if (status === "error") {
    return (
      <box flexDirection="column" padding={1}>
        <text bold color="red">
          Failed to save settings
        </text>
        <text color="red">{error}</text>
        <text> </text>
        <text color="gray">Press Enter or Esc to go back</text>
      </box>
    );
  }

  const renderField = (f: SettingField, label: string, masked = false) => {
    const isActive = field === f;
    let value = "";
    switch (f) {
      case "from":
        value = fromValue;
        break;
      case "signature":
        value = signatureValue;
        break;
      case "apiKey":
        value = masked ? apiKeyValue.replace(/./g, "*") : apiKeyValue;
        break;
    }

    return (
      <box flexDirection="column">
        <text color={isActive ? "cyan" : "gray"} bold={isActive}>
          {label}:
        </text>
        <box flexDirection="row">
          <text color="green">{isActive ? "> " : "  "}</text>
          <text>{value}</text>
          {isActive && <text color="gray">_</text>}
        </box>
      </box>
    );
  };

  return (
    <box flexDirection="column" padding={1}>
      <text bold color="cyan">
        Settings
      </text>
      <text color="gray">
        Tab/Arrows: navigate | Ctrl+S: save | Esc: back
      </text>
      <text> </text>

      {renderField("from", "Default From Email")}
      <text> </text>
      {renderField("apiKey", "API Key", true)}
      <text> </text>
      <text color={field === "signature" ? "cyan" : "gray"} bold={field === "signature"}>
        Signature (Enter for newlines):
      </text>
      <box borderStyle="single" padding={1} minHeight={3}>
        <text>{signatureValue}</text>
        {field === "signature" && <text color="gray">_</text>}
      </box>

      {status === "saving" && (
        <>
          <text> </text>
          <text color="yellow">Saving...</text>
        </>
      )}
    </box>
  );
}
