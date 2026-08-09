import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Neighborly Server running on port ${PORT} [${config.nodeEnv}]`);
});
