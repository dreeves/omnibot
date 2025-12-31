var puppeteer = require("puppeteer");

var chai = require("chai");
chai.should();

describe("when the user submits text in chat", function () {
  this.timeout(10000);
  let browser;
  let page;

  before(async function () {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--disable-gpu"],
    });
    page = (await browser.pages())[0];
    await page.goto("http://localhost:3000");
    await page.waitForSelector("#name-input");
    await page.waitForFunction(() => document.body.classList.contains("naming"));
    await page.type("#name-input", "testcase");
    await page.keyboard.press("Enter");
    await page.waitForSelector("#chat-input", { visible: true });
    await page.waitForFunction(() => document.body.classList.contains("chatting"));
  });

  after(async function () {
    await browser.close();
  });

  it("echos in the chat log", async function () {
    await page.type("#chat-input", "Hello, world!");
    await page.keyboard.press("Enter");

    await page.waitForFunction(
      () => document.querySelector("#chat-history")?.textContent?.includes("Hello, world!"),
      { timeout: 5000 },
    );

    const text = await page.evaluate(
      () => document.querySelector("#chat-history").textContent
    );
    text.should.include("Hello, world!");
  });
});
