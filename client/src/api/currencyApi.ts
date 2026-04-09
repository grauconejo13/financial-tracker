import axios from "axios";
import { getApiOrigin } from "../config/apiOrigin";
import type { User } from "./authApi";

export const saveCurrency = async (
  currency: string,
  token: string
): Promise<{
  message?: string;
  currency?: string;
  user?: User;
}> => {
  const res = await axios.post<{
    message?: string;
    currency?: string;
    user?: User;
  }>(
    `${getApiOrigin()}/api/user/currency`,
    { currency },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};
