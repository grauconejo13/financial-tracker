import axios from "axios";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const API_URL = `${API_BASE}/api/transactions`;

export interface Transaction {
  _id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category?: string;
  createdAt: string;
  updatedAt?: string;
}

export const getTransactions = async (
  token?: string,
): Promise<Transaction[]> => {
  const authToken = token || localStorage.getItem("clearpath_token");
  if (!authToken) {
    throw new Error("No auth token found");
  }

  try {
    const res = await axios.get<{ transactions: Transaction[] }>(API_URL, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    return res.data.transactions.map((t) =>({
      ...t,
      amount: Number(parseFloat(String(t.amount)).toFixed(2)),
    }));
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return []; // 👈 prevents crash
  }
};

export const editTransaction = async (
  id: string,
  data: {
    amount?: number;
    description?: string;
    category?: string;
    reason: string;
  },
  token: string,
): Promise<void> => {
  await axios.put(`${API_URL}/${id}`, {
    ...data,
    amount:
      data.amount !== undefined
        ? Number(parseFloat(String(data.amount)).toFixed(2))
      : undefined,
    },{
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const deleteTransaction = async (
  id: string,
  reason: string,
  token: string,
): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: { reason },
  });
};
