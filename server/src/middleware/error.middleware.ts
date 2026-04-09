import { Request, Response, NextFunction } from 'express';

function collectValidationMessage(err: { errors?: Record<string, { message?: string }> }) {
  if (!err.errors) return 'Validation failed';
  return Object.values(err.errors)
    .map((e) => e.message)
    .filter(Boolean)
    .join('. ');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);

  if (res.headersSent) {
    return;
  }

  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      message: collectValidationMessage(err),
    });
  }

  if (err?.type === 'entity.too.large' || err?.status === 413) {
    return res.status(413).json({
      message: 'Request body is too large (try a smaller profile photo or remove the image).',
    });
  }

  res.status(500).json({
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'development' ? String(err) : undefined,
  });
};

