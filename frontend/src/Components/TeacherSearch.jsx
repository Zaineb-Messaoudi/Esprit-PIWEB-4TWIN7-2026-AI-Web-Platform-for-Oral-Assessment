import { useState } from "react";
import axios from "axios";

const TeacherSearch = () => {
  const [filters, setFilters] = useState({
    active: "",
    email: "",
    role: "",
    date: "",
  });
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSearch = async () => {
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await axios.get(`/api/admin/teachers/search?${query}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la recherche !");
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-bold mb-4">Advanced Search 🔍</h2>

      <div className="flex flex-wrap gap-4 mb-4">
        <select
          name="active"
          value={filters.active}
          onChange={handleChange}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <input
          type="text"
          name="email"
          value={filters.email}
          onChange={handleChange}
          placeholder="Email"
          className="border px-2 py-1 rounded"
        />

        <input
          type="text"
          name="role"
          value={filters.role}
          onChange={handleChange}
          placeholder="Role"
          className="border px-2 py-1 rounded"
        />

        <input
          type="date"
          name="date"
          value={filters.date}
          onChange={handleChange}
          className="border px-2 py-1 rounded"
        />
      </div>

      <button
        onClick={handleSearch}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Search
      </button>

      <div className="mt-6">
        {results.length === 0 ? (
          <p>No results found</p>
        ) : (
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-2 py-1">ID</th>
                <th className="border px-2 py-1">Email</th>
                <th className="border px-2 py-1">Role</th>
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">Created At</th>
              </tr>
            </thead>
            <tbody>
              {results.map((t) => (
                <tr key={t.id}>
                  <td className="border px-2 py-1">{t.id}</td>
                  <td className="border px-2 py-1">{t.email}</td>
                  <td className="border px-2 py-1">{t.role}</td>
                  <td className="border px-2 py-1">{t.is_active ? "Active" : "Inactive"}</td>
                  <td className="border px-2 py-1">{t.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TeacherSearch;