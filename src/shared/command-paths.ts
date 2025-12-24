/**
 * Shared command path resolution
 * Provides absolute paths to commands that may not be in PATH
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Find absolute path to a command in PATH
 * Falls back to common locations if command not in PATH
 */
export function findCommandPath(command: string): string {
  // Try which/where first
  try {
    const cmdPath = execSync(`which ${command}`, { encoding: 'utf-8' }).trim();
    if (cmdPath) return cmdPath;
  } catch {}

  // Fallback to common locations for node
  if (command === 'node') {
    const commonPaths = [
      '/root/.nvm/versions/node/v24.12.0/bin/node',
      '/usr/local/bin/node',
      '/usr/bin/node',
      process.env.NODE_PATH && path.join(process.env.NODE_PATH, 'node')
    ].filter(Boolean);
    for (const p of commonPaths) {
      if (fs.existsSync(p)) return p;
    }
  }

  // Fallback to common locations for uvx
  if (command === 'uvx') {
    const commonPaths = [
      '/root/.local/bin/uvx',
      '/usr/local/bin/uvx',
      '/usr/bin/uvx'
    ];
    for (const p of commonPaths) {
      if (fs.existsSync(p)) return p;
    }
  }

  // Return command as-is if not found (will fail later with clear error)
  return command;
}

// Cache command paths for performance
export const NODE_PATH = findCommandPath('node');
export const UVX_PATH = findCommandPath('uvx');
