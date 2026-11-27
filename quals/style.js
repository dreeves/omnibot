const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const puppeteer = require("puppeteer");
const { Remarkable } = require("remarkable");

const chai = require("chai");
chai.should();

const STYLESHEET = path.join(__dirname, "../public/style.css");

// Chat markup like public/chat.js builds, with one bot message
const chatPage = (messageBody) => `
  <body class="chatting">
    <div id="chat-interface">
      <ul id="chat-history">
        <li class="msg msg--bot"><div class="msg__body">${messageBody}</div></li>
      </ul>
    </div>
  </body>`;

// Parse "rgb(r, g, b)" or "rgba(r, g, b, a)"
const parseColor = (s) => {
  const [r, g, b, a = 1] = s.match(/[\d.]+/g).map(Number);
  return { r, g, b, a };
};

// WCAG relative luminance of an opaque color
const luminance = ({ r, g, b }) => {
  const [R, G, B] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

// WCAG contrast ratio between two opaque colors
const contrast = (x, y) => {
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
};

describe("the web chat's stylesheet", function () {
  this.timeout(10000);
  let browser;

  before(async function () {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--disable-gpu"],
    });
  });

  // Puppeteer 24's browser.close() waits for Chrome to exit, which can take
  // well over 10 s on a loaded machine, so give just the cleanup more time.
  after(async function () {
    this.timeout(60000);
    await browser.close();
  });

  // A page showing a bot message with the given body, styled by style.css
  async function chatWith(messageBody) {
    const page = await browser.newPage();
    await page.setContent(chatPage(messageBody));
    await page.addStyleTag({ path: STYLESHEET });
    return page;
  }

  // Computed text colors of the given selectors
  const colorsOf = (page, selectors) => page.evaluate((sels) =>
    sels.map((sel) => getComputedStyle(document.querySelector(sel)).color),
  selectors);

  // The opaque color a bot message is drawn on: its bubble over the page
  const bubbleBackground = async (page) => {
    const [bubble, pageBg] = (await page.evaluate(() => [
      getComputedStyle(document.querySelector("li.msg")).backgroundColor,
      getComputedStyle(document.body).backgroundColor,
    ])).map(parseColor);
    const mix = (k) => bubble.a * bubble[k] + (1 - bubble.a) * pageBg[k];
    return { r: mix("r"), g: mix("g"), b: mix("b") };
  };

  // Replicata: In the web chat, send a message with a markdown heading, "## Hi".
  // Expectata: The heading is the same color as the rest of the message.
  // Resultata: Glitch's leftover "Subheading" rule makes it #2800ff, dark blue
  // on the black page.
  it("colors markdown headings like the rest of a message", async function () {
    const page = await chatWith("<h2>Heading</h2><p>Paragraph</p>");
    const [heading, paragraph] = await colorsOf(page, ["h2", "p"]);
    await page.close();
    heading.should.equal(paragraph);
  });

  it("colors headings rendered from chat markdown like the rest of the message", async function () {
    const md = new Remarkable({ html: false, breaks: true }); // as public/chat.js
    const page = await chatWith(md.render("## Heading\n\nParagraph"));
    const [heading, paragraph] = await colorsOf(page, ["h2", "p"]);
    await page.close();
    heading.should.equal(paragraph);
  });

  it("makes markdown headings readable (WCAG AA contrast, 4.5:1)", async function () {
    const page = await chatWith("<h2>Heading</h2><p>Paragraph</p>");
    const [heading] = await colorsOf(page, ["h2"]);
    const background = await bubbleBackground(page);
    await page.close();
    contrast(parseColor(heading), background).should.be.at.least(4.5);
  });

  it("still colors every other heading level like the rest of a message", async function () {
    const page = await chatWith(
      "<h1>1</h1><h3>3</h3><h4>4</h4><h5>5</h5><h6>6</h6><p>Paragraph</p>");
    const colors = await colorsOf(page, ["h1", "h3", "h4", "h5", "h6", "p"]);
    await page.close();
    colors.slice(0, 5).should.deep.equal(Array(5).fill(colors[5]));
  });

  // Replicata: In the web chat, click a link someone posted, then come back.
  // Expectata: The link is still visible.
  // Resultata: Glitch's leftover footer rule colors every visited link #000,
  // black on the black page.
  it("styles visited links only inside the footer", async function () {
    const page = await chatWith('<p><a href="/elsewhere">a link</a></p>');
    const selectors = await page.evaluate(() =>
      [...document.styleSheets]
        .flatMap((sheet) => [...sheet.cssRules])
        .flatMap((rule) => (rule.selectorText ?? "").split(","))
        .map((sel) => sel.trim())
        .filter((sel) => sel.includes(":visited") && !sel.startsWith(".footer ")),
    );
    await page.close();
    selectors.should.deep.equal([]);
  });

  it("still makes unvisited chat links readable", async function () {
    const page = await chatWith('<p><a href="/never-visited">a link</a></p>');
    const [link] = await colorsOf(page, ["a"]);
    const background = await bubbleBackground(page);
    await page.close();
    contrast(parseColor(link), background).should.be.at.least(3);
  });

  // Browsers hide :visited styles from scripts, so this one looks at pixels.
  // It serves a chat page, follows a link in it, comes back, waits until a
  // probe link (styled by a test-only rule) shows its :visited color, and
  // then checks that the chat link's pixels aren't all near black.
  it("draws visited chat links visibly", async function () {
    const css = fs.readFileSync(STYLESHEET, "utf8");
    const server = http.createServer((req, res) => {
      if (req.url === "/style.css") {
        res.writeHead(200, { "content-type": "text/css" });
        return res.end(css);
      }
      res.writeHead(200, { "content-type": "text/html" });
      if (req.url === "/elsewhere") return res.end("<p>elsewhere</p>");
      return res.end(`<!doctype html>
        <link rel="stylesheet" href="/style.css">
        <style>#probe:visited { color: rgb(255, 0, 0) }</style>
        ${chatPage(`<p><a id="link" href="/elsewhere">a link someone posted</a></p>
                    <p><a id="probe" href="/elsewhere">probe</a></p>`)}`);
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const page = await browser.newPage();

    // RGBA bytes of a screenshot of the element matching selector
    const pixels = async (selector) => {
      const png = await (await page.$(selector)).screenshot({ encoding: "base64" });
      return page.evaluate(async (src) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return [...ctx.getImageData(0, 0, img.width, img.height).data];
      }, `data:image/png;base64,${png}`);
    };
    // The largest value of f(r, g, b) over the element's pixels
    const maxOver = async (selector, f) => {
      const px = await pixels(selector);
      let max = -Infinity;
      for (let i = 0; i < px.length; i += 4) {
        max = Math.max(max, f(px[i], px[i + 1], px[i + 2]));
      }
      return max;
    };

    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await Promise.all([page.waitForNavigation(), page.click("#link")]);
      await page.goBack();
      const redness = (r, g, b) => r - Math.max(g, b);
      for (let tries = 0; await maxOver("#probe", redness) < 150; tries++) {
        if (tries > 40) throw new Error("the probe link never rendered as :visited");
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const brightness = await maxOver("#link", (r, g, b) => Math.max(r, g, b));
      brightness.should.be.above(64);
    } finally {
      await page.close();
      server.closeAllConnections(); // Chrome's keep-alive connections
      server.close();
    }
  });
});
