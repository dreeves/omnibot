var puppeteer = require("puppeteer");

var chai = require("chai");
chai.should();

describe("when the page loads", function () {
  let browser;
  let page;

  before(async function () {
    browser = await puppeteer.launch({
      args: ["--disable-gpu"],
    });
    page = (await browser.pages())[0];
    await page.goto("http://localhost:3000");
  });

  after(async function () {
    await browser.close();
  });

  it("focuses the name input", async function () {
    await page.waitForSelector("#name-input");
    const focusedId = await page.evaluate(() => document.activeElement.id);
    focusedId.should.equal("name-input");
  });

  context("when the user gives a username", function () {
    it("focuses the chat input", async function () {
      await page.type("#name-input", "testcase");
      await page.keyboard.press("Enter");
      await page.waitForSelector("#chat-input", { visible: true });
      const focusedId = await page.evaluate(() => document.activeElement.id);
      focusedId.should.equal("chat-input");
    });
  });
});
