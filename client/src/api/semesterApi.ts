export async function saveSemester(startDate: string, endDate: string) {

  const response = await fetch("/api/semester/set", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      startDate,
      endDate
    })
  });

  return response.json();
}

export async function getSemester(userId: number) {

  const response = await fetch(`/api/semester/${userId}`);

  return response.json();
}