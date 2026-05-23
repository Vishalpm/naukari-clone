const crypto = require("crypto");

const ALGORITHM      = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // must be exactly 32 chars

const encrypt = (text) => {
  const iv     = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "utf-8"),
    iv
  );
  let encrypted = cipher.update(text, "utf-8", "base64");
  encrypted    += cipher.final("base64");
  return {
    encryptedContent: encrypted,
    iv: iv.toString("base64"),
  };
};

const decrypt = (encryptedContent, iv) => {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "utf-8"),
    Buffer.from(iv, "base64")
  );
  let decrypted  = decipher.update(encryptedContent, "base64", "utf-8");
  decrypted     += decipher.final("utf-8");
  return decrypted;
};

module.exports = { encrypt, decrypt };
