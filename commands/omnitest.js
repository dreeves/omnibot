module.exports = {

name: "omnitest",
description: "Just a test slash command for experimenting with.",
input: {
  name: "arg1",
  required: true,
  description: "Does this description get shown anywhere?",
},
execute: ({ cid: clientId, sender, input }) => {
 return {
   output: "You called /omnitest with arg1 = \"`" + input + "`\".",
   voxmode: "whisp",
 }
},

}; // end module.exports
