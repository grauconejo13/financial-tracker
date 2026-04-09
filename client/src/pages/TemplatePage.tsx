import { useEffect, useState } from "react";
import axios from "axios";

type Template = {
  _id: string;
  name: string;
  type: string;
};

export default function TemplatePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("savings");

  const API = import.meta.env.VITE_API_URL || "";
  console.log("API URL:", API);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/templates`);
      setTemplates(res.data);
    } catch (err) {
      console.error("Error fetching templates", err);
    }
  };

  const addTemplate = async () => {
    if (!name.trim()) return;

    try {
      await axios.post(`${API}/api/admin/templates`, {
        name,
        type,
        sections: [], // keep simple for now
      });

      setName("");
      fetchTemplates();
    } catch (err) {
      console.error("Error adding template", err);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await axios.delete(`${API}/api/admin/templates/${id}`);
      fetchTemplates();
    } catch (err) {
      console.error("Error deleting template", err);
    }
  };

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await axios.get(`${API}/api/admin/templates`);
        setTemplates(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    loadTemplates();
  }, []);

  return (
    <div className="container py-4">
      <h2 className="mb-4">Manage Templates</h2>

      {/* ➕ Add Template */}
      <div className="card p-3 mb-4 shadow-sm">
        <h5>Create Template</h5>

        <div className="d-flex gap-2 mt-2">
          <input
            type="text"
            className="form-control"
            placeholder="Template name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <select
            className="form-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="savings">Savings</option>
            <option value="grocery">Grocery</option>
            <option value="rent">Rent</option>
            <option value="personal">Personal</option>
            <option value="vacation">Vacation</option>
            <option value="tuition">Tuition</option>
          </select>

          <button className="btn btn-primary" onClick={addTemplate}>
            Add
          </button>
        </div>
      </div>

      {/* 📋 Template List */}
      <div className="card p-3 shadow-sm">
        <h5>Existing Templates</h5>

        {templates.length === 0 ? (
          <p className="text-muted mt-2">No templates found.</p>
        ) : (
          <ul className="list-group mt-2">
            {templates.map((tpl) => (
              <li
                key={tpl._id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>
                  {tpl.name} <small className="text-muted">({tpl.type})</small>
                </span>

                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => deleteTemplate(tpl._id)}
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
