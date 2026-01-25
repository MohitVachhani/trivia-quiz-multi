import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../config/database';
import { checkRedisConnection } from '../config/redis';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    const [dbConnected, redisConnected] = await Promise.all([
      checkDatabaseConnection(),
      checkRedisConnection(),
    ]);

    const health = {
      status: dbConnected && redisConnected ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      services: {
        database: dbConnected ? 'connected' : 'disconnected',
        redis: redisConnected ? 'connected' : 'disconnected',
      },
    };

    const statusCode = health.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

export default router;
