import fs from "fs-extra";

const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');

let server;
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});

async function createProject(name, type) {
  const templateProjectDir = await cloneQuickstart(type);
  const projectDir = join(resolve(), name);
  await fs.mkdir(projectDir);
  await fs.copy(templateProjectDir, projectDir);
  const filename = fileURLToPath(import.meta.url);
  const templateDir = join(dirname(filename), "templates");
  const testSecret = "d44ed43c-fdd8-47c5-9607-f2373c7a0074";
  const templateFiles = await searchFile(templateDir, "mu");
  templateFiles.forEach(async (file) => {
    const dest = file.substring(templateDir.length, file.length - 3);
    const destPath = join(projectDir, dest);
    const contents = await fs.readFile(file, "utf8");
    const data = Mustache.render(contents, {
      name,
      type,
      version: packageJson.version,
    });
    await fs.writeFile(destPath, data);
  });
}