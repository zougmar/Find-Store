const User = require('../models/User');

const ALLOWED = ['ar', 'fr', 'en'];

async function updatePreferredLanguage(req, res, next) {
  try {
    const language = req.body?.language;
    if (!ALLOWED.includes(language)) {
      return res.status(400).json({ message: 'Language must be ar, fr, or en' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferredLanguage: language },
      { new: true }
    ).select('-password');

    res.json({
      _id: user._id,
      preferredLanguage: user.preferredLanguage
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { updatePreferredLanguage };
