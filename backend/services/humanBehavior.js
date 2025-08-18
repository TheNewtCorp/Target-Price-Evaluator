const logger = require('../utils/logger');

class HumanBehavior {
  constructor() {
    this.minDelay = parseInt(process.env.MIN_DELAY_MS) || 1000;
    this.maxDelay = parseInt(process.env.MAX_DELAY_MS) || 3000;
    this.typingDelayMin = parseInt(process.env.TYPING_DELAY_MIN) || 50;
    this.typingDelayMax = parseInt(process.env.TYPING_DELAY_MAX) || 150;
    this.mouseMoveDelayMin = parseInt(process.env.MOUSE_MOVE_DELAY_MIN) || 100;
    this.mouseMoveDelayMax = parseInt(process.env.MOUSE_MOVE_DELAY_MAX) || 300;
  }

  randomDelay(min = this.minDelay, max = this.maxDelay) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    logger.debug(`Random delay: ${delay}ms`);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  async humanType(page, selector, text, clearFirst = true) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.focus(selector);

      if (clearFirst) {
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await this.randomDelay(50, 150);
      }

      // Type each character with human-like delays
      for (let i = 0; i < text.length; i++) {
        await page.keyboard.type(text[i]);

        // Random delay between keystrokes
        const delay = Math.floor(Math.random() * (this.typingDelayMax - this.typingDelayMin + 1)) + this.typingDelayMin;
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Occasionally make longer pauses (simulating thinking)
        if (Math.random() < 0.1) {
          await this.randomDelay(200, 800);
        }
      }

      logger.debug(`Human typed: ${text} into ${selector}`);
    } catch (error) {
      logger.error(`Failed to type into ${selector}:`, error.message);
      throw error;
    }
  }

  async humanClick(page, selector) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });

      // Get element bounds for realistic click positioning
      const element = await page.$(selector);
      const box = await element.boundingBox();

      if (box) {
        // Click at a random position within the element bounds
        const x = box.x + Math.random() * box.width;
        const y = box.y + Math.random() * box.height;

        // Move mouse to position first
        await page.mouse.move(x, y);
        await this.randomDelay(this.mouseMoveDelayMin, this.mouseMoveDelayMax);

        // Click
        await page.mouse.click(x, y);

        logger.debug(`Human clicked at coordinates (${x.toFixed(2)}, ${y.toFixed(2)}) on ${selector}`);
      } else {
        // Fallback to regular click
        await page.click(selector);
        logger.debug(`Fallback click on ${selector}`);
      }
    } catch (error) {
      logger.error(`Failed to click ${selector}:`, error.message);
      throw error;
    }
  }

  async randomMouseMove(page) {
    try {
      const viewport = page.viewport();
      const x = Math.floor(Math.random() * viewport.width);
      const y = Math.floor(Math.random() * viewport.height);

      await page.mouse.move(x, y);
      await this.randomDelay(this.mouseMoveDelayMin, this.mouseMoveDelayMax);

      logger.debug(`Random mouse move to (${x}, ${y})`);
    } catch (error) {
      logger.debug('Random mouse move failed:', error.message);
    }
  }

  async scrollRandomly(page) {
    try {
      const scrollDistance = Math.floor(Math.random() * 500) + 100;
      const direction = Math.random() > 0.5 ? 1 : -1;

      await page.evaluate(
        (distance, dir) => {
          window.scrollBy(0, distance * dir);
        },
        scrollDistance,
        direction,
      );

      await this.randomDelay(200, 800);

      logger.debug(`Random scroll: ${scrollDistance * direction}px`);
    } catch (error) {
      logger.debug('Random scroll failed:', error.message);
    }
  }

  async simulateReading(page, minTime = 1000, maxTime = 3000) {
    const readingTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;

    // Simulate reading by making small mouse movements
    const movements = Math.floor(readingTime / 500);

    for (let i = 0; i < movements; i++) {
      await this.randomMouseMove(page);
      await this.randomDelay(300, 700);
    }

    logger.debug(`Simulated reading for ${readingTime}ms`);
  }

  async waitForElementAndScroll(page, selector, timeout = 10000) {
    try {
      await page.waitForSelector(selector, { timeout });

      // Scroll element into view
      await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, selector);

      await this.randomDelay(500, 1500);

      logger.debug(`Scrolled ${selector} into view`);
    } catch (error) {
      logger.error(`Failed to wait for and scroll to ${selector}:`, error.message);
      throw error;
    }
  }

  async simulateHumanNavigation(page, url) {
    try {
      // Navigate with realistic options
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Wait for page to settle
      await this.randomDelay(1000, 3000);

      // Simulate brief page scanning
      await this.simulateReading(page, 1000, 2500);

      logger.debug(`Human navigation to ${url} completed`);
    } catch (error) {
      logger.error(`Human navigation to ${url} failed:`, error.message);
      throw error;
    }
  }

  // Add realistic delays based on action type
  getActionDelay(action) {
    const delays = {
      search: [1500, 3000],
      click: [500, 1500],
      type: [100, 300],
      navigate: [2000, 4000],
      wait: [1000, 2500],
    };

    const [min, max] = delays[action] || [1000, 2000];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async performActionWithDelay(action, callback) {
    const delay = this.getActionDelay(action);
    logger.debug(`Performing ${action} with ${delay}ms delay`);

    await new Promise((resolve) => setTimeout(resolve, delay));
    return await callback();
  }
}

module.exports = new HumanBehavior();
