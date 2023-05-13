const NOM = "omninom";

const packageData = require('../package.json');

module.exports = {

name: NOM,
description: "An Omnibot slash command for experimenting with",
input: {
  name: "arg1",
  required: true,
  description: "This is the usage hint: type something",
},
execute: ({ channel_name, sender, input }) => {
  let voxmode = "whisp";
  if (input === "holla" || 
      input === "blurt") { voxmode = input }
  return { voxmode, output: `\
This is Omnibot v${packageData.version} \
called by ${sender} \
in channel ${channel_name}.\n\
You called /${NOM} with arg1 = "\`${input}\`".\n\
For testing, you can make arg1 be "whisp", "holla", or "blurt" and /omninom \
will use that as the voxmode for this reply.\n\
Debugging factoid: ` + (input === input.trim() ? 
"If arg1 had leading or trailing whitespace, it got trimmed before Omnibot " +
"saw it." :
"Interestingly, arg1's whitespace was not trimmed before Omnibot saw it."),
 }
},

}; // end module.exports
