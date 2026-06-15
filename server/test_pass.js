const bcrypt = require('bcryptjs');
const hash = '$2b$10$EQzBatqV71SplPDzi8zmQOqnoAsg0UudL./3tCnqkb6rxpPuOUyK6';
const pass = 'Reddy@3377';
bcrypt.compare(pass, hash).then(res => console.log('Match:', res));
