async function sendmesg(client, commandCache, message) {
    const { chan, mesg, mrid, phem, priv, user } = message;

    if (priv && phem) {
        throw "Ambiguous message:\n" + JSON.stringify(message, null, 4);
    }

    if ((priv || phem) && !user) {
        throw "Ambiguous message:\n" + JSON.stringify(message, null, 4);
    }

    if (mrid && mrid.startsWith("command:")) {
        const ack = commandCache[mrid];
        return ack({
            response_type: phem ? "ephemeral" : "in_channel",
            text: mesg,
        });
    }

    let payload = {
        text: mesg,
        thread_ts: mrid,
        channel: chan,
    };

    if (user) {
        const match = message.user.match(/([UW][A-Z0-9]{2,})/);
        const userId = match[1];
        payload.user = userId;
    }

    if (user && priv) {
        payload.channel = payload.user;
    }

    if (user && phem) {
        return client.chat.postEphemeral(payload);
    }

    return client.chat.postMessage(payload);
}

module.exports = sendmesg;
