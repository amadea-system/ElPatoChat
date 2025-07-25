
/**
 * Helper function that takes an Emote Code and escapes it for use in Regex.
 * @param code The emote code to escape.
 * @return The escaped emote code.
 */
export const escapeEmoteCode = (code: string): string => {
  // https://stackoverflow.com/a/6969486
  return code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string

  // TODO: Update to Node.js 24 and use RegExp.escape
  // return RegExp.escape(code);
};
