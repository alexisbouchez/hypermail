import React, { useState } from "react";
import { useKeyboard } from "@opentui/react";
import { getContacts, addContact, deleteContact, Contact } from "../config";

interface ContactsProps {
  onBack: () => void;
  onSelectContact?: (contact: Contact) => void;
  selectMode?: boolean;
}

type View = "list" | "add" | "confirmDelete";
type AddField = "name" | "email";

export function Contacts({ onBack, onSelectContact, selectMode = false }: ContactsProps) {
  const [contacts, setContacts] = useState<Contact[]>(getContacts());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [view, setView] = useState<View>("list");
  const [addField, setAddField] = useState<AddField>("name");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query)
    );
  });

  const refreshContacts = () => {
    setContacts(getContacts());
  };

  useKeyboard((e) => {
    if (view === "add") {
      if (e.name === "escape") {
        setView("list");
        setNewName("");
        setNewEmail("");
        setAddField("name");
      } else if (e.name === "tab" || e.name === "down") {
        setAddField(addField === "name" ? "email" : "name");
      } else if (e.name === "up") {
        setAddField(addField === "email" ? "name" : "email");
      } else if (e.ctrl && e.name === "s") {
        if (newName && newEmail) {
          addContact({ name: newName, email: newEmail });
          refreshContacts();
          setView("list");
          setNewName("");
          setNewEmail("");
          setAddField("name");
        }
      } else if (e.name === "backspace") {
        if (addField === "name") {
          setNewName((prev) => prev.slice(0, -1));
        } else {
          setNewEmail((prev) => prev.slice(0, -1));
        }
      } else if (e.name.length === 1) {
        if (addField === "name") {
          setNewName((prev) => prev + e.name);
        } else {
          setNewEmail((prev) => prev + e.name);
        }
      } else if (e.name === "space") {
        if (addField === "name") {
          setNewName((prev) => prev + " ");
        } else {
          setNewEmail((prev) => prev + " ");
        }
      }
      return;
    }

    if (view === "confirmDelete") {
      if (e.name === "y") {
        const contact = filteredContacts[selectedIndex];
        deleteContact(contact.id);
        refreshContacts();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
        setView("list");
      } else if (e.name === "n" || e.name === "escape") {
        setView("list");
      }
      return;
    }

    if (searching) {
      if (e.name === "escape") {
        setSearching(false);
        setSearchQuery("");
        setSelectedIndex(0);
      } else if (e.name === "return") {
        setSearching(false);
      } else if (e.name === "backspace") {
        setSearchQuery((prev) => prev.slice(0, -1));
        setSelectedIndex(0);
      } else if (e.char && e.char.length === 1) {
        setSearchQuery((prev) => prev + e.char);
        setSelectedIndex(0);
      }
      return;
    }

    if (e.name === "escape" || e.name === "q") {
      if (searchQuery) {
        setSearchQuery("");
        setSelectedIndex(0);
      } else {
        onBack();
      }
    } else if (e.name === "up" || e.name === "k") {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (e.name === "down" || e.name === "j") {
      setSelectedIndex((prev) => Math.min(filteredContacts.length - 1, prev + 1));
    } else if (e.char === "/") {
      setSearching(true);
    } else if (e.char === "a") {
      setView("add");
    } else if (e.name === "return" && filteredContacts.length > 0) {
      if (selectMode && onSelectContact) {
        onSelectContact(filteredContacts[selectedIndex]);
      }
    } else if (e.char === "d" && filteredContacts.length > 0 && !selectMode) {
      setView("confirmDelete");
    }
  });

  if (view === "add") {
    return (
      <box flexDirection="column" padding={1}>
        <text bold color="cyan">
          Add Contact
        </text>
        <text color="gray">Tab: next field | Ctrl+S: save | Esc: cancel</text>
        <text> </text>
        <box flexDirection="row">
          <text color={addField === "name" ? "cyan" : "white"} bold={addField === "name"}>
            Name:{" "}
          </text>
          <text>{newName}</text>
          {addField === "name" && <text color="gray">_</text>}
        </box>
        <box flexDirection="row">
          <text color={addField === "email" ? "cyan" : "white"} bold={addField === "email"}>
            Email:{" "}
          </text>
          <text>{newEmail}</text>
          {addField === "email" && <text color="gray">_</text>}
        </box>
      </box>
    );
  }

  if (view === "confirmDelete" && filteredContacts.length > 0) {
    const contact = filteredContacts[selectedIndex];
    return (
      <box flexDirection="column" padding={1}>
        <text bold color="red">
          Delete Contact?
        </text>
        <text> </text>
        <text>Name: {contact.name}</text>
        <text>Email: {contact.email}</text>
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
        {selectMode ? "Select Contact" : "Contacts"}
      </text>
      <text color="gray">
        {selectMode
          ? "j/k: navigate | /: search | Enter: select | Esc: back"
          : "j/k: navigate | /: search | a: add | d: delete | Esc: back"}
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

      {contacts.length === 0 ? (
        <>
          <text color="yellow">No contacts yet.</text>
          <text> </text>
          <text>Press 'a' to add a contact.</text>
        </>
      ) : filteredContacts.length === 0 ? (
        <text color="yellow">No contacts match "{searchQuery}"</text>
      ) : (
        <>
          {filteredContacts.map((contact, index) => (
            <box key={contact.id} flexDirection="row">
              <text color={index === selectedIndex ? "cyan" : "white"}>
                {index === selectedIndex ? "> " : "  "}
              </text>
              <text bold={index === selectedIndex} color="magenta">
                {contact.name.slice(0, 20).padEnd(20)}
              </text>
              <text color="gray"> | </text>
              <text bold={index === selectedIndex}>
                {contact.email.slice(0, 35)}
              </text>
            </box>
          ))}
          <text> </text>
          <text color="gray">
            {filteredContacts.length}{searchQuery ? ` of ${contacts.length}` : ""} contact{filteredContacts.length !== 1 ? "s" : ""}
          </text>
        </>
      )}
    </box>
  );
}
