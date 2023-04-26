module.exports = {
  // The slash command's invocation string is determined by the name.
  // A command named "omniping" is invoked with "/omniping".
  name: "omniping",

  // The description is printed in command-selection menus that chat
  // clients show to the user.
  description: "Reference implementation of a slash command.",

  // To receive data from the user, all slash commands need at least
  // one option. It should be called `input`.
  options: [
    {
      name: "input",
      required: false,
      description: "Text to repeat back",
    },
  ],

  // When the command is invoked from a client, this function is
  // executed. An object is passed to it with the following properties:
  // - cid -- A unique identifier of the chat service.
  // - sender -- A unique identifier of the user invoking the command.
  //             This is only guaranteed to be unique within a
  //             particular chat service.
  // - input -- Any data passed in via the "input" option.
  // - holla -- Reply to the invoking user.
  // - whisp -- Reply, but make it visible only to the invoking user.
  // - blurt -- Send a message without replying to the invoking user.
  //            On Slack, this means the user's slash command is never
  //            printed to the channel.
  execute: ({ cid: clientId, sender, input, holla, whisp, blurt }) => {
    const output =
      `Omniping!\n` +
      `Client ID: ${clientId}\n` +
      `Sender: ${sender}\n` +
      `Input: ${input}\n`;

    switch (input) {
      case "quiet":
        whisp(output);
        break;
      case "loud":
        holla(output);
        break;
      default:
        blurt(output);
    }
  },
};
