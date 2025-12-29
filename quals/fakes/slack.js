const sinon = require("sinon");

const chat = {
  postEphemeral: sinon.fake.resolves(),
  postMessage: sinon.fake.resolves(),
};
const client = {
  chat,
  conversations: {
    list: async () =>
      Promise.resolve({ channels: [{ id: "123", name: "botspam" }] }),
  },
};

module.exports = client;
