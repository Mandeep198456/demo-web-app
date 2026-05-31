import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Database,
  FileText,
  Github,
  Image,
  Loader2,
  Moon,
  Paperclip,
  Rocket,
  Send,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

const emptyForm = {
  student_name: "",
  class_name: "Class 11",
  request: "",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const ATTACHMENT_BUCKET = "request-attachments";

const fallbackRows = [
  {
    id: "sample-1",
    student_name: "Aarav",
    class_name: "Class 11",
    request: "Need help with vectors and dot product.",
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-2",
    student_name: "Meera",
    class_name: "Class 12",
    request: "Please upload a revision worksheet for electrostatics.",
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
];

function getInitialTheme() {
  const savedTheme = localStorage.getItem("demo-theme");

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "Just now";
  }
}

function validateAttachment(file) {
  if (!file) {
    return "";
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return "Only PNG, JPG, WEBP images and PDF files are allowed.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "File size should be less than 10 MB.";
  }

  return "";
}

function createSafeFilePath(file) {
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "") || "attachment";

  const uniquePart = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return `requests/${uniquePart}-${safeName}`;
}

export default function App() {
  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState(getInitialTheme);
  const [attachment, setAttachment] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const status = useMemo(() => {
    if (!isSupabaseConfigured) {
      return {
        title: "Demo mode",
        text: "Add Supabase env variables to save and read real database records.",
        type: "warning",
      };
    }
    return {
      title: "Database connected",
      text: "This app is reading from your Supabase table.",
      type: "success",
    };
  }, []);

  const nextThemeLabel = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  async function loadRequests() {
    setLoading(true);
    setMessage("");

    if (!isSupabaseConfigured) {
      setRows(fallbackRows);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("demo_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      setMessage(`Could not load database rows: ${error.message}`);
      setRows([]);
    } else {
      setRows(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("demo-theme", theme);
  }, [theme]);

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  function handleAttachmentChange(event) {
    const selectedFile = event.target.files?.[0] || null;
    const validationMessage = validateAttachment(selectedFile);

    if (validationMessage) {
      setAttachment(null);
      setFileInputKey((current) => current + 1);
      setMessage(validationMessage);
      return;
    }

    setAttachment(selectedFile);
    setMessage("");
  }

  function removeAttachment() {
    setAttachment(null);
    setFileInputKey((current) => current + 1);
  }

  async function uploadAttachment(file) {
    const filePath = createSafeFilePath(file);

    const { error: uploadError } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Could not upload attachment: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from(ATTACHMENT_BUCKET).getPublicUrl(filePath);

    return {
      attachment_name: file.name,
      attachment_type: file.type,
      attachment_path: filePath,
      attachment_url: data.publicUrl,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const trimmed = {
      student_name: form.student_name.trim(),
      class_name: form.class_name.trim(),
      request: form.request.trim(),
    };

    if (!trimmed.student_name || !trimmed.class_name || !trimmed.request) {
      setMessage("Please fill student name, class, and request.");
      return;
    }

    const validationMessage = validateAttachment(attachment);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    if (!isSupabaseConfigured) {
      const localRow = {
        id: `local-${Date.now()}`,
        ...trimmed,
        attachment_name: attachment?.name || null,
        attachment_type: attachment?.type || null,
        created_at: new Date().toISOString(),
      };
      setRows((current) => [localRow, ...current]);
      setForm(emptyForm);
      setAttachment(null);
      setFileInputKey((current) => current + 1);
      setMessage("Saved locally in demo mode. Connect Supabase to save permanently.");
      return;
    }

    setSaving(true);

    try {
      const attachmentPayload = attachment ? await uploadAttachment(attachment) : {};
      const { error } = await supabase.from("demo_requests").insert({
        ...trimmed,
        ...attachmentPayload,
      });

      if (error) {
        setMessage(`Could not save request: ${error.message}`);
      } else {
        setForm(emptyForm);
        setAttachment(null);
        setFileInputKey((current) => current + 1);
        setMessage("Request saved successfully in Supabase.");
        await loadRequests();
      }
    } catch (error) {
      setMessage(error.message || "Could not save request.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="top-bar">
        <div>
          <p className="mini-label">Theme enabled demo</p>
          <strong>User can switch between light and dark mode</strong>
        </div>
        <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={nextThemeLabel}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
      </div>

      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Full workflow demo</p>
          <h1>Supabase + GitHub + Vercel Demo App</h1>
          <p className="hero-text">
            A small student request tracker that can be pushed to GitHub, connected to Supabase, and deployed on Vercel.
          </p>
          <div className="workflow-row">
            <span><Github size={16} /> GitHub repo</span>
            <span><Database size={16} /> Supabase DB</span>
            <span><Rocket size={16} /> Vercel deploy</span>
          </div>
        </div>
        <div className={`status-card ${status.type}`}>
          <ShieldCheck size={24} />
          <div>
            <strong>{status.title}</strong>
            <p>{status.text}</p>
          </div>
        </div>
      </section>

      <section className="grid-layout">
        <form className="panel" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <BookOpen />
            <div>
              <h2>Add Student Request</h2>
              <p>This form inserts a row into the Supabase table.</p>
            </div>
          </div>

          <label>
            Student name
            <input
              value={form.student_name}
              onChange={(event) => updateForm("student_name", event.target.value)}
              placeholder="e.g. Aryan"
            />
          </label>

          <label>
            Class
            <select
              value={form.class_name}
              onChange={(event) => updateForm("class_name", event.target.value)}
            >
              <option>Class 9</option>
              <option>Class 10</option>
              <option>Class 11</option>
              <option>Class 12</option>
              <option>JEE</option>
              <option>NEET</option>
            </select>
          </label>

          <label>
            Request / doubt
            <textarea
              value={form.request}
              onChange={(event) => updateForm("request", event.target.value)}
              placeholder="Write the student's request here..."
              rows={5}
            />
          </label>

          <label>
            Attachment image / PDF optional
            <div className="attachment-box">
              <div className="attachment-input-row">
                <Paperclip size={18} />
                <input
                  key={fileInputKey}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleAttachmentChange}
                />
              </div>
              <p>Allowed: PNG, JPG, WEBP or PDF. Maximum file size: 10 MB.</p>
              {attachment && (
                <div className="selected-file">
                  {attachment.type === "application/pdf" ? <FileText size={18} /> : <Image size={18} />}
                  <span>{attachment.name}</span>
                  <button type="button" className="remove-file-button" onClick={removeAttachment}>
                    <X size={14} /> Remove
                  </button>
                </div>
              )}
            </div>
          </label>

          <button type="submit" disabled={saving}>
            {saving ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
            {saving ? "Saving..." : "Save Request"}
          </button>

          {message && <p className="message">{message}</p>}
        </form>

        <section className="panel list-panel">
          <div className="panel-heading">
            <CheckCircle2 />
            <div>
              <h2>Recent Requests</h2>
              <p>These rows are fetched from Supabase after setup.</p>
            </div>
          </div>

          {loading ? (
            <div className="loading-box">
              <Loader2 className="spin" /> Loading requests...
            </div>
          ) : rows.length === 0 ? (
            <div className="empty-box">No requests found yet.</div>
          ) : (
            <div className="request-list">
              {rows.map((row) => (
                <article className="request-card" key={row.id}>
                  <div>
                    <h3>{row.student_name}</h3>
                    <span>{row.class_name}</span>
                  </div>
                  <p>{row.request}</p>
                  {row.attachment_url ? (
                    <a className="attachment-link" href={row.attachment_url} target="_blank" rel="noreferrer">
                      {row.attachment_type === "application/pdf" ? <FileText size={16} /> : <Image size={16} />}
                      {row.attachment_name || "View attachment"}
                    </a>
                  ) : row.attachment_name ? (
                    <p className="local-attachment-note">
                      <Paperclip size={15} /> {row.attachment_name}
                    </p>
                  ) : null}
                  <time>{formatDate(row.created_at)}</time>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
