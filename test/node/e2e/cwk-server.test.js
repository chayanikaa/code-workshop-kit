import { expect } from 'chai';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer';
import { startServer } from '../../../src/start-server.js';
import { aTimeout } from '../../utils/helpers.js';
import { userAgents } from '../../utils/user-agents.js';

const hostPort = 5000;
const host = `http://localhost:${hostPort}/`;
const testTimeout = 20000;
const baseCfg = {
  port: hostPort,
  logStartup: false,
  open: false,
};

describe('e2e: CWK App Shell', () => {
  context('', () => {
    let server;
    let wss;
    let watcher;
    let browser;

    beforeEach(async () => {});

    afterEach(async () => {
      // This may or may not alleviate premature close in CI?
      await aTimeout(100);
      if (browser) {
        await browser.close();
      }
      if (wss) {
        wss.close();
      }
      if (watcher) {
        watcher.close();
      }
      if (server) {
        await new Promise(resolve => {
          server.close(resolve);
        });
      }
    });

    // smoke test
    it('returns static files', async () => {
      ({ server, wss, watcher } = await startServer({
        ...baseCfg,
        dir: './test/utils/fixtures/simple',
      }));

      const response = await fetch(`${host}test/utils/fixtures/simple/index.html`, {
        headers: { 'user-agent': userAgents['Chrome 78'] },
      });
      const responseText = await response.text();

      expect(response.status).to.equal(200);
      expect(responseText).to.include('<title>My app</title>');
    }).timeout(testTimeout);

    it('inserts the app shell component by default', async () => {
      ({ server, wss, watcher } = await startServer({
        ...baseCfg,
        dir: './test/utils/fixtures/simple',
      }));

      browser = await puppeteer.launch();
      const page = await browser.newPage();

      await page.goto(`${host}test/utils/fixtures/simple/index.html`);

      await page.evaluate(() => {
        document.cookie = `participant_name=Joren;path=/`;
      });
      await page.reload();
      const { tagName } = await page.evaluate(() => {
        return {
          tagName: document.querySelector('cwk-app-shell').tagName,
        };
      });

      expect(tagName).to.equal('CWK-APP-SHELL');
    }).timeout(testTimeout);

    it('applies follow-mode websocket hooks by default', async () => {
      ({ server, wss, watcher } = await startServer({
        ...baseCfg,
        dir: './test/utils/fixtures/simple',
      }));

      browser = await puppeteer.launch();
      const page = await browser.newPage();

      await page.goto(`${host}test/utils/fixtures/simple/index.html`);
      await page.evaluate(() => {
        document.cookie = `participant_name=Joren;path=/`;
      });
      await page.reload();
      const { url } = await page.evaluate(() => {
        return {
          url: window.__cwkFollowModeWs.url,
        };
      });

      expect(url).to.equal('ws://localhost:5000/');
    }).timeout(testTimeout);

    it('can select admin user using password', async () => {
      ({ server, wss, watcher } = await startServer({
        ...baseCfg,
        dir: './test/utils/fixtures/admins',
      }));

      browser = await puppeteer.launch();
      const page = await browser.newPage();

      await page.goto(`${host}test/utils/fixtures/admins/index.html`);
      await page.evaluate(async () => {
        const cookieElem = document
          .querySelector('cwk-app-shell')
          .shadowRoot.querySelector('cwk-select-cookie');

        await cookieElem.fetchDialogComplete;
        cookieElem.shadowRoot.querySelector('.name__item').click();
      });

      await aTimeout(100);

      await page.evaluate(() => {
        const dialogContent = document.querySelector('cwk-dialog-content');
        dialogContent.shadowRoot.querySelector('input').value = 'pineapples';
        dialogContent.shadowRoot.querySelector('.confirm-btn').click();
      });

      await aTimeout(3000);

      const { tagName, adminSidebarTagName } = await page.evaluate(() => {
        return {
          tagName: document.querySelector('cwk-app-shell').tagName,
          adminSidebarTagName: document
            .querySelector('cwk-app-shell')
            .shadowRoot.querySelector('cwk-admin-sidebar').tagName,
        };
      });

      expect(tagName).to.equal('CWK-APP-SHELL');
      expect(adminSidebarTagName).to.equal('CWK-ADMIN-SIDEBAR');
    }).timeout(testTimeout);
  });
});