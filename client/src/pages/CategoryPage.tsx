import { useEffect, useState } from "react";
import axios from "axios";

type Category = {
  _id: string;
  name: string;
  type: "income" | "expense";
};

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");

  // 🔗 Adjust this if using deployed backend
  const API = import.meta.env.VITE_API_URL || "";

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories", err);
    }
  };

  const addCategory = async () => {
    if (!name.trim()) return;

    try {
      await axios.post(`${API}/api/admin/categories`, {
        name,
        type,
      });
      setName("");
      fetchCategories();
    } catch (err) {
      console.error("Error adding category", err);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await axios.delete(`${API}/api/admin/categories/${id}`);
      fetchCategories();
    } catch (err) {
      console.error("Error deleting category", err);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axios.get(`${API}/api/admin/categories`);
        setCategories(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    loadCategories();
  }, [API]);

  return (
    <div className="container py-4">
      <h2 className="mb-4">Manage Categories</h2>

      {/* ➕ Add Category */}
      <div className="card p-3 mb-4 shadow-sm">
        <h5>Add New Category</h5>

        <div className="d-flex gap-2 mt-2">
          <input
            type="text"
            className="form-control"
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <select
            className="form-select"
            value={type}
            onChange={(e) => setType(e.target.value as "income" | "expense")}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <button className="btn btn-primary" onClick={addCategory}>
            Add
          </button>
        </div>
      </div>

      {/* 📋 Category List */}
      <div className="card p-3 shadow-sm">
        <h5>Existing Categories</h5>

        {categories.length === 0 ? (
          <p className="text-muted mt-2">No categories found.</p>
        ) : (
          <ul className="list-group mt-2">
            {categories.map((cat) => (
              <li
                key={cat._id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>
                  {cat.name} <small className="text-muted">({cat.type})</small>
                </span>

                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => deleteCategory(cat._id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
