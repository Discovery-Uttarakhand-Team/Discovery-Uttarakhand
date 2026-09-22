import mongoose from 'mongoose';

async function audit() {
  await mongoose.connect('mongodb://localhost:27017/discovery_uttarakhand');
  console.log('Connected to MongoDB: discovery_uttarakhand');

  const collections = [
    'destinations',
    'spiritual',
    'culture',
    'activities',
    'stays',
    'rentals',
    'guides'
  ];

  for (const colName of collections) {
    const col = mongoose.connection.db.collection(colName);
    const total = await col.countDocuments();
    const docs = await col.find({}).toArray();

    let hasImage = 0;
    let noImage = 0;
    const missingDocs = [];
    const imageHosts = {};

    for (const d of docs) {
      let imgUrl = null;
      if (d.coverImage?.url) imgUrl = d.coverImage.url;
      else if (typeof d.coverImage === 'string' && d.coverImage.trim()) imgUrl = d.coverImage;
      else if (d.image?.url) imgUrl = d.image.url;
      else if (typeof d.image === 'string' && d.image.trim()) imgUrl = d.image;
      else if (d.profileImage?.url) imgUrl = d.profileImage.url;
      else if (typeof d.profileImage === 'string' && d.profileImage.trim()) imgUrl = d.profileImage;
      else if (Array.isArray(d.images) && d.images.length > 0) {
        const first = d.images[0];
        imgUrl = first?.url || (typeof first === 'string' ? first : null);
      }

      if (colName === 'rentals') {
        const vCount = (d.vehicles || []).filter(v => v.image?.url).length;
        if (vCount > 0) {
          hasImage++;
        } else {
          noImage++;
          missingDocs.push(d.name || d.slug);
        }
      } else {
        if (imgUrl) {
          hasImage++;
          try {
            if (imgUrl.startsWith('http')) {
              const host = new URL(imgUrl).hostname;
              imageHosts[host] = (imageHosts[host] || 0) + 1;
            } else {
              imageHosts['local_relative'] = (imageHosts['local_relative'] || 0) + 1;
            }
          } catch {}
        } else {
          noImage++;
          missingDocs.push({ name: d.name, slug: d.slug, district: d.district });
        }
      }
    }

    console.log(`\n========================================`);
    console.log(`COLLECTION: ${colName}`);
    console.log(`Total: ${total} | Has Image: ${hasImage} | Missing Image: ${noImage}`);
    console.log(`Image Hosts:`, imageHosts);
    if (missingDocs.length > 0 && missingDocs.length <= 15) {
      console.log(`Missing documents:`, missingDocs);
    } else if (missingDocs.length > 15) {
      console.log(`Missing sample (first 10):`, missingDocs.slice(0, 10));
    }
  }

  await mongoose.disconnect();
}

audit().catch(console.error);
