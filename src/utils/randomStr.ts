import { randomInt } from "crypto";

/**
 * Random byte string like /0-9a-zA-Z/
 *
 * @param length - code length
 * @returns
 */
export const randomStr = (length: number) => {
  const charset =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghiklmnopqrstuvwxyz";
  return new Array(length)
    .fill(null)
    .map(() => charset.charAt(randomInt(charset.length)))
    .join("");
};
