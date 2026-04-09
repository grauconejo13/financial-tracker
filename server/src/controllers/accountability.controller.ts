import { Response, NextFunction } from 'express';
import { AccountabilityLog } from '../models/AccountabilityLog.model';
import { AuthRequest } from '../middleware/auth.middleware';

const MAX_LOGS = 500;

export const getMyAccountabilityLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const logs = await AccountabilityLog.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(MAX_LOGS)
      .lean();

    return res.json({ logs });
  } catch (err) {
    next(err);
  }
};
