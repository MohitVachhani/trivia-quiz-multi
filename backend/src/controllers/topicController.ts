import { Request, Response, NextFunction } from 'express';
import { getAvailableTopics, getTopicById } from '../models/Topic';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/apiResponse';

/**
 * GET /api/quiz/topics
 * Get all available topics
 */
export async function getTopics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const topics = await getAvailableTopics();

    sendSuccess(res, { topics });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/quiz/topics/:id
 * Get a single topic by ID
 */
export async function getTopic(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest('MISSING_ID', 'Topic ID is required');
    }

    const topic = await getTopicById(id);

    if (!topic) {
      throw ApiError.notFound('TOPIC_NOT_FOUND', 'Topic not found');
    }

    sendSuccess(res, { topic });
  } catch (error) {
    next(error);
  }
}
