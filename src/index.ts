import "reflect-metadata";
import { Server } from "http";
import app from "@/app";
import { ENV } from "@/config/env";
import { logger } from "@/config/logger";
import { connectDatabase, sequelize } from "@/config/database";
import { WebSocketService } from "@/services/websocket.service";

let server: Server | undefined;

const startServer = async () => {
  await connectDatabase();

  server = app.listen(ENV.PORT, () => {
    logger.info(`Server running on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`);
  });

  // Initialize WebSocket service
  WebSocketService.getInstance(server);
};

startServer().catch((error) => {
  logger.error("Failed to start server", { error });
  process.exit(1);
});

// Graceful shutdown handler
const shutdown = async () => {
  logger.info("Shutdown signal received");

  // Add WebSocket cleanup
  const wsService = WebSocketService.getInstance();
  wsService.broadcast({ type: "shutdown", data: { message: "Server shutting down" } });

  // Add connection draining
  app.disable("connection"); // Stop accepting new connections

  // Add timeout for existing connections
  const connectionDrainTimeout = setTimeout(() => {
    logger.warn("Connection drain timeout reached, forcing shutdown");
    process.exit(1);
  }, 10000);

  if (!server) {
    await sequelize.close();
    process.exit(0);
    return;
  }

  server.close(async () => {
    logger.info("HTTP server closed");

    try {
      await sequelize.close();
      logger.info("Database connections closed");
      clearTimeout(connectionDrainTimeout);
      process.exit(0);
    } catch (err) {
      logger.error("Error during shutdown:", err);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default server;
