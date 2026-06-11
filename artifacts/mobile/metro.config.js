const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Block .local directory so Metro doesn't watch stale/temp skill directories
const localDir = path.resolve(workspaceRoot, ".local");
const escapedLocalDir = localDir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
config.resolver.blockList = [
  new RegExp(`^${escapedLocalDir}[/\\\\].*$`),
];

// Disable browser caching so the preview always loads the latest bundle
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
