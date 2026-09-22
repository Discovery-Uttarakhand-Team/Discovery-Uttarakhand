import mongoose from 'mongoose';

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/discovery_uttarakhand');
  const staysCol = mongoose.connection.db.collection('stays');
  const stays = await staysCol.find({}).toArray();
  const withImages = stays.filter(s => s.images && s.images.length > 0);
  console.log('Total stays:', stays.length);
  console.log('Stays with images:', withImages.length);
  console.log('Stays without images:', stays.length - withImages.length);
  if (withImages.length > 0) {
    console.log('First stay with image:', withImages[0].name, withImages[0].images);
  }
  process.exit(0);
}

check();
