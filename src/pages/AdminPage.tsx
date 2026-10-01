import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
  Trash2,
  LockKeyhole,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Brand, ThemeToggle } from "../components/Brand";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/ui/dialog";
import { AppointmentForm } from "../components/AppointmentForm";
import {
  api,
  fetchAppointments,
  removeAppointment,
  setAdmin,
  setAppointments,
  setStatus,
  updateAppointment,
  useAppDispatch,
  useAppSelector,
} from "../store";
import type { Admin, Appointment, Status } from "../../shared/validation";
import { departments, statuses } from "../../shared/validation";
import { dateKey, displayDate, displayTime } from "../lib/utils";
import { demoAppointments } from "../demo";

const colors = ["#218c77", "#eda657", "#8599e1", "#c8ced5"];
export function AdminPage() {
  const preview = useLocation().pathname === "/admin/preview";
  const admin = useAppSelector((s) => s.auth.admin);
  const dispatch = useAppDispatch();
  const [checking, setChecking] = useState(!preview);
  useEffect(() => {
    if (preview) {
      dispatch(setAppointments(demoAppointments()));
      setChecking(false);
      return;
    }
    setChecking(true);
    api<Admin>("/auth/me")
      .then((a) => dispatch(setAdmin(a)))
      .catch(() => dispatch(setAdmin(null)))
      .finally(() => setChecking(false));
  }, [preview, dispatch]);
  if (checking)
    return (
      <div className="loading-screen">
        <Brand />
        <LoaderCircle className="spin" />
        <p>Checking your session…</p>
      </div>
    );
  return admin || preview ? <Dashboard preview={preview} /> : <Login />;
}
function Login() {
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      dispatch(
        setAdmin(
          await api<Admin>("/auth/login", {
            method: "POST",
            body: JSON.stringify({
              email: data.get("email"),
              password: data.get("password"),
            }),
          }),
        ),
      );
      toast.success("Welcome back to Careflow");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <header className="public-header">
        <Link to="/">
          <Brand />
        </Link>
        <ThemeToggle />
      </header>
      <main className="login-card">
        <div className="login-symbol">
          <LockKeyhole size={25} />
        </div>
        <div className="eyebrow">CLINIC WORKSPACE</div>
        <h1>Welcome back.</h1>
        <p className="muted">
          A calmer day starts here. Sign in to manage your clinic.
        </p>
        <form onSubmit={submit}>
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="admin@yourclinic.com"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={72}
              placeholder="Enter your password"
            />
          </label>
          {error && (
            <p className="error-box" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              "Sign in to workspace"
            )}
            <ArrowRight size={17} />
          </Button>
        </form>
        <p className="login-security">
          <ShieldCheck size={14} /> Secure access for clinic administrators
        </p>
        <Link className="muted back-link" to="/">
          <ArrowLeft size={15} /> Back to appointment booking
        </Link>
        <Link className="preview-link" to="/admin/preview">
          View dashboard with sample data <ArrowUpRight size={14} />
        </Link>
      </main>
    </div>
  );
}
function Dashboard({ preview }: { preview: boolean }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, loading, error } = useAppSelector((s) => s.appointments);
  const admin = useAppSelector((s) => s.auth.admin);
  const [section, setSection] = useState("Overview");
  const [sidebar, setSidebar] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setFilterStatus] = useState("all");
  const [department, setDepartment] = useState("all");
  const [date, setDate] = useState("");
  const [range, setRange] = useState("30");
  const [filters, setFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [newBooking, setNewBooking] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false); const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!preview) void dispatch(fetchAppointments());
  }, [dispatch, preview]);
  useEffect(() => {
    setPage(1);
  }, [query, status, department, date, section]);
  const today = dateKey(new Date());
  const todayAppointments = items.filter(
    (a) => dateKey(a.startsAt) === today && a.status !== "cancelled",
  );
  const pending = items.filter((a) => a.status === "pending");
  const filtered = useMemo(
    () =>
      items
        .filter((a) => {
          const search = `${a.name} ${a.email} ${a.phone}`
            .toLowerCase()
            .includes(query.toLowerCase());
          return (
            search &&
            (status === "all" || a.status === status) &&
            (department === "all" || a.department === department) &&
            (!date || dateKey(a.startsAt) === date) &&
            (section !== "Today’s schedule" || dateKey(a.startsAt) === today)
          );
        })
        .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)),
    [items, query, status, department, date, section, today],
  );
  const chartItems = items.filter(
    (a) =>
      Date.parse(a.startsAt) >= Date.now() - Number(range) * 86400_000 &&
      Date.parse(a.startsAt) <= Date.now() + 86400_000,
  );
  const trend = Array.from({ length: 7 }, (_, i) => {
    const start = new Date();
    start.setDate(start.getDate() - Math.round((Number(range) * (6 - i)) / 6));
    const key = dateKey(start);
    const next = new Date(start);
    next.setDate(next.getDate() + Math.ceil(Number(range) / 7));
    const bucket = chartItems.filter(
      (a) => dateKey(a.startsAt) >= key && dateKey(a.startsAt) < dateKey(next),
    );
    return {
      date: start.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      appointments: bucket.length,
      completed: bucket.filter((a) => a.status === "completed").length,
    };
  });
  const distribution = statuses.map((s) => ({
    name: s[0].toUpperCase() + s.slice(1),
    value: chartItems.filter((a) => a.status === s).length,
  }));
  const departmentData = departments.map((d) => ({
    name: d === "General medicine" ? "General" : d.slice(0, 9),
    appointments: chartItems.filter((a) => a.department === d).length,
  }));
  const pages = Math.max(1, Math.ceil(filtered.length / 7));
  const visiblePage = Math.min(page, pages);
  async function logout() {
    try {
      if (!preview) await api("/auth/logout", { method: "POST" });
      dispatch(setAdmin(null));
      dispatch(setAppointments([]));
      navigate("/admin");
    } catch (err) {
      toast.error(String(err));
    }
  }
  async function changeStatus(next: Status) {
    if (!selected) return;
    setBusy(true);
    try {
      const updated = preview
        ? { ...selected, status: next }
        : await setStatus(selected.id, next);
      dispatch(updateAppointment(updated));
      setSelected(updated);
      toast.success(
        preview ? "Sample appointment updated" : "Appointment status updated",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }
  async function deleteAppointment() {
    if (!selected) return;
    setBusy(true);
    try {
      if (!preview)
        await api("/appointments/" + selected.id, { method: "DELETE" });
      dispatch(removeAppointment(selected.id));
      setSelected(null);
      setConfirmDelete(false);
      toast.success("Appointment deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }
  function exportCSV() {
    const safe = (value: string) =>
      '"' +
      (/^[=+@\-\t\r]/.test(value) ? "'" : "") +
      value.replaceAll('"', '""') +
      '"';
    const rows = [
      ["Name", "Email", "Phone", "Department", "Start", "End", "Status"],
      ...filtered.map((a) => [
        a.name,
        a.email,
        a.phone,
        a.department,
        a.startsAt,
        a.endsAt,
        a.status,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(
        ["\uFEFF" + rows.map((row) => row.map(safe).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `careflow-appointments-${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Appointment export downloaded");
  }
  return (
    <div className="admin-layout">
      {sidebar && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebar(false)}
        />
      )}
      <aside className={`sidebar ${sidebar ? "sidebar-open" : ""}`}>
        <Link to="/">
          <Brand />
        </Link>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {[
            { title: "Overview", icon: LayoutDashboard },
            { title: "Appointments", icon: CalendarDays },
            { title: "Today’s schedule", icon: Clock3 },
            { title: "Patients", icon: Users },
          ].map(({ title, icon: Icon }) => (
            <button
              key={title}
              className={`nav-item ${section === title ? "active" : ""}`}
              onClick={() => {
                setSection(title);
                setSidebar(false);
              }}
            >
              <Icon size={19} />
              {title}
              {title === "Appointments" && (
                <span className="nav-count">{items.length}</span>
              )}
              {title === "Today’s schedule" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-care">
          <span className="sidebar-care-icon">
            <Activity size={22} />
          </span>
          <strong>
            A little more organized.
            <br />A lot more care.
          </strong>
          <p>Your clinic, running smoothly.</p>
          <Link to="/">
            View booking page <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <div className="secure-workspace">
            <ShieldCheck size={15} />
            <span>Secure clinic workspace</span>
          </div>
          <button className="profile" onClick={logout}>
            <span className="avatar admin-avatar">
              {(admin?.name || "Alex Morgan")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
            <span>
              <strong>{preview ? "Alex Morgan" : admin?.name}</strong>
              <small>Clinic administrator</small>
            </span>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <div className="breadcrumb">
            <Button
              size="icon"
              variant="ghost"
              className="mobile-menu"
              onClick={() => setSidebar(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </Button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{section}</strong>
          </div>
          <div className="admin-header-actions">
            <span className="header-date">
              {new Date().toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <ThemeToggle />
            <div className="notification-wrap">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Appointment alerts"
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={19} />
                {pending.length > 0 && <span className="notification-dot" />}
              </Button>
              {notifications && (
                <div className="notification-popover">
                  <strong>Appointment alerts</strong>
                  <p>{pending.length} requests waiting for confirmation</p>
                  {todayAppointments.length > 0 && (
                    <p>
                      {todayAppointments.length} appointments scheduled today
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSection("Appointments");
                      setFilterStatus("pending");
                      setNotifications(false);
                    }}
                  >
                    Review pending requests <ArrowRight size={14} />
                  </Button>
                </div>
              )}
            </div>
            <span className="avatar small-avatar">
              {preview ? "AM" : admin?.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </header>
        <main className="dashboard-content">
          {preview && (
            <div className="preview-banner">
              <span>
                <span className="live-dot" /> Preview workspace · sample data,
                no patient records
              </span>
              <Link to="/admin">
                Connect your clinic <ArrowUpRight size={14} />
              </Link>
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR CLINIC AT A GLANCE</div>
              <h1>
                {section === "Overview"
                  ? "A healthier day starts here."
                  : section === "Patients"
                    ? "People at the heart of your care."
                    : section === "Today’s schedule"
                      ? "Make today flow smoothly."
                      : "Every appointment, in one place."}
              </h1>
              <p className="muted">
                {section === "Overview"
                  ? "Here’s what’s happening at your clinic today."
                  : section === "Patients"
                    ? "Find patient contact details and their appointment history."
                    : "Keep track of requests and give every patient the care they deserve."}
              </p>
            </div>
            <div className="heading-actions">
              <Button variant="outline" onClick={exportCSV}>
                <ArrowDownToLine size={16} /> Export
              </Button>
              <Button
                onClick={() => {
                  if (preview)
                    toast.info(
                      "Use the public booking page to submit a real request.",
                    );
                  else setNewBooking(true);
                }}
              >
                <Plus size={17} /> New appointment
              </Button>
            </div>
          </div>
          {error && (
            <div className="error-box" role="alert">
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(fetchAppointments())}
              >
                Retry
              </Button>
            </div>
          )}
          {loading && (
            <div className="loading-inline">
              <LoaderCircle size={16} className="spin" /> Loading appointments…
            </div>
          )}
          <div className="stat-grid">
            <Stat
              title="Total appointments"
              value={items.length}
              icon={<CalendarDays size={20} />}
              detail="All appointment requests"
              color="green"
            />
            <Stat
              title="Today’s appointments"
              value={todayAppointments.length}
              icon={<Clock3 size={20} />}
              detail="Scheduled for today"
              color="blue"
            />
            <Stat
              title="Pending requests"
              value={pending.length}
              icon={<Activity size={20} />}
              detail="Waiting for confirmation"
              color="orange"
            />
            <Stat
              title="Completed visits"
              value={items.filter((a) => a.status === "completed").length}
              icon={<CheckCheck size={20} />}
              detail="Care successfully delivered"
              color="purple"
            />
          </div>
          {section === "Overview" && (
            <>
              <div className="chart-grid">
                <section className="panel trend-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>
                        Appointment activity{" "}
                        <span className="subtle-pill">Overview</span>
                      </h2>
                      <p>Small moments of care. A bigger picture.</p>
                    </div>
                    <select
                      className="compact-select"
                      aria-label="Chart date range"
                      value={range}
                      onChange={(e) => setRange(e.target.value)}
                    >
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                    </select>
                  </div>
                  <div className="chart-legend">
                    <span>
                      <i style={{ background: colors[0] }} />
                      Appointments
                    </span>
                    <span>
                      <i style={{ background: colors[2] }} />
                      Completed
                    </span>
                  </div>
                  <div className="line-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={trend}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="greenFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#218c77"
                              stopOpacity={0.17}
                            />
                            <stop
                              offset="100%"
                              stopColor="#218c77"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="4 5"
                          vertical={false}
                          stroke="var(--border)"
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "var(--muted)", fontSize: 11 }}
                          dy={10}
                        />
                        <YAxis
                          allowDecimals={false}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "var(--muted)", fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                            color: "var(--text)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="appointments"
                          name="Appointments"
                          stroke={colors[0]}
                          strokeWidth={2.5}
                          fill="url(#greenFill)"
                        />
                        <Area
                          type="monotone"
                          dataKey="completed"
                          name="Completed"
                          stroke={colors[2]}
                          strokeWidth={2}
                          strokeDasharray="5 4"
                          fill="transparent"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>
                <section className="panel status-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Appointment status</h2>
                      <p>A balance of your clinic’s activity</p>
                    </div>
                    <Activity size={18} className="muted" />
                  </div>
                  <div className="donut-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distribution}
                          dataKey="value"
                          innerRadius={64}
                          outerRadius={83}
                          paddingAngle={4}
                          stroke="none"
                          cornerRadius={5}
                        >
                          {distribution.map((d, i) => (
                            <Cell key={d.name} fill={colors[i]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                            color: "var(--text)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center">
                      <strong>{chartItems.length}</strong>
                      <span>appointments</span>
                    </div>
                  </div>
                  <div className="status-legend">
                    {distribution.map((d, i) => (
                      <div key={d.name}>
                        <span>
                          <i style={{ background: colors[i] }} />
                          {d.name}
                        </span>
                        <strong>{d.value}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <div className="today-notice">
                <div className="notice-icon">
                  <CalendarDays size={19} />
                </div>
                <div>
                  <strong>
                    {todayAppointments.length
                      ? `You have ${todayAppointments.length} appointments today`
                      : "A little breathing room today"}
                  </strong>
                  <span>
                    {pending.length
                      ? `${pending.length} pending requests need a little attention. Let’s keep things moving.`
                      : "All caught up. New appointment requests will appear here."}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSection("Today’s schedule");
                    setFilterStatus("all");
                  }}
                >
                  View schedule <ArrowRight size={16} />
                </Button>
              </div>
            </>
          )}
          {section === "Patients" ? (
            <PatientList
              items={items}
              query={query}
              onSearch={setQuery}
              onSelect={setSelected}
            />
          ) : (
            <section className="panel appointments-panel">
              <div className="table-top">
                <div>
                  <h2>
                    {section === "Today’s schedule"
                      ? "Today’s schedule"
                      : "Appointments"}{" "}
                    <span className="count-pill">{filtered.length}</span>
                  </h2>
                  <p>
                    {section === "Today’s schedule"
                      ? "Your day, one patient at a time."
                      : "A clear view of every visit, from request to recovery."}
                  </p>
                </div>
                <div className="table-controls">
                  <div className="search-input">
                    <Search size={16} />
                    <input
                      placeholder="Search patients…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      aria-label="Search patients"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters(!filters)}
                  >
                    <SlidersHorizontal size={15} /> Filters
                    {(status !== "all" || department !== "all" || date) && (
                      <span className="nav-dot" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Refresh appointments"
                    onClick={() => {
                      if (preview)
                        toast.info("Preview data is already up to date");
                      else void dispatch(fetchAppointments());
                    }}
                  >
                    <RefreshCw size={16} className={loading ? "spin" : ""} />
                  </Button>
                </div>
              </div>
              {filters && (
                <div className="filter-row">
                  <label>
                    Status
                    <select
                      value={status}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All statuses</option>
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s[0].toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Department
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      <option value="all">All departments</option>
                      {departments.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Appointment date
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterStatus("all");
                      setDepartment("all");
                      setDate("");
                      setQuery("");
                    }}
                  >
                    Reset
                  </Button>
                </div>
              )}
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Department</th>
                      <th>
                        Appointment date <ChevronRight size={12} />
                      </th>
                      <th>Time</th>
                      <th>Status</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered
                      .slice((visiblePage - 1) * 7, visiblePage * 7)
                      .map((a, i) => (
                        <tr key={a.id}>
                          <td>
                            <button
                              className="patient-cell"
                              onClick={() => {
                                setSelected(a);
                                setConfirmDelete(false);
                              }}
                            >
                              <span
                                className={`avatar patient-avatar avatar-${i % 4}`}
                              >
                                {a.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")}
                              </span>
                              <span>
                                <strong>{a.name}</strong>
                                <small>{a.email}</small>
                              </span>
                            </button>
                          </td>
                          <td>
                            <span className="department-label">
                              {a.department}
                            </span>
                          </td>
                          <td>{displayDate(a.startsAt)}</td>
                          <td>{displayTime(a.startsAt)}</td>
                          <td>
                            <StatusBadge status={a.status} />
                          </td>
                          <td>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`View ${a.name}'s appointment`}
                              onClick={() => {
                                setSelected(a);
                                setConfirmDelete(false);
                              }}
                            >
                              <MoreHorizontal size={18} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {!filtered.length && (
                  <div className="empty-state">
                    <CalendarDays size={32} />
                    <h3>
                      {items.length
                        ? "No matching appointments"
                        : "Your next chapter starts with a booking"}
                    </h3>
                    <p>
                      {items.length
                        ? "Try adjusting your search or filters."
                        : "Share your public booking page to start receiving patient requests."}
                    </p>
                    {items.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuery("");
                          setFilterStatus("all");
                          setDepartment("all");
                          setDate("");
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="table-footer">
                <span>
                  Showing {filtered.length ? (visiblePage - 1) * 7 + 1 : 0}–
                  {Math.min(visiblePage * 7, filtered.length)} of{" "}
                  {filtered.length} appointments
                </span>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={visiblePage === 1}
                    onClick={() => setPage(visiblePage - 1)}
                  >
                    <ChevronLeft size={15} /> Previous
                  </Button>
                  <span className="page-number">
                    {visiblePage} / {pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={visiblePage === pages}
                    onClick={() => setPage(visiblePage + 1)}
                  >
                    Next <ChevronRight size={15} />
                  </Button>
                </div>
              </div>
            </section>
          )}
          {section === "Overview" && (
            <section className="panel department-panel">
              <div className="panel-heading">
                <div>
                  <h2>Care by department</h2>
                  <p>
                    Appointment volume across specialties · last {range} days
                  </p>
                </div>
                <span className="subtle-pill">
                  {departments.length} departments
                </span>
              </div>
              <div className="bar-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentData}
                    margin={{ left: -20, right: 20, top: 15 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 5"
                      vertical={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted)", fontSize: 11 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted)", fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--soft)" }}
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        color: "var(--text)",
                      }}
                    />
                    <Bar
                      dataKey="appointments"
                      name="Appointments"
                      fill={colors[0]}
                      radius={[5, 5, 0, 0]}
                      maxBarSize={42}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
          <footer className="dashboard-footer">
            <span>Thoughtful care starts with a little clarity.</span>
            <span>
              <ShieldCheck size={13} /> Careflow clinic workspace
            </span>
          </footer>
        </main>
      </div>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setConfirmDelete(false);
          }
        }}
        title="Appointment details"
        description="Review the request and manage its status."
      >
        {selected && (
          <>
            <div className="detail-patient">
              <span className="avatar">
                {selected.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <h3>{selected.name}</h3>
                <a href={`mailto:${selected.email}`}>{selected.email}</a>
              </div>
              <StatusBadge status={selected.status} />
            </div>
            <dl className="detail-grid">
              <div>
                <dt>Phone</dt>
                <dd>
                  <a href={`tel:${selected.phone}`}>{selected.phone}</a>
                </dd>
              </div>
              <div>
                <dt>Department</dt>
                <dd>{selected.department}</dd>
              </div>
              <div>
                <dt>Appointment</dt>
                <dd>
                  {displayDate(selected.startsAt)}
                  <br />
                  {displayTime(selected.startsAt)}
                </dd>
              </div>
              <div>
                <dt>Ends</dt>
                <dd>
                  {displayDate(selected.endsAt)}
                  <br />
                  {displayTime(selected.endsAt)}
                </dd>
              </div>
            </dl>
            <div className="detail-description">
              <strong>Reason for visit</strong>
              <p>{selected.description}</p>
            </div>
            <label>
              Appointment status
              <select
                value={selected.status}
                disabled={busy}
                onChange={(e) => void changeStatus(e.target.value as Status)}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <div className="detail-actions">
              {confirmDelete ? (
                <>
                  <p>Permanently delete this appointment?</p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Keep appointment
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={busy}
                    onClick={() => void deleteAppointment()}
                  >
                    Delete permanently
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  className="danger-text"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={15} />
                  Delete appointment
                </Button>
              )}
            </div>
          </>
        )}
      </Dialog>
      <Dialog
        open={newBooking}
        onOpenChange={setNewBooking}
        title="New appointment"
        description="Create an appointment request on behalf of a patient."
      >
        <AppointmentForm
          onSuccess={() => {
            setNewBooking(false);
            void dispatch(fetchAppointments());
          }}
        />
      </Dialog>
    </div>
  );
}
function Stat({
  title,
  value,
  icon,
  detail,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  detail: string;
  color: string;
}) {
  return (
    <section className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <span className={`stat-icon ${color}`}>{icon}</span>
      </div>
      <div className="stat-value">
        {value}
        <span className="stat-mark">
          <ArrowUpRight size={16} />
        </span>
      </div>
      <p>
        <span className={`stat-detail-dot ${color}`} />
        {detail}
      </p>
    </section>
  );
}
function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status-badge ${status}`}>
      <i />
      {status[0].toUpperCase() + status.slice(1)}
    </span>
  );
}
function PatientList({
  items,
  query,
  onSearch,
  onSelect,
}: {
  items: Appointment[];
  query: string;
  onSearch: (value: string) => void;
  onSelect: (a: Appointment) => void;
}) {
  const patients = [
    ...new Map(
      items
        .filter((a) =>
          `${a.name} ${a.email}`.toLowerCase().includes(query.toLowerCase()),
        )
        .map((a) => [a.email, a]),
    ).values(),
  ];
  return (
    <section className="panel">
      <div className="table-top">
        <div>
          <h2>
            Patient directory{" "}
            <span className="count-pill">{patients.length}</span>
          </h2>
          <p>Contact details from appointment requests.</p>
        </div>
        <div className="search-input">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search patients…"
            aria-label="Search patient directory"
          />
        </div>
      </div>
      <div className="patient-directory">
        {patients.map((a) => (
          <button
            key={a.email}
            className="patient-directory-card"
            onClick={() => onSelect(a)}
          >
            <span className="avatar">
              {a.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
            <strong>{a.name}</strong>
            <span>{a.email}</span>
            <span>{a.phone}</span>
            <small>
              {items.filter((item) => item.email === a.email).length}{" "}
              appointment requests <ArrowUpRight size={13} />
            </small>
          </button>
        ))}
      </div>
      {!patients.length && (
        <div className="empty-state">
          <Users size={30} />
          <p>No patients found.</p>
        </div>
      )}
    </section>
  );
}
