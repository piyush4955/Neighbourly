import { checkDatabaseConnection } from '../config/db.js';

export async function getHealthStatus(req, res, next) {
  try {
    const dbStatus = await checkDatabaseConnection();

    const statusCode = dbStatus.connected ? 200 : 503;
    res.status(statusCode).json({
      status: dbStatus.connected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbStatus.connected,
        postgis: dbStatus.postgis ? 'enabled' : 'not_detected',
        ...(dbStatus.error && { error: dbStatus.error })
      }
    });
  } catch (error) {
    next(error);
  }
}
