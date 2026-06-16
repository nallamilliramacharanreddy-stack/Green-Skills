const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your_secret_encryption_key_32bytes_!';
const IV_LENGTH = 16;

const getEncryptionKey = () => {
  let key = ENCRYPTION_KEY;
  if (key.length < 32) {
    key = key.padEnd(32, 'a');
  } else if (key.length > 32) {
    key = key.substring(0, 32);
  }
  return Buffer.from(key);
};

const encryptEmbedding = (embeddingArray) => {
  try {
    if (!embeddingArray) return '';
    const text = JSON.stringify(embeddingArray);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (err) {
    console.error('Encryption error:', err);
    return '';
  }
};

const decryptEmbedding = (encryptedText) => {
  try {
    if (!encryptedText) return null;
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedTextBuffer = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', getEncryptionKey(), iv);
    let decrypted = decipher.update(encryptedTextBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString());
  } catch (err) {
    console.error('Decryption error:', err);
    return null;
  }
};

const calculateEuclideanDistance = (arr1, arr2) => {
  if (!arr1 || !arr2 || arr1.length !== arr2.length) return 999;
  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    sum += Math.pow(arr1[i] - arr2[i], 2);
  }
  return Math.sqrt(sum);
};

// Run Face Crypto Test Suite
console.log('=== Running Face Crypto Verification Tests ===');

// Generate a mock 128-float face descriptor
const originalEmbedding = Array.from({ length: 128 }, () => Math.random());

console.log('1. Generated mock 128-float facial embedding.');

// Encrypt the embedding
const encryptedString = encryptEmbedding(originalEmbedding);
console.log(`2. Encrypted string length: ${encryptedString.length}`);
if (!encryptedString.includes(':')) {
  console.error('FAIL: Encrypted string format invalid (missing IV separator)');
  process.exit(1);
}
console.log('✓ Encryption formatting verified.');

// Decrypt the embedding
const decryptedEmbedding = decryptEmbedding(encryptedString);
if (!decryptedEmbedding || !Array.isArray(decryptedEmbedding)) {
  console.error('FAIL: Decrypted object is not an array.');
  process.exit(1);
}
console.log(`3. Decrypted embedding array length: ${decryptedEmbedding.length}`);

// Calculate distance
const distance = calculateEuclideanDistance(originalEmbedding, decryptedEmbedding);
console.log(`4. Euclidean distance between original and decrypted: ${distance}`);

if (distance < 1e-9) {
  console.log('✓ Cryptographic matching verified: Decrypted embedding is an exact match to the original.');
  console.log('ALL CRYPTO TESTS PASSED SUCCESSFULLY!');
} else {
  console.error('FAIL: Decrypted embedding does not match the original.');
  process.exit(1);
}
