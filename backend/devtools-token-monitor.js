// ==================================================
// CHRONO24 CHALLENGE TOKEN MONITOR
// ==================================================
// Paste this script into Chrome DevTools Console
// It will monitor ALL ways the challengeToken could change

console.log('🔍 Starting Chrono24 challengeToken monitoring...');

// Create monitor object
window.chrono24Monitor = {
  log: [],
  originalFetch: window.fetch,
  originalXHR: window.XMLHttpRequest,

  addLog: function (message) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logEntry = `[${timestamp}] ${message}`;
    this.log.push(logEntry);
    console.log(`%c🔍 ${logEntry}`, 'color: #00ff00; font-weight: bold;');
  },

  init: function () {
    this.setupTokenMonitoring();
    this.setupNetworkMonitoring();
    this.setupFormMonitoring();
    this.addLog('Monitor initialized');
  },

  setupTokenMonitoring: function () {
    const tokenField = document.querySelector('input[name="challengeToken"]');
    if (tokenField) {
      this.addLog(
        `Found challengeToken field, initial value: "${tokenField.value}" (${tokenField.value.length} chars)`,
      );

      // Method 1: Attribute observer
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
            this.addLog(`🎯 ATTRIBUTE CHANGED: challengeToken = ${tokenField.value.length} characters`);
            this.addLog(`🎯 New token value: ${tokenField.value.substring(0, 100)}...`);
          }
        });
      });
      observer.observe(tokenField, { attributes: true, attributeFilter: ['value'] });

      // Method 2: Property interceptor
      const originalValue = tokenField.value;
      let currentValue = originalValue;

      Object.defineProperty(tokenField, 'value', {
        get: function () {
          return this._interceptedValue !== undefined ? this._interceptedValue : currentValue;
        },
        set: function (val) {
          window.chrono24Monitor.addLog(`🎯 PROPERTY SET: challengeToken = "${val}" (${val ? val.length : 0} chars)`);
          this._interceptedValue = val;
          currentValue = val;
          this.setAttribute('value', val);
        },
      });

      // Method 3: Periodic checking
      this.tokenCheckInterval = setInterval(() => {
        const currentAttr = tokenField.getAttribute('value') || '';
        const currentProp = tokenField._interceptedValue || currentValue || '';

        if (currentAttr.length > 0 || currentProp.length > 0) {
          this.addLog(`📊 Token status - Attr: ${currentAttr.length} chars, Prop: ${currentProp.length} chars`);

          if (currentAttr.length > 100 || currentProp.length > 100) {
            this.addLog(`🎉 TOKEN POPULATED! Length: ${Math.max(currentAttr.length, currentProp.length)} characters`);
            this.addLog(`🎉 Token preview: ${(currentAttr || currentProp).substring(0, 200)}...`);
          }
        }
      }, 1000);

      window.challengeTokenElement = tokenField;
    } else {
      this.addLog('❌ challengeToken field NOT FOUND');
    }
  },

  setupNetworkMonitoring: function () {
    // Override fetch
    window.fetch = (...args) => {
      this.addLog(`📡 FETCH: ${args[0]}`);

      return this.originalFetch.apply(window, args).then((response) => {
        this.addLog(`📥 FETCH RESPONSE: ${response.status} ${response.url}`);

        // Try to read response for challengeToken
        const responseClone = response.clone();
        responseClone
          .text()
          .then((text) => {
            if (text && text.includes('challengeToken')) {
              this.addLog(`🎯 RESPONSE CONTAINS challengeToken: ${text.substring(0, 300)}...`);
            }
          })
          .catch(() => {});

        return response;
      });
    };

    // Override XMLHttpRequest
    window.XMLHttpRequest = function () {
      const xhr = new window.chrono24Monitor.originalXHR();
      const originalSend = xhr.send;
      const originalOpen = xhr.open;

      xhr.open = function (method, url) {
        window.chrono24Monitor.addLog(`📡 XHR OPEN: ${method} ${url}`);
        return originalOpen.apply(this, arguments);
      };

      xhr.send = function (data) {
        window.chrono24Monitor.addLog(`📡 XHR SEND: ${data ? data.toString().substring(0, 200) + '...' : 'null'}`);

        // Monitor response
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            window.chrono24Monitor.addLog(`📥 XHR RESPONSE: ${xhr.status} ${xhr.responseURL || 'unknown'}`);
            if (xhr.responseText && xhr.responseText.includes('challengeToken')) {
              window.chrono24Monitor.addLog(
                `🎯 XHR RESPONSE CONTAINS challengeToken: ${xhr.responseText.substring(0, 300)}...`,
              );
            }
          }
        };

        return originalSend.apply(this, arguments);
      };

      return xhr;
    };
  },

  setupFormMonitoring: function () {
    // Monitor all form submissions
    document.addEventListener('submit', (event) => {
      this.addLog(`📤 FORM SUBMIT: ${event.target.action || 'no action'}`);

      const formData = new FormData(event.target);
      for (let [key, value] of formData.entries()) {
        if (key === 'challengeToken') {
          this.addLog(`🎯 FORM CONTAINS challengeToken: "${value}" (${value.length} chars)`);
        }
      }
    });

    // Monitor button clicks
    document.addEventListener('click', (event) => {
      if (event.target.tagName === 'BUTTON' || event.target.type === 'submit') {
        this.addLog(`🔘 BUTTON CLICKED: ${event.target.textContent || event.target.value || 'unnamed'}`);
      }
    });
  },

  getStatus: function () {
    const tokenField = document.querySelector('input[name="challengeToken"]');
    return {
      tokenExists: !!tokenField,
      tokenValue: tokenField ? tokenField.value : 'NOT FOUND',
      tokenLength: tokenField ? tokenField.value.length : 0,
      tokenAttribute: tokenField ? tokenField.getAttribute('value') : 'NOT FOUND',
      logs: this.log.slice(-20), // Last 20 entries
    };
  },

  stop: function () {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
    }
    window.fetch = this.originalFetch;
    window.XMLHttpRequest = this.originalXHR;
    this.addLog('Monitor stopped');
  },
};

// Initialize monitoring
window.chrono24Monitor.init();

// Helper functions for console
window.getTokenStatus = () => window.chrono24Monitor.getStatus();
window.showLogs = () => console.table(window.chrono24Monitor.log.slice(-20));
window.stopMonitor = () => window.chrono24Monitor.stop();

console.log('%c✅ Chrono24 Token Monitor Active!', 'color: #00ff00; font-size: 16px; font-weight: bold;');
console.log('%cUse these commands:', 'color: #ffff00; font-weight: bold;');
console.log('  getTokenStatus() - Check current token status');
console.log('  showLogs() - Display recent monitoring logs');
console.log('  stopMonitor() - Stop monitoring');
console.log('%cNow interact with the page (click OK on popup, etc.)', 'color: #00ffff; font-weight: bold;');
