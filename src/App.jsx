import react, { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Database, Github, Loader2, Rocket, Send, ShieldCheck } from "lucide-react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

const emptyForm = {
  student_name: "",
  class_name: "Class 11",
  request: "",
};

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

export default function App() {
  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
      .select("id, student_name, class_name, request, created_at")
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

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
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

    if (!isSupabaseConfigured) {
      const localRow = {
        id: `local-${Date.now()}`,
        ...trimmed,
        created_at: new Date().toISOString(),
      };
      setRows((current) => [localRow, ...current]);
      setForm(emptyForm);
      setMessage("Saved locally in demo mode. Connect Supabase to save permanently.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("demo_requests").insert(trimmed);

    if (error) {
      setMessage(`Could not save request: ${error.message}`);
    } else {
      setForm(emptyForm);
      setMessage("Request saved successfully in Supabase.");
      await loadRequests();
    }

    setSaving(false);
  }

  return (
    <main className="page-shell">
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
