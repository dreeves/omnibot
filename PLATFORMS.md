# Platform-specific notes
## Discord

- Received commands must be replied to within 3 seconds, or the user
  will see an error message. The time limit could be extended to 15
  minutes if we used deferred replies.
- Replies _after_ the initial reply may be sent within a 15 minute
  window after the initial reply. This cannot be extended.
- Ephemeral messages can only be created as a reply to a command. When
  using `phem`, `mrid` must be the ID of a command (prefixed with
  "interaction:"). Specifying `user` is meaningless and therefore
  prohibited.
- `sendmesg` returns the ID of the sent message.

## Slack

- Received commands must be replied to within 3 seconds, or the user
  will see an error message.
- `fief` does nothing on Slack, as using it requires an enterprise
  account. It's still required by sendmesg in order to maintain
  consistency with other platforms and reduce the amount of
  platform-specific code necessary to use sendmesg.
- `sendmesg` does not return the ID of the sent message.
