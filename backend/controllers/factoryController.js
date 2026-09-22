import { buildQuery } from '../utils/queryHelper.js';
import { destroyCloudinaryImage, destroyMultipleCloudinaryImages, handleImageUpdates, handleMultipleImageUpdates } from '../utils/cloudinaryHelper.js';

export const stripProvenance = (body) => {
  const immutable = ['sourceName', 'sourceUrl', 'sourcePageUrl', 'contentLicense', 'lastVerified', 'slug'];
  const data = { ...body };
  immutable.forEach(key => delete data[key]);
  
  // Strip image provenance
  if (data.coverImage) {
    delete data.coverImage.sourcePage;
    delete data.coverImage.license;
    delete data.coverImage.attribution;
    delete data.coverImage.source;
  }
  if (data.gallery && Array.isArray(data.gallery)) {
    data.gallery.forEach(img => {
      delete img.sourcePage;
      delete img.license;
      delete img.attribution;
      delete img.source;
    });
  }
  if (data.images && Array.isArray(data.images)) {
    data.images.forEach(img => {
      delete img.sourcePage;
      delete img.license;
      delete img.attribution;
      delete img.source;
    });
  }
  return data;
};

export const createController = (Model, isTextIndexed = false) => {
  return {
    getAll: async (req, res) => {
      try {
        const query = buildQuery(req.query, isTextIndexed);
        
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 1000;
        const skip = (page - 1) * limit;

        const docs = await Model.find(query).skip(skip).limit(limit);
        const total = await Model.countDocuments(query);
        
        res.status(200).json({ success: true, count: docs.length, total, data: docs });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },

    getBySlug: async (req, res) => {
      try {
        const doc = await Model.findOne({ slug: req.params.slug });
        if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
        res.status(200).json({ success: true, data: doc });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },

    // Admin Methods
    create: async (req, res) => {
      try {
        const doc = await Model.create(req.body);
        res.status(201).json({ success: true, data: doc });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
    },

    update: async (req, res) => {
      try {
        const existing = await Model.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
        
        const safeData = stripProvenance(req.body);

        // Optional cloudinary handle logic could go here if we uncomment
        
        const doc = await Model.findByIdAndUpdate(req.params.id, safeData, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: doc });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
    },

    remove: async (req, res) => {
      try {
        const doc = await Model.findById(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
        await Model.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Deleted successfully' });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    }
  };
};
