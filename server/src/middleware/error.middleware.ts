import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);

  if (res.headersSent) {
    return;
  }

  res.status(500).json({
    message: 'Something went wrong',
    // In production you might hide this:
    error: process.env.NODE_ENV === 'development' ? String(err) : undefined
  });
};

