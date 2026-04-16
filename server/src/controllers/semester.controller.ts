import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Semester } from '../models/Semester.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { logAccountabilityEvent } from '../utils/accountability';

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const getMySemester = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const doc = await Semester.findOne({ user: user._id }).lean();
    if (!doc) {
      return res.json({ startDate: null, endDate: null });
    }

    return res.json({
      startDate: toYmd(new Date(doc.startDate)),
      endDate: toYmd(new Date(doc.endDate))
    });
  } catch (err) {
    next(err);
  }
};

export const setMySemester = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const { startDate, endDate } = req.body as {
      startDate?: string;
      endDate?: string;
    };

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const start = new Date(`${startDate}T12:00:00.000Z`);
    const end = new Date(`${endDate}T12:00:00.000Z`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format (use YYYY-MM-DD)' });
    }

    if (start > end) {
      return res.status(400).json({ message: 'startDate must be before endDate' });
    }

    const uid = new mongoose.Types.ObjectId(user._id);
    const previous = await Semester.findOne({ user: uid }).lean();
    const doc = await Semester.findOneAndUpdate(
      { user: uid },
      {
        $set: { startDate: start, endDate: end },
        $setOnInsert: { user: uid }
      },
      { new: true, upsert: true, runValidators: true }
    );

    await logAccountabilityEvent({
      userId: uid,
      action: 'semester_set',
      entityType: 'semester',
      entityId: doc._id,
      reason: 'Updated semester dates',
      detail: {
        before: {
          startDate: previous ? toYmd(new Date(previous.startDate)) : null,
          endDate: previous ? toYmd(new Date(previous.endDate)) : null,
        },
        after: {
          startDate: toYmd(doc.startDate),
          endDate: toYmd(doc.endDate),
        },
      },
    });

    return res.status(200).json({
      message: 'Semester saved',
      startDate: toYmd(doc.startDate),
      endDate: toYmd(doc.endDate)
    });
  } catch (err) {
    next(err);
  }
};
