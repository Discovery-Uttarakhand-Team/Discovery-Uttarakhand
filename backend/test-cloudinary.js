import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testCloudinary() {
  try {
    console.log('Testing Cloudinary API...');
    console.log('Using Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    
    // Try to ping the API by fetching details about the cloud account
    // Or simpler, try to upload a base64 string
    const result = await cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', {
      folder: 'test'
    });
    
    console.log('✅ Upload Success!');
    console.log('URL:', result.secure_url);
    console.log('Public ID:', result.public_id);
    
    console.log('Now deleting the test image...');
    await cloudinary.uploader.destroy(result.public_id);
    console.log('✅ Delete Success!');
    
    console.log('Cloudinary API is fully working!');
  } catch (err) {
    console.error('❌ Cloudinary Error:');
    console.error(err);
  }
}

testCloudinary();
