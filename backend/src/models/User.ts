import { pool } from '../config/database';
import { QueryResult } from 'pg';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  gamesPlayed: number;
  victories: number;
  timePlayed: number;
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
}

export interface UserWithoutPassword extends Omit<User, 'passwordHash'> {}

/**
 * Create a new user in the database
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const query = `
    INSERT INTO users (email, password_hash)
    VALUES ($1, $2)
    RETURNING
      id, email, password_hash as "passwordHash",
      games_played as "gamesPlayed", victories,
      time_played as "timePlayed", total_points as "totalPoints",
      created_at as "createdAt", updated_at as "updatedAt",
      last_login_at as "lastLoginAt", is_active as "isActive"
  `;

  const result: QueryResult<User> = await pool.query(query, [
    input.email,
    input.passwordHash,
  ]);

  return result.rows[0];
}

/**
 * Find a user by email address
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const query = `
    SELECT
      id, email, password_hash as "passwordHash",
      games_played as "gamesPlayed", victories,
      time_played as "timePlayed", total_points as "totalPoints",
      created_at as "createdAt", updated_at as "updatedAt",
      last_login_at as "lastLoginAt", is_active as "isActive"
    FROM users
    WHERE email = $1 AND is_active = true
  `;

  const result: QueryResult<User> = await pool.query(query, [email]);

  return result.rows[0] || null;
}

/**
 * Find a user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  const query = `
    SELECT
      id, email, password_hash as "passwordHash",
      games_played as "gamesPlayed", victories,
      time_played as "timePlayed", total_points as "totalPoints",
      created_at as "createdAt", updated_at as "updatedAt",
      last_login_at as "lastLoginAt", is_active as "isActive"
    FROM users
    WHERE id = $1 AND is_active = true
  `;

  const result: QueryResult<User> = await pool.query(query, [id]);

  return result.rows[0] || null;
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  const query = `
    UPDATE users
    SET last_login_at = NOW()
    WHERE id = $1
  `;

  await pool.query(query, [userId]);
}

/**
 * Update user statistics (used after game completion)
 */
export async function updateUserStats(
  userId: string,
  stats: {
    gamesPlayed?: number;
    victories?: number;
    timePlayed?: number;
    totalPoints?: number;
  }
): Promise<void> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (stats.gamesPlayed !== undefined) {
    updates.push(`games_played = $${paramCount}`);
    values.push(stats.gamesPlayed);
    paramCount++;
  }

  if (stats.victories !== undefined) {
    updates.push(`victories = $${paramCount}`);
    values.push(stats.victories);
    paramCount++;
  }

  if (stats.timePlayed !== undefined) {
    updates.push(`time_played = $${paramCount}`);
    values.push(stats.timePlayed);
    paramCount++;
  }

  if (stats.totalPoints !== undefined) {
    updates.push(`total_points = $${paramCount}`);
    values.push(stats.totalPoints);
    paramCount++;
  }

  if (updates.length === 0) {
    return;
  }

  values.push(userId);

  const query = `
    UPDATE users
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE id = $${paramCount}
  `;

  await pool.query(query, values);
}

/**
 * Remove password hash from user object for safe responses
 */
export function sanitizeUser(user: User): UserWithoutPassword {
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
