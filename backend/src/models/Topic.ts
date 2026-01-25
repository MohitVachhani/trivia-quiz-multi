import { pool } from '../config/database';
import { QueryResult } from 'pg';

export interface Topic {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all topics (including unavailable ones)
 */
export async function getAllTopics(): Promise<Topic[]> {
  const query = `
    SELECT
      id, slug, name, description,
      icon_url as "iconUrl",
      is_available as "isAvailable",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM trivia.topics
    ORDER BY name ASC
  `;

  const result: QueryResult<Topic> = await pool.query(query);
  return result.rows;
}

/**
 * Get only available topics (is_available = true)
 */
export async function getAvailableTopics(): Promise<Topic[]> {
  const query = `
    SELECT
      id, slug, name, description,
      icon_url as "iconUrl",
      is_available as "isAvailable",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM trivia.topics
    WHERE is_available = true
    ORDER BY name ASC
  `;

  const result: QueryResult<Topic> = await pool.query(query);
  return result.rows;
}

/**
 * Get a single topic by ID
 */
export async function getTopicById(id: string): Promise<Topic | null> {
  const query = `
    SELECT
      id, slug, name, description,
      icon_url as "iconUrl",
      is_available as "isAvailable",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM trivia.topics
    WHERE id = $1
  `;

  const result: QueryResult<Topic> = await pool.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * Get a single topic by slug
 */
export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  const query = `
    SELECT
      id, slug, name, description,
      icon_url as "iconUrl",
      is_available as "isAvailable",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM trivia.topics
    WHERE slug = $1
  `;

  const result: QueryResult<Topic> = await pool.query(query, [slug]);
  return result.rows[0] || null;
}
