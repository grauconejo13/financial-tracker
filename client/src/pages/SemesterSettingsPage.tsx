import { useState } from "react";
import { saveSemester } from "../api/semesterApi";

export default function SemesterSettingsPage() {

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSave = async () => {

    if (startDate > endDate) {
      alert("Start date must be before end date");
      return;
    }

    await saveSemester(startDate, endDate);

    alert("Semester saved");
  };

  return (
    <div>

      <h2>Semester Settings</h2>

      <input type="date" onChange={(e)=>setStartDate(e.target.value)} />
      <input type="date" onChange={(e)=>setEndDate(e.target.value)} />

      <button onClick={handleSave}>
        Save
      </button>

    </div>
  );
}