const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

async function update() {
  const hash = await bcrypt.hash('Reddy@3377', 10);
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('green_skills');
  await db.collection('users').updateOne({ email: 'tejaswibhavanitangella@gmail.com' }, { $set: { password: hash } });
  console.log('Password updated successfully');
  client.close();
}
update();
