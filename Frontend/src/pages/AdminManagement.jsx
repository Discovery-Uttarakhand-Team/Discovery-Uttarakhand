import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { fetchItems, createItem, updateItem, deleteItem, uploadAdminImage } from '../api/adminApi';
import ImageUploader from '../components/ImageUploader';
import { X } from 'lucide-react';

const AdminManagement = () => {
  const { type } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [coverImages, setCoverImages] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);

  useEffect(() => {
    loadItems();
  }, [type]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetchItems(type);
      if (res.success) setItems(res.data);
      else setItems([]);
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      await deleteItem(type, id);
      setItems(items.filter((item) => item._id !== id));
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  const openModal = (item = null) => {
    setEditingItem(item);
    setFormData(item ? { ...item } : {});
    
    if (item) {
      if (['destinations', 'spiritual', 'culture', 'activities'].includes(type)) {
        setCoverImages(item.coverImage ? [item.coverImage] : []);
        setGalleryImages(item.gallery || []);
      } else if (type === 'rentals' || type === 'stays') {
        setCoverImages(item.image ? [item.image] : []);
        setGalleryImages(item.images || []);
      } else if (type === 'guides') {
        setCoverImages(item.profileImage ? [item.profileImage] : (item.image ? [item.image] : []));
        setGalleryImages([]);
      }
    } else {
      setCoverImages([]);
      setGalleryImages([]);
    }
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUploadImages = async (imagesArray) => {
    const uploadedResults = [];
    for (const img of imagesArray) {
      if (img instanceof File) {
        const res = await uploadAdminImage(img);
        if (res.success) uploadedResults.push(res.image);
      } else {
        uploadedResults.push(img); // Already uploaded object or string
      }
    }
    return uploadedResults;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const payload = { ...formData };
      
      // Handle image uploads
      const processedCover = await handleUploadImages(coverImages);
      const processedGallery = await handleUploadImages(galleryImages);

      if (['destinations', 'spiritual', 'culture', 'activities'].includes(type)) {
        payload.coverImage = processedCover[0] || null;
        payload.gallery = processedGallery;
      } else if (type === 'rentals' || type === 'stays') {
        payload.image = processedCover[0] || null;
        payload.images = processedGallery;
      } else if (type === 'guides') {
        payload.profileImage = processedCover[0] || null;
      }

      if (editingItem) {
        await updateItem(type, editingItem._id, payload);
      } else {
        await createItem(type, payload);
      }
      
      await loadItems();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  const renderTableHeaders = () => {
    if (items.length === 0) return null;
    const firstItem = items[0];
    const keys = ['_id', 'name', 'title', 'location', 'city', 'price', 'pricePerDay', 'pricePerNight', 'rating', 'bookingType', 'totalAmount'].filter(k => firstItem[k] !== undefined);
    return (
      <tr>
        {keys.map(k => <th key={k} className="p-4 text-left font-bold text-forest-green capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</th>)}
        <th className="p-4 text-right font-bold text-forest-green">Actions</th>
      </tr>
    );
  };

  const renderTableBody = () => {
    if (items.length === 0) return null;
    const keys = ['_id', 'name', 'title', 'location', 'city', 'price', 'pricePerDay', 'pricePerNight', 'rating', 'bookingType', 'totalAmount'].filter(k => items[0][k] !== undefined);
    return items.map(item => (
      <tr key={item._id} className="border-b border-gray-100 hover:bg-warm-white">
        {keys.map(k => <td key={k} className="p-4 text-sm text-text-dark truncate max-w-xs">{item[k]?.toString() || '-'}</td>)}
        <td className="p-4 text-right whitespace-nowrap">
          <button onClick={() => openModal(item)} className="text-earth-brown hover:underline mr-4 font-bold text-sm">Edit</button>
          <button onClick={() => handleDelete(item._id)} className="text-red-500 hover:underline font-bold text-sm">Delete</button>
        </td>
      </tr>
    ));
  };

  const renderFormFields = () => {
    const commonFields = (
      <>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Name</label>
            <input required type="text" name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Slug (URL friendly)</label>
            <input required type="text" name="slug" value={formData.slug || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Location</label>
            <input type="text" name="location" value={formData.location || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" />
          </div>
        </div>
      </>
    );

    return (
      <div className="space-y-4">
        {commonFields}
        
        {['destinations', 'spiritual', 'culture', 'activities'].includes(type) && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">District</label>
              <input type="text" name="district" value={formData.district || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Category</label>
              <input type="text" name="category" value={formData.category || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Starting Price</label>
              <input type="number" name="startingPrice" value={formData.startingPrice || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold mb-1">Short Description</label>
              <textarea name="shortDescription" value={formData.shortDescription || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" rows="2" />
            </div>
          </div>
        )}

        {type === 'rentals' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">City</label>
              <input type="text" name="city" value={formData.city || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Price Per Day</label>
              <input required type="number" name="pricePerDay" value={formData.pricePerDay || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Type</label>
              <input type="text" name="type" value={formData.type || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Vehicle Type</label>
              <input type="text" name="vehicleType" value={formData.vehicleType || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" />
            </div>
          </div>
        )}

        {type === 'stays' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">City</label>
              <input type="text" name="city" value={formData.city || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Price Per Night</label>
              <input required type="number" name="pricePerNight" value={formData.pricePerNight || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Rooms</label>
              <input type="number" name="rooms" value={formData.rooms || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Max Guests</label>
              <input type="number" name="maxGuests" value={formData.maxGuests || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" />
            </div>
          </div>
        )}

        {type === 'guides' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Category</label>
              <input type="text" name="category" value={formData.category || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Experience (e.g. 5 years)</label>
              <input type="text" name="experience" value={formData.experience || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Price Per Day</label>
              <input type="number" name="pricePerDay" value={formData.pricePerDay || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-1">Full Description</label>
          <textarea name="description" value={formData.description || formData.bio || ''} onChange={e => {
            if (type === 'guides') setFormData({...formData, bio: e.target.value});
            else handleInputChange(e);
          }} className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white text-sm" rows="3" />
        </div>

        <div className="pt-4 border-t border-gray-100">
          <ImageUploader 
            label={type === 'guides' ? "Profile Image" : "Cover Image"} 
            images={coverImages} 
            onChange={setCoverImages} 
            multiple={false} 
          />
          
          {type !== 'guides' && type !== 'bookings' && (
            <ImageUploader 
              label="Gallery Images" 
              images={galleryImages} 
              onChange={setGalleryImages} 
              multiple={true} 
              maxFiles={5}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-[1440px] mx-auto min-h-screen relative">
      <Navbar />
      <div className="bg-white rounded-3xl p-8 card-shadow border border-beige">
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-forest-green capitalize">Manage {type}</h1>
            <Link to="/admin" className="text-earth-brown text-sm font-bold hover:underline mt-2 inline-block">← Back to Dashboard</Link>
          </div>
          {type !== 'bookings' && (
            <button onClick={() => openModal()} className="btn-primary px-6 py-2 rounded-full font-bold">
              + Add New
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-muted-text">Loading {type}...</p>
        ) : items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-beige/30 border-b border-beige">
                  {renderTableHeaders()}
                </tr>
              </thead>
              <tbody>
                {renderTableBody()}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-text">No {type} found.</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto pt-24 pb-10">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-forest-green capitalize">
                {editingItem ? `Edit ${type.slice(0, -1)}` : `Add New ${type.slice(0, -1)}`}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              {renderFormFields()}
              
              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors w-full">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="px-6 py-3 bg-forest-green text-white font-bold rounded-lg hover:bg-forest-green/90 transition-colors w-full disabled:opacity-70 disabled:cursor-not-allowed">
                  {isSaving ? 'Saving...' : (editingItem ? 'Save Changes' : 'Create Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminManagement;
