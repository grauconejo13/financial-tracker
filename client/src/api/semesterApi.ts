import { getApiOrigin } from "../config/apiOrigin";

const API_BASE = getApiOrigin();

export async function saveSemester(startDate: string, endDate: string) {
  const response = await fetch(`${API_BASE}/api/semester/set`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate,
      endDate,
    }),
  });

  return response.json();
}

export async function getSemester(userId: number) {
  const response = await fetch(`${API_BASE}/api/semester/${userId}`);
  return response.json();
}
