const NOM = "omninom";

const packageData = require('../package.json');

module.exports = {

name: NOM,
description: "An Omnibot test slash command for experimenting with",
input: {
  name: "arg1",
  required: true,
  description: "This is the usage hint: type something",
},
execute: ({ channel, sender, input }) => {
 return { voxmode: "whisp", output: `\
This is Omnibot v${packageData.version} \
called by ${sender} \
in channel #${JSON.stringify(channel)}.\n\
You called /${NOM} with arg1 = "\`${input}\`".\n\
Debugging factoid: ` + (input === input.trim() ? 
"If arg1 had leading or trailing whitespace, it got trimmed before Omnibot " +
"saw it." :
"Interestingly, arg1's whitespace was not trimmed before Omnibot saw it."),
 }
},

}; // end module.exports
