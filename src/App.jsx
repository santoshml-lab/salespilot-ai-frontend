import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bot,
  Building2,
  CheckCircle2,
  DollarSign,
  Flame,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Send,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";

const API_URL = "https://salespilot-agent.onrender.com";

function App() {
  const [leads, setLeads] = useState([]);
  const [goal, setGoal] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [error, setError] = useState("");
  const [showAddLead, setShowAddLead] = useState(false);

  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    company: "",
    requirement: "",
    budget: "",
  });

  // =========================
  // LOAD LEADS
  // =========================

  const loadLeads = async () => {
    setLoadingLeads(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal: "Show me all existing leads.",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load leads");
      }

      const result = data.result || "";

      // The backend returns a natural-language table.
      // We also refresh the dashboard through a second endpoint
      // when available. For now, parse the common markdown table.
      const lines = result.split("\n");

      const parsed = [];

      for (const line of lines) {
        if (
          line.includes("|") &&
          !line.includes("Lead ID") &&
          !line.includes("---")
        ) {
          const parts = line
            .split("|")
            .map((part) => part.trim())
            .filter(Boolean);

          if (parts.length >= 8 && !isNaN(Number(parts[0]))) {
            parsed.push({
              id: Number(parts[0]),
              name: parts[1],
              company: parts[2],
              email: parts[3],
              requirement: parts[4],
              budget: Number(
                parts[5].replace(/[₹,\s]/g, "")
              ),
              status: parts[6].toLowerCase(),
              lead_score:
                parts[7] === "—"
                  ? null
                  : Number(
                      parts[7].replace(
                        /[^0-9]/g,
                        ""
                      )
                    ),
            });
          }
        }
      }

      setLeads(parsed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingLeads(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  // =========================
  // RUN AI AGENT
  // =========================

  const runAgent = async () => {
    if (!goal.trim()) return;

    setLoading(true);
    setAnswer("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal: goal.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Agent request failed"
        );
      }

      setAnswer(
        data.result || "No response received."
      );

      await loadLeads();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CREATE LEAD
  // =========================

  const createLead = async (event) => {
    event.preventDefault();

    if (
      !newLead.name ||
      !newLead.email ||
      !newLead.company ||
      !newLead.requirement ||
      !newLead.budget
    ) {
      return;
    }

    setLoading(true);
    setError("");

    const prompt = `
Create a new lead with these details:

Name: ${newLead.name}
Email: ${newLead.email}
Company: ${newLead.company}
Requirement: ${newLead.requirement}
Budget: ${newLead.budget} rupees.

Create the lead and confirm the details.
`;

    try {
      const response = await fetch(
        `${API_URL}/agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            goal: prompt,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not create lead"
        );
      }

      setAnswer(
        data.result || "Lead created successfully."
      );

      setNewLead({
        name: "",
        email: "",
        company: "",
        requirement: "",
        budget: "",
      });

      setShowAddLead(false);

      await loadLeads();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // KEYBOARD
  // =========================

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      runAgent();
    }
  };

  // =========================
  // METRICS
  // =========================

  const totalLeads = leads.length;

  const hotLeads = leads.filter(
    (lead) => lead.status === "hot"
  ).length;

  const warmLeads = leads.filter(
    (lead) => lead.status === "warm"
  ).length;

  const coldLeads = leads.filter(
    (lead) => lead.status === "cold"
  ).length;

  const pipelineValue = leads.reduce(
    (total, lead) =>
      total + (Number(lead.budget) || 0),
    0
  );

  // =========================
  // CURRENCY
  // =========================

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  // =========================
  // STATUS CLASS
  // =========================

  const getStatusClass = (status) => {
    if (status === "hot") return "status-hot";
    if (status === "warm") return "status-warm";
    if (status === "cold") return "status-cold";
    return "status-new";
  };

  return (
    <div className="app">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-logo">
            <Sparkles size={20} />
          </div>

          <div>
            <strong>SalesPilot</strong>
            <span>AI CRM</span>
          </div>
        </div>

        <nav className="nav">

          <a
            href="#dashboard"
            className="nav-item active"
          >
            <Activity size={18} />
            Dashboard
          </a>

          <a
            href="#leads"
            className="nav-item"
          >
            <Users size={18} />
            Leads
          </a>

          <a
            href="#agent"
            className="nav-item"
          >
            <Bot size={18} />
            AI Agent
          </a>

        </nav>

        <div className="sidebar-bottom">

          <div className="online-card">
            <span className="online-dot" />

            <div>
              <strong>Agent Online</strong>
              <span>Groq powered</span>
            </div>
          </div>

        </div>

      </aside>

      {/* =========================
          MAIN
      ========================= */}

      <main className="main">

        {/* HEADER */}

        <header className="topbar">

          <div>
            <span className="breadcrumb">
              Workspace / Dashboard
            </span>

            <h1>Business Overview</h1>
          </div>

          <button
            className="add-button"
            onClick={() =>
              setShowAddLead(true)
            }
          >
            <Plus size={17} />
            Add Lead
          </button>

        </header>

        {/* =========================
            ERROR
        ========================= */}

        {error && (
          <div className="error-banner">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* =========================
            KPI CARDS
        ========================= */}

        <section
          className="stats-grid"
          id="dashboard"
        >

          <div className="stat-card">

            <div className="stat-top">
              <div className="stat-icon">
                <Users size={19} />
              </div>

              <span className="stat-label">
                TOTAL LEADS
              </span>
            </div>

            <strong className="stat-value">
              {totalLeads}
            </strong>

            <span className="stat-description">
              Leads in your CRM
            </span>

          </div>

          <div className="stat-card">

            <div className="stat-top">
              <div className="stat-icon hot-icon">
                <Flame size={19} />
              </div>

              <span className="stat-label">
                HOT LEADS
              </span>
            </div>

            <strong className="stat-value">
              {hotLeads}
            </strong>

            <span className="stat-description">
              High-priority prospects
            </span>

          </div>

          <div className="stat-card">

            <div className="stat-top">
              <div className="stat-icon">
                <Target size={19} />
              </div>

              <span className="stat-label">
                WARM LEADS
              </span>
            </div>

            <strong className="stat-value">
              {warmLeads}
            </strong>

            <span className="stat-description">
              Prospects to nurture
            </span>

          </div>

          <div className="stat-card">

            <div className="stat-top">
              <div className="stat-icon">
                <DollarSign size={19} />
              </div>

              <span className="stat-label">
                PIPELINE VALUE
              </span>
            </div>

            <strong className="stat-value">
              {formatCurrency(
                pipelineValue
              )}
            </strong>

            <span className="stat-description">
              Total potential value
            </span>

          </div>

        </section>

        {/* =========================
            AI AGENT
        ========================= */}

        <section
          className="agent-section"
          id="agent"
        >

          <div className="section-heading">

            <div>
              <span className="section-eyebrow">
                <Sparkles size={14} />
                AI POWERED
              </span>

              <h2>Ask SalesPilot</h2>

              <p>
                Ask questions, analyze leads,
                create prospects or calculate
                deals.
              </p>
            </div>

            <div className="agent-badge">
              <span />
              Ready
            </div>

          </div>

          <div className="agent-box">

            <div className="agent-box-icon">
              <Bot size={21} />
            </div>

            <textarea
              value={goal}
              onChange={(event) =>
                setGoal(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="e.g. Show me my hottest leads..."
              rows={3}
            />

            <button
              className="agent-send"
              onClick={runAgent}
              disabled={
                loading ||
                !goal.trim()
              }
            >
              {loading ? (
                <Loader2
                  size={18}
                  className="spin"
                />
              ) : (
                <Send size={18} />
              )}
            </button>

          </div>

          <div className="quick-actions">

            <button
              onClick={() => {
                setGoal(
                  "Show me all existing leads and identify which leads need the most attention."
                );
              }}
            >
              <Search size={15} />
              Analyze leads
            </button>

            <button
              onClick={() => {
                setGoal(
                  "Show me all hot leads."
                );
              }}
            >
              <Flame size={15} />
              Find hot leads
            </button>

            <button
              onClick={() => {
                setGoal(
                  "Calculate a deal for ₹100000 with a 10% discount."
                );
              }}
            >
              <DollarSign size={15} />
              Calculate deal
            </button>

          </div>

          {answer && (
            <div className="answer-box">

              <div className="answer-header">

                <div className="answer-agent">
                  <div className="answer-avatar">
                    <Sparkles size={15} />
                  </div>

                  <div>
                    <strong>
                      SalesPilot AI
                    </strong>

                    <span>
                      Completed
                    </span>
                  </div>
                </div>

                <CheckCircle2
                  size={18}
                />

              </div>

              <div className="answer-content">
                {answer}
              </div>

            </div>
          )}

        </section>

        {/* =========================
            LEADS
        ========================= */}

        <section
          className="leads-section"
          id="leads"
        >

          <div className="section-heading leads-heading">

            <div>
              <span className="section-eyebrow">
                <Users size={14} />
                CRM
              </span>

              <h2>Recent Leads</h2>

              <p>
                Manage and prioritize your
                sales opportunities.
              </p>
            </div>

            <button
              className="refresh-button"
              onClick={loadLeads}
              disabled={loadingLeads}
            >
              {loadingLeads ? (
                <Loader2
                  size={16}
                  className="spin"
                />
              ) : (
                "Refresh"
              )}
            </button>

          </div>

          <div className="leads-card">

            {loadingLeads ? (
              <div className="empty-state">
                <Loader2
                  size={25}
                  className="spin"
                />
                <span>
                  Loading CRM data...
                </span>
              </div>
            ) : leads.length === 0 ? (
              <div className="empty-state">
                <Building2 size={30} />

                <strong>
                  No leads found
                </strong>

                <span>
                  Add your first lead to get
                  started.
                </span>
              </div>
            ) : (
              <div className="table-wrapper">

                <table>

                  <thead>
                    <tr>
                      <th>LEAD</th>
                      <th>COMPANY</th>
                      <th>REQUIREMENT</th>
                      <th>BUDGET</th>
                      <th>STATUS</th>
                      <th>SCORE</th>
                    </tr>
                  </thead>

                  <tbody>

                    {leads.map((lead) => (

                      <tr key={lead.id}>

                        <td>
                          <div className="lead-person">

                            <div className="lead-avatar">
                              {lead.name
                                ?.charAt(0)
                                ?.toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {lead.name}
                              </strong>

                              <span>
                                {lead.email}
                              </span>
                            </div>

                          </div>
                        </td>

                        <td>
                          {lead.company}
                        </td>

                        <td>
                          {lead.requirement}
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              lead.budget
                            )}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`status ${getStatusClass(
                              lead.status
                            )}`}
                          >
                            {lead.status}
                          </span>
                        </td>

                        <td>
                          <div className="score">

                            <strong>
                              {lead.lead_score ??
                                "—"}
                            </strong>

                            {lead.lead_score && (
                              <span>
                                /100
                              </span>
                            )}

                          </div>
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>
            )}

          </div>

        </section>

        {/* =========================
            FOOTER
        ========================= */}

        <footer className="footer">
          <span>
            SalesPilot AI
          </span>

          <span>
            Autonomous Sales Intelligence
          </span>
        </footer>

      </main>

      {/* =========================
          ADD LEAD MODAL
      ========================= */}

      {showAddLead && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowAddLead(false)
          }
        >

          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <span className="section-eyebrow">
                  <Plus size={14} />
                  CRM
                </span>

                <h2>Add New Lead</h2>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowAddLead(false)
                }
              >
                <X size={18} />
              </button>

            </div>

            <form onSubmit={createLead}>

              <label>
                Name
                <input
                  value={newLead.name}
                  onChange={(event) =>
                    setNewLead({
                      ...newLead,
                      name: event.target.value,
                    })
                  }
                  placeholder="Rahul Sharma"
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={newLead.email}
                  onChange={(event) =>
                    setNewLead({
                      ...newLead,
                      email:
                        event.target.value,
                    })
                  }
                  placeholder="rahul@company.com"
                />
              </label>

              <label>
                Company
                <input
                  value={newLead.company}
                  onChange={(event) =>
                    setNewLead({
                      ...newLead,
                      company:
                        event.target.value,
                    })
                  }
                  placeholder="ABC Technologies"
                />
              </label>

              <label>
                Requirement
                <input
                  value={
                    newLead.requirement
                  }
                  onChange={(event) =>
                    setNewLead({
                      ...newLead,
                      requirement:
                        event.target.value,
                    })
                  }
                  placeholder="E-commerce website"
                />
              </label>

              <label>
                Budget
                <input
                  type="number"
                  value={newLead.budget}
                  onChange={(event) =>
                    setNewLead({
                      ...newLead,
                      budget:
                        event.target.value,
                    })
                  }
                  placeholder="80000"
                />
              </label>

              <button
                className="submit-lead"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2
                      size={16}
                      className="spin"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Create Lead
                  </>
                )}
              </button>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;
