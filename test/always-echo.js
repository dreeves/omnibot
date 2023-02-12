describe("Don't silently eat messages in the web client", function () {
  before(function (browser) {
    browser
      .navigateTo("http://localhost:3000")
      .waitForElementVisible("input#name-input")
      .sendKeys("input#name-input", ["nightwatch", browser.Keys.ENTER]);
  });

  it("Even if they have spaces or punctuation", function (browser) {
    browser
      .sendKeys("input#chat-input", ["Hello, world!", browser.Keys.ENTER])
      .assert.textContains("#chat-history", "nightwatch: Hello, world!");
  });
});
