import Favorite from '../models/Favorite.js';
import Destination from '../models/Destination.js';
import Spiritual from '../models/Spiritual.js';
import Culture from '../models/Culture.js';
import Activity from '../models/Activity.js';
import Stay from '../models/Stay.js';
import Rental from '../models/Rental.js';
import Guide from '../models/Guide.js';

export const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id }).populate('item');
    const validFavorites = favorites.filter(f => f.item != null);
    res.json({ success: true, count: validFavorites.length, data: validFavorites });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const addFavorite = async (req, res) => {
  try {
    let { itemType, item } = req.body;
    
    // Fallback for old frontend
    if (!itemType && req.body.targetType) {
       itemType = req.body.targetType.charAt(0).toUpperCase() + req.body.targetType.slice(1);
    }
    if (!item && req.body.targetId) {
       item = req.body.targetId;
    }

    if (!itemType || !item) {
      return res.status(400).json({ success: false, message: 'Provide itemType and item' });
    }

    const existing = await Favorite.findOne({
      user: req.user.id,
      itemType,
      item
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Already in favorites' });
    }

    const favorite = await Favorite.create({
      user: req.user.id,
      itemType,
      item
    });

    res.status(201).json({ success: true, data: favorite });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Already in favorites' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    let { itemType, item } = req.params;
    
    let query = { user: req.user.id };
    if (item) {
      const formattedType = itemType.charAt(0).toUpperCase() + itemType.slice(1);
      query.$or = [
        { itemType: formattedType, item },
        { _id: item }
      ];
    } else {
      query.$or = [
        { _id: itemType },
        { item: itemType }
      ];
    }

    const favorite = await Favorite.findOne(query);

    if (!favorite) {
      return res.status(404).json({ success: false, message: 'Favorite not found' });
    }

    await favorite.deleteOne();
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    let { itemType, item } = req.params;
    if (!itemType || !item) {
      return res.status(400).json({ success: false, message: 'Type and item id are required' });
    }

    const typeMap = {
      destination: 'Destination',
      spiritual: 'Spiritual',
      culture: 'Culture',
      activity: 'Activity',
      stay: 'Stay',
      rental: 'Rental',
      guide: 'Guide',
      partner_listing: 'PartnerListing'
    };

    const resolvedItemType = typeMap[itemType.toLowerCase()] || (itemType.charAt(0).toUpperCase() + itemType.slice(1));

    const existing = await Favorite.findOne({
      user: req.user.id,
      itemType: resolvedItemType,
      item: item
    });

    if (existing) {
      await existing.deleteOne();
      return res.json({ success: true, action: 'removed', isFavorite: false });
    }

    const favorite = await Favorite.create({
      user: req.user.id,
      itemType: resolvedItemType,
      item: item
    });

    res.status(201).json({ success: true, action: 'added', isFavorite: true, data: favorite });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
