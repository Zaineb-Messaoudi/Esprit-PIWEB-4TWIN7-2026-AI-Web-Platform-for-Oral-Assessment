import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  GraduationCap, Plus, Search, Edit, Trash2,
  UserX, UserCheck, ChevronUp, ChevronDown, Loader2
} from "lucide-react";
import { useTheme } from "../context/ThemeContect.jsx";

const API = "http://127.0.0.1:3000/api/admin";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── Empty form state ────────────────────────────────────────────────────────
const EMPTY_FORM = { name: "", email: "", status: "active" };

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminManageTeachers = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [teachers, setTeachers]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingId, setLoadingId]     = useState(null);   // row-level spinner
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm]   = useState("");
  const [formData, setFormData]       = useState(EMPTY_FORM);
  const [editingId, setEditingId]     = useState(null);
  const [formError, setFormError]     = useState("");
  const [sortKey, setSortKey]         = useState("name");
  const [sortAsc, setSortAsc]         = useState(true);

  // ── Theme tokens (mirrors Doc 2 palette) ─────────────────────────────────
  const bg        = isDark ? "bg-gray-900"    : "bg-white";
  const surface   = isDark ? "bg-gray-800/60" : "bg-gray-50";
  const border    = isDark ? "border-gray-700" : "border-gray-200";
  const text      = isDark ? "text-gray-100"  : "text-gray-900";
  const sub       = isDark ? "text-gray-400"  : "text-gray-500";
  const inputCls  = `w-full border rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30 ${
    isDark
      ? "bg-gray-700/60 border-gray-600 text-gray-100 placeholder-gray-500"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
  }`;
  const theadCls  = isDark ? "bg-gray-800 text-gray-400" : "bg-gray-50 text-gray-500";
  const rowHover  = isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-50";
  const rowBorder = isDark ? "border-gray-700/60"   : "border-gray-100";

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/teachers`, { headers: authHeaders() });
      // normalise shape: support both { name } and { first_name, last_name }
      const normalised = res.data.map((t) => ({
        ...t,
        name: t.name ?? `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim(),
        status: t.status ?? (t.is_active ? "active" : "inactive"),
      }));
      setTeachers(normalised);
    } catch (e) {
      console.error("Failed to fetch teachers:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  // ── Filter + Sort ─────────────────────────────────────────────────────────
  const filteredTeachers = teachers
    .filter((t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const va = (a[sortKey] ?? "").toString().toLowerCase();
      const vb = (b[sortKey] ?? "").toString().toLowerCase();
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  };

  // ── Selection helpers ─────────────────────────────────────────────────────
  const allSelected =
    filteredTeachers.length > 0 &&
    filteredTeachers.every((t) => selectedIds.includes(t.id));

  const toggleAll = (e) =>
    setSelectedIds(e.target.checked ? filteredTeachers.map((t) => t.id) : []);

  const toggleOne = (id, checked) =>
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const handleBulk = async (action) => {
    if (!selectedIds.length) return;
    if (action === "delete" && !window.confirm(`Delete ${selectedIds.length} teacher(s)?`)) return;

    const calls = selectedIds.map((id) => {
      if (action === "activate")
        return axios.put(`${API}/teachers/${id}/activate`, {}, { headers: authHeaders() });
      if (action === "deactivate")
        return axios.delete(`${API}/teachers/${id}/deactivate`, { headers: authHeaders() });
      if (action === "delete")
        return axios.delete(`${API}/teachers/${id}/delete`, { headers: authHeaders() });
      return Promise.resolve();
    });

    try {
      await Promise.all(calls);
      setTeachers((prev) =>
        action === "delete"
          ? prev.filter((t) => !selectedIds.includes(t.id))
          : prev.map((t) =>
              selectedIds.includes(t.id)
                ? { ...t, status: action === "activate" ? "active" : "inactive", is_active: action === "activate" }
                : t
            )
      );
    } catch (e) {
      console.error("Bulk action failed:", e);
      alert("One or more operations failed.");
    } finally {
      setSelectedIds([]);
    }
  };

  // ── Single row activate / deactivate / delete ─────────────────────────────
  const handleActivate = async (id) => {
    setLoadingId(id);
    try {
      await axios.put(`${API}/teachers/${id}/activate`, {}, { headers: authHeaders() });
      setTeachers((prev) =>
        prev.map((t) => t.id === id ? { ...t, status: "active", is_active: true } : t)
      );
    } catch (e) { console.error(e); }
    finally { setLoadingId(null); }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Deactivate this teacher?")) return;
    setLoadingId(id);
    try {
      await axios.delete(`${API}/teachers/${id}/deactivate`, { headers: authHeaders() });
      setTeachers((prev) =>
        prev.map((t) => t.id === id ? { ...t, status: "inactive", is_active: false } : t)
      );
    } catch (e) { console.error(e); }
    finally { setLoadingId(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this teacher?")) return;
    setLoadingId(id);
    try {
      await axios.delete(`${API}/teachers/${id}/delete`, { headers: authHeaders() });
      setTeachers((prev) => prev.filter((t) => t.id !== id));
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    } catch (e) {
      console.error(e);
      alert("Failed to delete teacher.");
    } finally { setLoadingId(null); }
  };

  // ── Form ──────────────────────────────────────────────────────────────────
  const handleEdit = (teacher) => {
    setEditingId(teacher.id);
    setFormData({ name: teacher.name, email: teacher.email, status: teacher.status });
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError("");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const payload = {
      name: formData.name,
      email: formData.email,
      status: formData.status,
      is_active: formData.status === "active",
    };

    try {
      if (editingId) {
        const res = await axios.put(`${API}/teachers/${editingId}`, payload, { headers: authHeaders() });
        const updated = { ...res.data, name: res.data.name ?? formData.name, status: formData.status };
        setTeachers((prev) => prev.map((t) => t.id === editingId ? { ...t, ...updated } : t));
      } else {
        const res = await axios.post(`${API}/teachers`, payload, { headers: authHeaders() });
        const created = { ...res.data, name: res.data.name ?? formData.name, status: formData.status };
        setTeachers((prev) => [...prev, created]);
      }
      handleCancel();
    } catch (e) {
      console.error(e);
      setFormError(e.response?.data?.message ?? "Failed to save teacher. Please try again.");
    }
  };

  // ── Sort icon ─────────────────────────────────────────────────────────────
  const SortIcon = ({ col }) =>
    sortKey === col
      ? sortAsc ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />
      : <ChevronDown className={`w-3 h-3 inline ml-1 opacity-30`} />;

  // ── Status badge ──────────────────────────────────────────────────────────
  const StatusBadge = ({ status }) =>
    status === "active"
      ? <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${isDark ? "bg-green-500/20 text-green-300" : "bg-green-100 text-green-700"}`}>Active</span>
      : <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-600"}`}>Inactive</span>;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 ${
          isDark ? "bg-gradient-to-br from-red-500 to-red-700" : "bg-gradient-to-br from-red-400 to-red-600"
        }`}>
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className={`text-2xl font-bold text-transparent bg-clip-text ${
            isDark ? "bg-gradient-to-r from-red-400 to-gray-400" : "bg-gradient-to-r from-red-600 to-gray-700"
          }`}>
            Teacher Management
          </h1>
          <p className={`text-sm mt-0.5 ${sub}`}>
            {teachers.length} teacher{teachers.length !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      {/* ── Create / Edit Form ── */}
      <div className={`rounded-2xl border p-5 ${surface} ${border}`}>
        <h2 className={`text-sm font-semibold mb-4 ${sub} uppercase tracking-wide`}>
          {editingId ? "Edit Teacher" : "Add New Teacher"}
        </h2>
        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className={`block text-xs mb-1 font-medium ${sub}`}>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Jane Smith"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className={`block text-xs mb-1 font-medium ${sub}`}>Email</label>
              <input
                type="email"
                placeholder="jane@school.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className={`block text-xs mb-1 font-medium ${sub}`}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={inputCls}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-500 mb-3">{formError}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 ${
                isDark ? "bg-red-600 hover:bg-red-500 text-white" : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              <Plus className="w-4 h-4" />
              {editingId ? "Update Teacher" : "Add Teacher"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isDark ? "text-gray-400 hover:bg-gray-700/60" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Search + Bulk Actions ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${sub}`} />
          <input
            type="text"
            placeholder="Search teachers…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
              {selectedIds.length} selected
            </span>
            <button
              onClick={() => handleBulk("activate")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isDark ? "text-green-400 hover:bg-green-400/10" : "text-green-600 hover:bg-green-50"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" /> Activate
            </button>
            <button
              onClick={() => handleBulk("deactivate")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isDark ? "text-yellow-400 hover:bg-yellow-400/10" : "text-yellow-600 hover:bg-yellow-50"
              }`}
            >
              <UserX className="w-3.5 h-3.5" /> Deactivate
            </button>
            <button
              onClick={() => handleBulk("delete")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isDark ? "text-red-400 hover:bg-red-400/10" : "text-red-500 hover:bg-red-50"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className={`rounded-2xl border overflow-hidden ${border}`}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${theadCls} text-xs font-semibold uppercase tracking-wide`}>
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded accent-red-500 cursor-pointer"
                    />
                  </th>
                  {[["name", "Name"], ["email", "Email"], ["status", "Status"]].map(([key, label]) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left cursor-pointer select-none hover:text-red-500 transition-colors"
                      onClick={() => handleSort(key)}
                    >
                      {label}<SortIcon col={key} />
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? "divide-gray-700/60" : "divide-gray-100"}`}>
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <GraduationCap className={`w-8 h-8 mx-auto mb-2 ${sub}`} />
                      <p className={`text-sm ${sub}`}>No teachers found</p>
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher) => {
                    const isLoading = loadingId === teacher.id;
                    const isSelected = selectedIds.includes(teacher.id);
                    return (
                      <tr
                        key={teacher.id}
                        className={`${rowHover} transition-colors ${
                          isSelected
                            ? isDark ? "bg-red-500/5" : "bg-red-50/60"
                            : ""
                        } ${!teacher.is_active ? "opacity-60" : ""}`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleOne(teacher.id, e.target.checked)}
                            className="rounded accent-red-500 cursor-pointer"
                          />
                        </td>

                        {/* Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                              isDark ? "bg-gradient-to-br from-red-500 to-gray-600 text-white" : "bg-gradient-to-br from-red-400 to-red-600 text-white"
                            }`}>
                              {teacher.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </div>
                            <span className={`font-medium ${text}`}>{teacher.name}</span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className={`px-4 py-3 ${sub}`}>{teacher.email}</td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <StatusBadge status={teacher.status} />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEdit(teacher)}
                                  title="Edit"
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isDark ? "text-blue-400 hover:bg-blue-400/10" : "text-blue-500 hover:bg-blue-50"
                                  }`}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                {teacher.status === "active" ? (
                                  <button
                                    onClick={() => handleDeactivate(teacher.id)}
                                    title="Deactivate"
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isDark ? "text-yellow-400 hover:bg-yellow-400/10" : "text-yellow-500 hover:bg-yellow-50"
                                    }`}
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleActivate(teacher.id)}
                                    title="Activate"
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isDark ? "text-green-400 hover:bg-green-400/10" : "text-green-500 hover:bg-green-50"
                                    }`}
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDelete(teacher.id)}
                                  title="Delete permanently"
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isDark ? "text-red-400 hover:bg-red-400/10" : "text-red-500 hover:bg-red-50"
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Footer count ── */}
      {!loading && (
        <p className={`text-xs text-center ${sub}`}>
          Showing {filteredTeachers.length} of {teachers.length} teachers
        </p>
      )}
    </div>
  );
};

export default AdminManageTeachers;