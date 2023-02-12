describe("Put the cursor in the text box on page load for the web interface", function () {
  before(function (browser) {
    browser
      .navigateTo("http://localhost:3000")
      .waitForElementVisible("input#name-input")
      .sendKeys("input#name-input", ["nightwatch", browser.Keys.ENTER]);
  });

  it("Focuses the name input on load", function (browser) {
    browser.element("#chat-input").expect.to.be.active;
  });
});
