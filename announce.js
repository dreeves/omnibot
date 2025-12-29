const CLOG = console.log;
const { version } = require("./package.json");
// Whoever's working on the bot and wants to be DM'd when it launches
const BOTMINDERS = {
  dreev: "298617884664528896", // dreev's Discord user ID
  //jake:  "376112731478163466", // Jake's Discord user ID
}

async function announceVersion(sendmesg) {
  const recips = `{${Object.keys(BOTMINDERS).join(", ")}}`;
  for (const [user, usid] of Object.entries(BOTMINDERS)) {
    //CLOG(`Announcing Omnibot version ${version} to ${user} (${usid})`);
    await sendmesg({
      plat: "discord",
      user: user,
      usid: `<@${usid}>`,
      mesg: `Omnibot version ${version} launched! (DM'ing this to ${recips})`,
      priv: true,
    })
  }
}

module.exports = announceVersion;