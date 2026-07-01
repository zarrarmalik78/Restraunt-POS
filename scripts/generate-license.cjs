const crypto = require('crypto');
const readline = require('readline');

const ACTIVATION_SALT = 'G-TRAX-ACTIVATION-SALT-2026';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== G-Trax License Generator ===');
rl.question('Enter Client Hardware ID: ', (hwId) => {
  const cleanHwId = hwId.trim();
  if (!cleanHwId) {
    console.log('Error: Hardware ID cannot be empty');
    rl.close();
    return;
  }
  
  const key = crypto.createHash('sha256').update(cleanHwId + '-' + ACTIVATION_SALT).digest('hex');
  console.log('\n----------------------------------------');
  console.log('Activation Key for Client:');
  console.log(key);
  console.log('----------------------------------------\n');
  
  rl.close();
});
