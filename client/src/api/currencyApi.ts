import axios from "axios";

export const saveCurrency = async (currency: string, token: string) => {

  const res = await axios.post(
    "/api/user/currency",
    { currency },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.data;
};