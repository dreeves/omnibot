const NOM = "omninom";

const packageData = require('package.json');

module.exports = {

name: NOM,
description: "An Omnibot test slash command for experimenting with",
input: {
  name: "arg1",
  required: true,
  description: "This is the usage hint: type something",
},
execute: ({ cid: clientId, sender, input }) => {
 return { voxmode: "whisp", output: `\
This is Omnibot v${packageData.version} \
called by ${JSON.stringify(sender)} \
in channel #${clientId}.\n\
You called /${NOM} with arg1 = "\`${input}\`".\n\
Debugging factoid: ` + (input === input.trim() ? 
"If arg1 had any leading or trailing space, it got trimmed before we saw it." :
"Interestingly, arg1's whitespace was not trimmed before we saw it."),
 }
},

}; // end module.exports
