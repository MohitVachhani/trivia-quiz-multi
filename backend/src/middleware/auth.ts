import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { ApiError } from '../utils/ApiError';

/**
 * Middleware to authenticate requests using JWT
 * Uses Passport JWT strategy configured in config/passport.ts
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  passport.authenticate(
    'jwt',
    { session: false },
    (err: Error, user: Express.User, info: any) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return next(
          ApiError.unauthorized('UNAUTHORIZED', 'Authentication required')
        );
      }

      // Attach user to request object
      req.user = user as { userId: string; email: string };
      next();
    }
  )(req, res, next);
};

/**
 * Middleware to authenticate login requests using Local strategy
 * Uses Passport Local strategy configured in config/passport.ts
 */
export const authenticateLocal = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  passport.authenticate(
    'local',
    { session: false },
    (err: Error, user: any, info: any) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return next(
          ApiError.unauthorized(
            'INVALID_CREDENTIALS',
            info?.message || 'Invalid email or password'
          )
        );
      }

      // Attach user to request object
      req.user = {
        userId: user.id,
        email: user.email,
      };
      next();
    }
  )(req, res, next);
};
