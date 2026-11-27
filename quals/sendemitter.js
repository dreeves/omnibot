const sinon = require("sinon");
const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised.default);

const { sendmesg, registerPlatform } = require("../sendemitter.js");

// Replicata: POST {"plat":"constructor","mesg":"hi"} to /sendmesg.
// Expectata: sendmesg rejects, as it does for any platform that isn't
// registered, so /sendmesg reports an error.
// Resultata: platforms["constructor"] is Object, so sendmesg resolves without
// sending anything, and /sendmesg answers 200 and uses up the hour's rate
// limit. Likewise for every other name a plain object inherits.
describe("sendmesg() with a platform that isn't registered", function () {
  // Object.prototype's standard names, listed out because chai.should() (used
  // by other qual files) adds a "should" to Object.prototype at load time
  const inherited = ["constructor", "__defineGetter__", "__defineSetter__",
    "hasOwnProperty", "__lookupGetter__", "__lookupSetter__", "isPrototypeOf",
    "propertyIsEnumerable", "toString", "valueOf", "__proto__", "toLocaleString"];
  for (const plat of ["nosuchplatform", ...inherited]) {
    it(`rejects plat "${plat}"`, async function () {
      return expect(sendmesg({ plat, mesg: "Hello, world!" }))
        .to.be.rejectedWith(TypeError);
    });
  }
});

describe("sendmesg() with a registered platform", function () {
  it("hands the message to that platform and returns what it returns", async function () {
    const handler = sinon.fake.resolves("qual-message-id");
    registerPlatform("qual-platform", handler);
    const message = { plat: "qual-platform", mesg: "Hello, world!" };

    await expect(sendmesg(message)).to.eventually.equal("qual-message-id");
    sinon.assert.calledOnceWithExactly(handler, message);
  });
});
