import React, { useState, useEffect } from "react";

const AdminManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", status: "active" });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    // Simuler fetch depuis API
    setTeachers([
      { id: 1, name: "John Doe", email: "john@mail.com", status: "active" },
      { id: 2, name: "Jane Smith", email: "jane@mail.com", status: "inactive" },
      { id: 3, name: "Ali Ben Ahmed", email: "ali@mail.com", status: "active" },
    ]);
  }, []);

  // 🔹 Filtrage
  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔹 Bulk actions
  const handleBulk = (action) => {
    setTeachers(prev =>
      prev.map(t =>
        selectedIds.includes(t.id)
          ? { ...t, status: action === "activate" ? "active" : action === "deactivate" ? "inactive" : t.status }
          : t
      ).filter(t => action !== "delete" || !selectedIds.includes(t.id))
    );
    setSelectedIds([]);
  };

  // 🔹 Formulaire Create / Edit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setTeachers(prev =>
        prev.map(t => t.id === editingId ? { ...t, ...formData } : t)
      );
    } else {
      const newTeacher = { id: Date.now(), ...formData };
      setTeachers(prev => [...prev, newTeacher]);
    }
    setFormData({ name: "", email: "", status: "active" });
    setEditingId(null);
  };

  const handleEdit = (teacher) => {
    setEditingId(teacher.id);
    setFormData({ name: teacher.name, email: teacher.email, status: teacher.status });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Admin Teacher Management</h2>

      {/* 🔹 Formulaire Créer / Editer */}
      <form onSubmit={handleFormSubmit} className="mb-4 flex flex-col gap-2 border p-4 rounded">
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
          className="border p-2 rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
          className="border p-2 rounded"
        />
        <select
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
          className="border p-2 rounded"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          {editingId ? "Update Teacher" : "Add Teacher"}
        </button>
      </form>

      {/* 🔹 Search & Bulk Actions */}
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search teachers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded"
        />
        <div className="flex gap-2">
          <button onClick={() => handleBulk("activate")} className="bg-green-500 text-white px-3 py-1 rounded">Activate</button>
          <button onClick={() => handleBulk("deactivate")} className="bg-yellow-500 text-white px-3 py-1 rounded">Deactivate</button>
          <button onClick={() => handleBulk("delete")} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
        </div>
      </div>

      {/* 🔹 Table */}
      <table className="w-full table-auto border">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={(e) => e.target.checked ? setSelectedIds(filteredTeachers.map(t => t.id)) : setSelectedIds([])}
                checked={selectedIds.length === filteredTeachers.length && filteredTeachers.length > 0}
              />
            </th>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTeachers.map(teacher => (
            <tr key={teacher.id} className="border-t">
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(teacher.id)}
                  onChange={(e) => e.target.checked ? setSelectedIds(prev => [...prev, teacher.id]) : setSelectedIds(prev => prev.filter(id => id !== teacher.id))}
                />
              </td>
              <td>{teacher.name}</td>
              <td>{teacher.email}</td>
              <td>{teacher.status}</td>
              <td className="flex gap-2">
                <button onClick={() => handleEdit(teacher)} className="bg-yellow-500 text-white px-2 py-1 rounded">Edit</button>
                <button onClick={() => handleBulk("delete", [teacher.id])} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminManageTeachers;