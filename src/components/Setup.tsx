import React, { useState } from "react";
import { useKeyboard } from "@opentui/react";
import { setApiKey, setDefaultFrom } from "../config";
import { validateApiKey } from "../api/resend";

interface SetupProps {
  onComplete: () => void;
}

type SetupStep = "api-key" | "validating" | "default-from" | "done";

export function Setup({ onComplete }: SetupProps) {
  const [step, setStep] = useState<SetupStep>("api-key");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [fromInput, setFromInput] = useState("");
  const [error, setError] = useState("");

  useKeyboard(async (e) => {
    if (step === "api-key") {
      if (e.name === "return") {
        if (apiKeyInput.trim()) {
          setStep("validating");
          setError("");
          const valid = await validateApiKey(apiKeyInput.trim());
          if (valid) {
            setApiKey(apiKeyInput.trim());
            setStep("default-from");
          } else {
            setError("Invalid API key. Please try again.");
            setStep("api-key");
          }
        }
      } else if (e.name === "backspace") {
        setApiKeyInput((prev) => prev.slice(0, -1));
      } else if (e.name.length === 1) {
        setApiKeyInput((prev) => prev + e.name);
      }
    } else if (step === "default-from") {
      if (e.name === "return") {
        if (fromInput.trim()) {
          setDefaultFrom(fromInput.trim());
        }
        setStep("done");
        onComplete();
      } else if (e.name === "backspace") {
        setFromInput((prev) => prev.slice(0, -1));
      } else if (e.name.length === 1) {
        setFromInput((prev) => prev + e.name);
      }
    }
  });

  return (
    <box flexDirection="column" padding={1}>
      <text bold color="cyan">
        Welcome to Hypermail
      </text>
      <text> </text>
      <text>Let's set up your Resend API key.</text>
      <text> </text>

      {step === "api-key" && (
        <>
          <text>
            Get your API key from: https://resend.com/api-keys
          </text>
          <text> </text>
          <text>Enter your Resend API key:</text>
          <box flexDirection="row">
            <text color="green">&gt; </text>
            <text>{apiKeyInput.replace(/./g, "*")}</text>
            <text color="gray">_</text>
          </box>
          {error && (
            <>
              <text> </text>
              <text color="red">{error}</text>
            </>
          )}
        </>
      )}

      {step === "validating" && (
        <text color="yellow">Validating API key...</text>
      )}

      {step === "default-from" && (
        <>
          <text color="green">API key saved!</text>
          <text> </text>
          <text>Enter default "From" email (optional, press Enter to skip):</text>
          <box flexDirection="row">
            <text color="green">&gt; </text>
            <text>{fromInput}</text>
            <text color="gray">_</text>
          </box>
        </>
      )}
    </box>
  );
}
