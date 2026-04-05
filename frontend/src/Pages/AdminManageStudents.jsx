import React, { useState, useEffect } from "react";
import * as ExcelJS from "exceljs";
import Papa from "papaparse";

const mockStudents = [
  { id: 1, name: "Alice", email: "alice@mail.com", status: "active", role: "student", country: "Tunisia", enrolledDate: "2026-01-10" },
  { id: 2, name: "Bob", email: "bob@mail.com", status: "inactive", role: "student", country: "Tunisia", enrolledDate: "2026-02-05" },
];

const AdminManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", country: "", status: "active", role: "student" });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    setStudents(mockStudents);
  }, []);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusFilter ? student.status === statusFilter : true)
  );

  const handleBulkAction = (action) => {
    setStudents(prev =>
      prev.map(student =>
        selectedIds.includes(student.id)
          ? { ...student, status: action === "activate" ? "active" : action === "deactivate" ? "inactive" : student.status }
          : student
      ).filter(student => action !== "delete" || !selectedIds.includes(student.id))
    );
    setSelectedIds([]);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setStudents(prev =>
        prev.map(s => s.id === editingId ? { ...s, ...formData } : s)
      );
    } else {
      const newStudent = { id: Date.now(), enrolledDate: new Date().toISOString().split('T')[0], ...formData };
      setStudents(prev => [...prev, newStudent]);
    }
    setFormData({ name: "", email: "", country: "", status: "active", role: "student" });
    setEditingId(null);
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setFormData({ name: student.name, email: student.email, country: student.country, status: student.status, role: student.role });
  };

  const exportCSV = () => {
    const csv = Papa.unparse(filteredStudents);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "students.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportXLSX = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Students");
    sheet.columns = [
      { header: "ID", key: "id" },
      { header: "Name", key: "name" },
      { header: "Email", key: "email" },
      { header: "Status", key: "status" },
      { header: "Role", key: "role" },
      { header: "Country", key: "country" },
      { header: "Enrolled Date", key: "enrolledDate" },
    ];
    sheet.addRows(filteredStudents);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "students.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Admin Student Management</h2>

      {/* 🔹 Formulaire Créer / Editer */}
      <form onSubmit={handleFormSubmit} className="mb-4 flex flex-col gap-2 border p-4 rounded">
        <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="border p-2 rounded"/>
        <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="border p-2 rounded"/>
        <input type="text" placeholder="Country" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} className="border p-2 rounded"/>
        <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="border p-2 rounded">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">{editingId ? "Update Student" : "Add Student"}</button>
      </form>

      {/* 🔹 Search & Filter */}
      <div className="flex gap-2 mb-4">
        <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border p-2 rounded"/>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border p-2 rounded">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* 🔹 Bulk Actions */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => handleBulkAction("activate")} className="bg-green-500 text-white p-2 rounded">Activate</button>
        <button onClick={() => handleBulkAction("deactivate")} className="bg-yellow-500 text-white p-2 rounded">Deactivate</button>
        <button onClick={() => handleBulkAction("delete")} className="bg-red-500 text-white p-2 rounded">Delete</button>
        <button onClick={exportCSV} className="bg-blue-500 text-white p-2 rounded">Export CSV</button>
        <button onClick={exportXLSX} className="bg-purple-500 text-white p-2 rounded">Export XLSX</button>
      </div>

      {/* 🔹 Table */}
      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border p-2">
              <input type="checkbox" onChange={(e) => e.target.checked ? setSelectedIds(filteredStudents.map(s => s.id)) : setSelectedIds([])} checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}/>
            </th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Country</th>
            <th className="border p-2">Enrolled Date</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map(student => (
            <tr key={student.id} className={selectedIds.includes(student.id) ? "bg-gray-200" : ""}>
              <td className="border p-2">
                <input type="checkbox" checked={selectedIds.includes(student.id)} onChange={(e) => e.target.checked ? setSelectedIds(prev => [...prev, student.id]) : setSelectedIds(prev => prev.filter(id => id !== student.id))}/>
              </td>
              <td className="border p-2">{student.name}</td>
              <td className="border p-2">{student.email}</td>
              <td className="border p-2">{student.status}</td>
              <td className="border p-2">{student.role}</td>
              <td className="border p-2">{student.country}</td>
              <td className="border p-2">{student.enrolledDate}</td>
              <td className="border p-2 flex gap-2">
                <button onClick={() => handleEdit(student)} className="bg-yellow-500 text-white px-2 py-1 rounded">Edit</button>
                <button onClick={() => handleBulkAction("delete", [student.id])} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminManageStudents;