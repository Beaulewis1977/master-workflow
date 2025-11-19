/**
 * Universal Path Handling System for Claude Flow 2.0
 * Handles Windows backslashes vs Unix forward slashes
 * Provides consistent path operations across all platforms
 */

const path = require('path');
const os = require('os');
const fs = require('fs').promises;

/**
 * Universal Path Handler
 * Provides platform-agnostic path operations with automatic normalization
 */
class PathHandler {
  constructor(platform = process.platform) {
    this.platform = platform;
    this.isWindows = platform === 'win32';
    this.separator = this.isWindows ? '\\' : '/';
    this.delimiter = this.isWindows ? ';' : ':';
  }

  /**
   * Normalize path for the current platform
   * @param {string} inputPath - Path to normalize
   * @returns {string} Normalized path
   */
  normalize(inputPath) {
    if (!inputPath) return '';
    
    // Convert all separators to current platform
    let normalizedPath = inputPath.replace(/[/\\]/g, path.sep);
    
    // Use Node.js path.normalize to handle . and .. segments
    normalizedPath = path.normalize(normalizedPath);
    
    // Handle Windows drive letters
    if (this.isWindows && this.isUnixPath(inputPath)) {
      normalizedPath = this.convertUnixToWindows(normalizedPath);
    }
    
    return normalizedPath;
  }

  /**
   * Convert to Unix-style path (forward slashes)
   * @param {string} inputPath - Path to convert
   * @returns {string} Unix-style path
   */
  toUnix(inputPath) {
    if (!inputPath) return '';
    
    let unixPath = inputPath.replace(/\\/g, '/');
    
    // Handle Windows drive letters (C: -> /c)
    if (this.isWindows && /^[A-Za-z]:/.test(unixPath)) {
      unixPath = '/' + unixPath.charAt(0).toLowerCase() + unixPath.slice(2);
    }
    
    return unixPath;
  }

  /**
   * Convert to Windows-style path (backslashes)
   * @param {string} inputPath - Path to convert
   * @returns {string} Windows-style path
   */
  toWindows(inputPath) {
    if (!inputPath) return '';
    
    let windowsPath = inputPath.replace(/\//g, '\\');
    
    // Handle Unix-style root paths (/c -> C:)
    if (/^\\[a-z]\\/.test(windowsPath)) {
      windowsPath = windowsPath.charAt(1).toUpperCase() + ':' + windowsPath.slice(2);
    } else if (/^\\[a-z]$/.test(windowsPath)) {
      windowsPath = windowsPath.charAt(1).toUpperCase() + ':';
    }
    
    return windowsPath;
  }

  /**
   * Join path components using the appropriate separator
   * @param {...string} components - Path components to join
   * @returns {string} Joined path
   */
  join(...components) {
    if (components.length === 0) return '';
    
    // Filter out empty components and normalize each
    const cleanComponents = components
      .filter(component => component && typeof component === 'string')
      .map(component => this.normalize(component));
    
    return path.join(...cleanComponents);
  }

  /**
   * Resolve absolute path from relative components
   * @param {...string} components - Path components to resolve
   * @returns {string} Absolute path
   */
  resolve(...components) {
    return path.resolve(...components);
  }

  /**
   * Get relative path from one path to another
   * @param {string} from - Starting path
   * @param {string} to - Destination path
   * @returns {string} Relative path
   */
  relative(from, to) {
    return path.relative(this.normalize(from), this.normalize(to));
  }

  /**
   * Get directory name of path
   * @param {string} inputPath - Input path
   * @returns {string} Directory name
   */
  dirname(inputPath) {
    return path.dirname(this.normalize(inputPath));
  }

  /**
   * Get base name of path (filename with extension)
   * @param {string} inputPath - Input path
   * @param {string} ext - Extension to remove
   * @returns {string} Base name
   */
  basename(inputPath, ext) {
    return path.basename(this.normalize(inputPath), ext);
  }

  /**
   * Get file extension
   * @param {string} inputPath - Input path
   * @returns {string} File extension
   */
  extname(inputPath) {
    return path.extname(this.normalize(inputPath));
  }

  /**
   * Parse path into components
   * @param {string} inputPath - Input path
   * @returns {object} Path components
   */
  parse(inputPath) {
    const parsed = path.parse(this.normalize(inputPath));
    return {
      ...parsed,
      isAbsolute: path.isAbsolute(this.normalize(inputPath)),
      separator: this.separator,
      platform: this.platform
    };
  }

  /**
   * Format path from components
   * @param {object} pathObject - Path components
   * @returns {string} Formatted path
   */
  format(pathObject) {
    return path.format(pathObject);
  }

  /**
   * Check if path is absolute
   * @param {string} inputPath - Path to check
   * @returns {boolean} True if absolute
   */
  isAbsolute(inputPath) {
    return path.isAbsolute(this.normalize(inputPath));
  }

  /**
   * Check if path exists
   * @param {string} inputPath - Path to check
   * @returns {Promise<boolean>} True if exists
   */
  async exists(inputPath) {
    try {
      await fs.access(this.normalize(inputPath));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get path statistics
   * @param {string} inputPath - Path to stat
   * @returns {Promise<object>} File statistics
   */
  async stat(inputPath) {
    return await fs.stat(this.normalize(inputPath));
  }

  /**
   * Check if path is a directory
   * @param {string} inputPath - Path to check
   * @returns {Promise<boolean>} True if directory
   */
  async isDirectory(inputPath) {
    try {
      const stats = await this.stat(inputPath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if path is a file
   * @param {string} inputPath - Path to check
   * @returns {Promise<boolean>} True if file
   */
  async isFile(inputPath) {
    try {
      const stats = await this.stat(inputPath);
      return stats.isFile();
    } catch (error) {
      return false;
    }
  }

  /**
   * Create directory recursively
   * @param {string} inputPath - Directory path to create
   * @param {object} options - Options for mkdir
   * @returns {Promise<void>}
   */
  async mkdir(inputPath, options = { recursive: true }) {
    return await fs.mkdir(this.normalize(inputPath), options);
  }

  /**
   * Read directory contents
   * @param {string} inputPath - Directory path
   * @param {object} options - Options for readdir
   * @returns {Promise<string[]>} Directory contents
   */
  async readdir(inputPath, options = {}) {
    const contents = await fs.readdir(this.normalize(inputPath), options);
    
    // Normalize all returned paths
    if (options.withFileTypes) {
      return contents.map(dirent => ({
        ...dirent,
        name: this.normalize(dirent.name)
      }));
    } else {
      return contents.map(item => this.normalize(item));
    }
  }

  /**
   * Remove file or directory
   * @param {string} inputPath - Path to remove
   * @param {object} options - Options for removal
   * @returns {Promise<void>}
   */
  async remove(inputPath, options = { recursive: true, force: true }) {
    const normalizedPath = this.normalize(inputPath);
    
    if (await this.isDirectory(normalizedPath)) {
      return await fs.rmdir(normalizedPath, options);
    } else {
      return await fs.unlink(normalizedPath);
    }
  }

  /**
   * Copy file or directory
   * @param {string} source - Source path
   * @param {string} destination - Destination path
   * @param {object} options - Copy options
   * @returns {Promise<void>}
   */
  async copy(source, destination, options = {}) {
    const srcPath = this.normalize(source);
    const destPath = this.normalize(destination);
    
    if (await this.isDirectory(srcPath)) {
      return await this.copyDirectory(srcPath, destPath, options);
    } else {
      return await fs.copyFile(srcPath, destPath);
    }
  }

  /**
   * Move/rename file or directory
   * @param {string} source - Source path
   * @param {string} destination - Destination path
   * @returns {Promise<void>}
   */
  async move(source, destination) {
    return await fs.rename(this.normalize(source), this.normalize(destination));
  }

  /**
   * Get home directory
   * @returns {string} Home directory path
   */
  homedir() {
    return this.normalize(os.homedir());
  }

  /**
   * Get temporary directory
   * @returns {string} Temporary directory path
   */
  tmpdir() {
    return this.normalize(os.tmpdir());
  }

  /**
   * Get current working directory
   * @returns {string} Current working directory
   */
  cwd() {
    return this.normalize(process.cwd());
  }

  /**
   * Expand tilde (~) to home directory
   * @param {string} inputPath - Path with potential tilde
   * @returns {string} Expanded path
   */
  expandTilde(inputPath) {
    if (!inputPath || typeof inputPath !== 'string') return inputPath;
    
    if (inputPath === '~') {
      return this.homedir();
    }
    
    if (inputPath.startsWith('~/') || inputPath.startsWith('~\\')) {
      return this.join(this.homedir(), inputPath.slice(2));
    }
    
    return inputPath;
  }

  /**
   * Convert environment variables in path
   * @param {string} inputPath - Path with environment variables
   * @returns {string} Path with variables expanded
   */
  expandVars(inputPath) {
    if (!inputPath || typeof inputPath !== 'string') return inputPath;
    
    // Windows style %VAR%
    if (this.isWindows) {
      return inputPath.replace(/%([^%]+)%/g, (match, varName) => {
        return process.env[varName] || match;
      });
    } else {
      // Unix style $VAR or ${VAR}
      return inputPath.replace(/\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (match, braced, simple) => {
        const varName = braced || simple;
        return process.env[varName] || match;
      });
    }
  }

  /**
   * Get safe filename by removing invalid characters
   * @param {string} filename - Filename to sanitize
   * @returns {string} Safe filename
   */
  getSafeFilename(filename) {
    if (!filename) return '';
    
    // Characters invalid on Windows (also good to avoid on Unix)
    const invalidChars = /[<>:"|?*\x00-\x1f]/g;
    
    // Replace invalid characters with underscore
    let safeFilename = filename.replace(invalidChars, '_');
    
    // Handle reserved names on Windows
    if (this.isWindows) {
      const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
      if (reserved.test(safeFilename)) {
        safeFilename = '_' + safeFilename;
      }
    }
    
    // Trim spaces and dots from ends (Windows requirement)
    safeFilename = safeFilename.replace(/^[\s.]+|[\s.]+$/g, '');
    
    // Ensure it's not empty
    if (!safeFilename) {
      safeFilename = 'unnamed';
    }
    
    return safeFilename;
  }

  /**
   * Get path relative to a base directory
   * @param {string} fullPath - Full path
   * @param {string} basePath - Base path
   * @returns {string} Path relative to base
   */
  getRelativeToBase(fullPath, basePath) {
    const normalizedFull = this.normalize(fullPath);
    const normalizedBase = this.normalize(basePath);
    
    if (normalizedFull.startsWith(normalizedBase)) {
      const relative = normalizedFull.slice(normalizedBase.length);
      return relative.startsWith(this.separator) ? relative.slice(1) : relative;
    }
    
    return this.relative(normalizedBase, normalizedFull);
  }

  /**
   * Find common path prefix
   * @param {string[]} paths - Array of paths
   * @returns {string} Common prefix path
   */
  getCommonPrefix(paths) {
    if (!paths || paths.length === 0) return '';
    if (paths.length === 1) return this.dirname(paths[0]);
    
    const normalizedPaths = paths.map(p => this.normalize(p));
    const splitPaths = normalizedPaths.map(p => p.split(this.separator));
    
    let commonPrefix = [];
    const minLength = Math.min(...splitPaths.map(p => p.length));
    
    for (let i = 0; i < minLength; i++) {
      const currentSegment = splitPaths[0][i];
      if (splitPaths.every(p => p[i] === currentSegment)) {
        commonPrefix.push(currentSegment);
      } else {
        break;
      }
    }
    
    return commonPrefix.join(this.separator);
  }

  // Helper methods

  /**
   * Check if path uses Unix-style separators
   * @private
   * @param {string} inputPath - Path to check
   * @returns {boolean} True if Unix-style
   */
  isUnixPath(inputPath) {
    return inputPath.includes('/') && !inputPath.includes('\\');
  }

  /**
   * Convert Unix path to Windows path
   * @private
   * @param {string} unixPath - Unix path
   * @returns {string} Windows path
   */
  convertUnixToWindows(unixPath) {
    // Handle WSL-style paths (/mnt/c -> C:)
    if (unixPath.startsWith('/mnt/')) {
      const driveLetter = unixPath.charAt(5);
      return driveLetter.toUpperCase() + ':' + unixPath.slice(6).replace(/\//g, '\\');
    }
    
    return unixPath.replace(/\//g, '\\');
  }

  /**
   * Copy directory recursively
   * @private
   * @param {string} source - Source directory
   * @param {string} destination - Destination directory
   * @param {object} options - Copy options
   * @returns {Promise<void>}
   */
  async copyDirectory(source, destination, options = {}) {
    await this.mkdir(destination);
    
    const items = await this.readdir(source, { withFileTypes: true });
    
    for (const item of items) {
      const sourcePath = this.join(source, item.name);
      const destPath = this.join(destination, item.name);
      
      if (item.isDirectory()) {
        await this.copyDirectory(sourcePath, destPath, options);
      } else {
        await fs.copyFile(sourcePath, destPath);
      }
    }
  }

  /**
   * Get platform-specific configuration paths
   * @returns {object} Configuration paths
   */
  getConfigPaths() {
    const homeDir = this.homedir();
    
    if (this.isWindows) {
      return {
        config: this.join(process.env.APPDATA, 'claude-flow'),
        data: this.join(process.env.LOCALAPPDATA, 'claude-flow'),
        cache: this.join(process.env.TEMP, 'claude-flow'),
        logs: this.join(process.env.LOCALAPPDATA, 'claude-flow', 'logs')
      };
    } else if (this.platform === 'darwin') {
      return {
        config: this.join(homeDir, 'Library', 'Application Support', 'claude-flow'),
        data: this.join(homeDir, 'Library', 'Application Support', 'claude-flow'),
        cache: this.join(homeDir, 'Library', 'Caches', 'claude-flow'),
        logs: this.join(homeDir, 'Library', 'Logs', 'claude-flow')
      };
    } else {
      return {
        config: this.join(homeDir, '.config', 'claude-flow'),
        data: this.join(homeDir, '.local', 'share', 'claude-flow'),
        cache: this.join(homeDir, '.cache', 'claude-flow'),
        logs: this.join(homeDir, '.local', 'share', 'claude-flow', 'logs')
      };
    }
  }
}

// Create default instance
const pathHandler = new PathHandler();

module.exports = {
  PathHandler,
  default: pathHandler,
  
  // Convenience methods using default instance
  normalize: (path) => pathHandler.normalize(path),
  join: (...components) => pathHandler.join(...components),
  resolve: (...components) => pathHandler.resolve(...components),
  relative: (from, to) => pathHandler.relative(from, to),
  dirname: (path) => pathHandler.dirname(path),
  basename: (path, ext) => pathHandler.basename(path, ext),
  extname: (path) => pathHandler.extname(path),
  parse: (path) => pathHandler.parse(path),
  format: (pathObject) => pathHandler.format(pathObject),
  isAbsolute: (path) => pathHandler.isAbsolute(path),
  toUnix: (path) => pathHandler.toUnix(path),
  toWindows: (path) => pathHandler.toWindows(path),
  expandTilde: (path) => pathHandler.expandTilde(path),
  expandVars: (path) => pathHandler.expandVars(path),
  getSafeFilename: (filename) => pathHandler.getSafeFilename(filename),
  getConfigPaths: () => pathHandler.getConfigPaths()
};