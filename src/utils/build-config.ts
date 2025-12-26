/**
 * Build configuration utilities for mem-claude
 * Provides centralized configuration for build and deployment paths
 */

import os from 'os';
import path from 'path';
import { logger } from './logger.js';

/**
 * Build configuration object containing all path and version information
 */
export interface BuildConfig {
  version: string;
  author: string;
  pluginName: string;
  paths: {
    homeDir: string;
    claudeDir: string;
    pluginDir: string;
    cacheDir: string;
    currentPluginDir: string;
    currentCacheDir: string;
  };
  commands: {
    sync: string;
    install: string;
    restart: string;
  };
}

/**
 * Get the build configuration based on plugin.json
 */
export function getBuildConfig(): BuildConfig {
  const homeDir = os.homedir();
  const claudeDir = path.join(homeDir, '.claude');
  const pluginDir = path.join(claudeDir, 'plugins', 'marketplaces');
  const cacheDir = path.join(claudeDir, 'plugins', 'cache');
  
  // Read plugin.json to get author and version
  let pluginAuthor = 'chengjon'; // fallback to default
  let pluginVersion = '7.4.5'; // fallback to default
  
  try {
    const pluginJsonPath = path.join(process.cwd(), 'plugin', '.claude-plugin', 'plugin.json');
    const pluginJson = JSON.parse(require('fs').readFileSync(pluginJsonPath, 'utf-8'));
    pluginVersion = pluginJson.version || pluginVersion;
    
    // Handle different author formats
    if (typeof pluginJson.author === 'string') {
      pluginAuthor = pluginJson.author;
    } else if (pluginJson.author && typeof pluginJson.author === 'object' && pluginJson.author.name) {
      pluginAuthor = pluginJson.author.name;
    }
    
    // Clean author name (remove spaces, special chars for path safety)
    pluginAuthor = pluginAuthor.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  } catch (error) {
    logger.warn('SYSTEM', 'Could not read plugin.json, using defaults');
  }
  
  const currentPluginDir = path.join(pluginDir, pluginAuthor, 'mem-claude');
  const currentCacheDir = path.join(cacheDir, pluginAuthor, 'mem-claude', pluginVersion);
  
  return {
    version: pluginVersion,
    author: pluginAuthor,
    pluginName: 'mem-claude',
    paths: {
      homeDir,
      claudeDir,
      pluginDir,
      cacheDir,
      currentPluginDir,
      currentCacheDir
    },
    commands: {
      sync: `rsync -av --delete --exclude=.git --exclude=/.mcp.json ./ "${currentPluginDir}/"`,
      install: `cd "${currentPluginDir}" && npm install`,
      restart: `cd "${currentPluginDir}" && npm run worker:restart`
    }
  };
}

/**
 * Generate build-and-sync command with dynamic paths
 */
export function generateBuildSyncCommand(): string {
  const config = getBuildConfig();
  return [
    'npm run build',
    'npm run sync-marketplace',
    'sleep 1',
    `"${config.commands.restart}"`
  ].join(' && ');
}

/**
 * Get the sync command for marketplace
 */
export function getSyncCommand(): string {
  const config = getBuildConfig();
  return config.commands.sync;
}

/**
 * Get the install command for marketplace
 */
export function getInstallCommand(): string {
  const config = getBuildConfig();
  return config.commands.install;
}