const sinon = require("sinon");

let user;
let message;
let collection = (item) => ({
  fetch: (id) => (id ? Promise.resolve(item) : Promise.resolve([item])),
});
let channel;
let guild;
let client;
let dm;
let dmChannel;

message = { reply: sinon.fake.resolves({ id: "123" }) };
dm = { reply: sinon.fake.resolves({ id: "123" }) };
dmChannel = {
  messages: collection(dm),
};
user = {
  send: sinon.fake.resolves({ id: "123" }),
  dmChannel: dmChannel,
};
channel = {
  name: "botspam",
  send: sinon.fake.resolves({ id: "123" }),
  messages: collection(message),
};
guild = {
  name: "testserver",
  fetch: () => Promise.resolve(guild),
  channels: collection(channel),
};
client = {
  guilds: collection(guild),
  users: collection(user),
};

module.exports = {
  client,
  message,
  dm,
  user,
  channel,
};
