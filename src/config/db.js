import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

/**
 * Health check helper to verify database connectivity & PostGIS extension state.
 */
export async function checkDatabaseConnection() {
  try {
    // Test basic SQL query execution
    await prisma.$queryRaw`SELECT 1;`;

    // Test PostGIS availability
    let postgisAvailable = false;
    try {
      const result = await prisma.$queryRaw`SELECT PostGIS_Version();`;
      if (result && result.length > 0) {
        postgisAvailable = true;
      }
    } catch {
      postgisAvailable = false;
    }

    return { connected: true, postgis: postgisAvailable };
  } catch (error) {
    return { connected: false, postgis: false, error: error.message };
  }
}
