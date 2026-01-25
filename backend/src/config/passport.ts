import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { findUserByEmail, findUserById, User } from '../models/User';
import { comparePassword } from '../services/authService';

/**
 * Configure Passport Local Strategy for login
 * This strategy is used for email/password authentication
 */
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        // Find user by email
        const user = await findUserByEmail(email);

        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await comparePassword(password, user.passwordHash);

        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Authentication successful
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

/**
 * Configure Passport JWT Strategy for protected routes
 * This strategy extracts JWT from Authorization header and validates it
 */
const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      // Find user by ID from JWT payload
      const user = await findUserById(payload.userId);

      if (!user) {
        return done(null, false);
      }

      // Attach simplified user info to request
      return done(null, {
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      return done(error, false);
    }
  })
);

/**
 * Future: Add Google OAuth Strategy
 *
 * import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
 *
 * passport.use(
 *   new GoogleStrategy(
 *     {
 *       clientID: process.env.GOOGLE_CLIENT_ID,
 *       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
 *       callbackURL: '/api/auth/google/callback',
 *     },
 *     async (accessToken, refreshToken, profile, done) => {
 *       // Find or create user based on Google profile
 *       // Return user
 *     }
 *   )
 * );
 */

export default passport;
