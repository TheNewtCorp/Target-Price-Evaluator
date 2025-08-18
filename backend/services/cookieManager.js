const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class CookieManager {
  constructor() {
    this.cookiePath = path.join(__dirname, '..', 'data', 'cookies.json');
    this.maxAge = parseInt(process.env.COOKIE_MAX_AGE) || 7776000000; // 90 days in ms
  }

  async ensureDataDirectory() {
    const dataDir = path.dirname(this.cookiePath);
    await fs.ensureDir(dataDir);
  }

  async saveCookies(page) {
    try {
      await this.ensureDataDirectory();

      const cookies = await page.cookies();
      const cookieData = {
        cookies: cookies,
        timestamp: Date.now(),
        domain: 'chrono24.com',
      };

      await fs.writeJson(this.cookiePath, cookieData, { spaces: 2 });
      logger.info(`Saved ${cookies.length} cookies to ${this.cookiePath}`);
    } catch (error) {
      logger.error('Failed to save cookies:', error.message);
    }
  }

  async loadCookies(page) {
    try {
      if (!(await fs.pathExists(this.cookiePath))) {
        logger.info('No saved cookies found');
        return false;
      }

      const cookieData = await fs.readJson(this.cookiePath);

      // Check if cookies are expired
      const cookieAge = Date.now() - cookieData.timestamp;
      if (cookieAge > this.maxAge) {
        logger.info('Saved cookies are expired, removing them');
        await this.clearCookies();
        return false;
      }

      // Set cookies in the page
      if (cookieData.cookies && cookieData.cookies.length > 0) {
        await page.setCookie(...cookieData.cookies);
        logger.info(`Loaded ${cookieData.cookies.length} cookies from storage`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to load cookies:', error.message);
      return false;
    }
  }

  async clearCookies() {
    try {
      if (await fs.pathExists(this.cookiePath)) {
        await fs.remove(this.cookiePath);
        logger.info('Cleared saved cookies');
      }
    } catch (error) {
      logger.error('Failed to clear cookies:', error.message);
    }
  }

  async isLoggedIn(page) {
    try {
      // Check for login-specific cookies or elements that indicate logged-in state
      const cookies = await page.cookies();

      // Look for session cookies that typically indicate login
      const sessionCookies = cookies.filter(
        (cookie) =>
          cookie.name.toLowerCase().includes('session') ||
          cookie.name.toLowerCase().includes('auth') ||
          cookie.name.toLowerCase().includes('login') ||
          cookie.name.toLowerCase().includes('user'),
      );

      return sessionCookies.length > 0;
    } catch (error) {
      logger.error('Failed to check login status from cookies:', error.message);
      return false;
    }
  }
}

module.exports = new CookieManager();
