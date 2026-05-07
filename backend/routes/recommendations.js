const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Listing = require('../models/Listing');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

// Simple in-memory cache: userId -> { data, expiresAt }
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// GET /api/recommendations
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Serve from cache if fresh
    const cached = cache.get(userId);
    if (cached && Date.now() < cached.expiresAt) {
      return res.json(cached.data);
    }

    const user = await User.findById(userId).select('interestedCourses interestedSubjects');
    const courses  = user.interestedCourses  || [];
    const subjects = user.interestedSubjects || [];

    // No interests set — return empty so frontend can prompt user
    if (courses.length === 0 && subjects.length === 0) {
      return res.json({ empty: true, recommendations: [] });
    }

    // Fetch available listings from other sellers
    let allListings = await Listing.find({
      status: 'available',
      seller: { $ne: userId },
    })
      .populate('seller', 'username')
      .sort({ createdAt: -1 })
      .limit(60);

    console.log(`[recommendations] other-seller listings: ${allListings.length}`);

    // Fallback: if no other sellers have listings, use all available listings
    if (allListings.length === 0) {
      allListings = await Listing.find({ status: 'available' })
        .populate('seller', 'username')
        .sort({ createdAt: -1 })
        .limit(60);
      console.log(`[recommendations] fallback all listings: ${allListings.length}`);
    }

    if (allListings.length === 0) {
      return res.json({ empty: false, recommendations: [] });
    }

    // Normalize course codes: strip dots/spaces/dashes so "159333" matches "159.333"
    const norm = (s) => s.replace(/[\s.\-]/g, '').toLowerCase();
    const coursesNorm  = courses.map(norm);
    const subjectLower = subjects.map(s => s.toLowerCase());

    const courseMatch = (l) => {
      if (!l.course) return false;
      const lc = norm(l.course);
      return coursesNorm.some(c => lc.includes(c) || c.includes(lc));
    };
    const subjectMatch = (l) => {
      if (!l.subject) return false;
      const ls = l.subject.toLowerCase();
      return subjectLower.some(s => ls.includes(s) || s.includes(ls));
    };

    const matched   = allListings.filter(l => courseMatch(l) || subjectMatch(l));
    const unmatched = allListings.filter(l => !matched.includes(l));

    // Take up to 15 candidates (matched first, then fill from unmatched)
    const candidates = [...matched, ...unmatched].slice(0, 15);

    // Build prompt — use "listingId" in context to match expected output field
    const listingContext = candidates.map(l => ({
      listingId: l._id.toString(),
      title:     l.title,
      course:    l.course  || '',
      subject:   l.subject || '',
      condition: l.condition,
      price:     l.price,
    }));

    const prompt = `You are a book recommendation assistant for a university student book exchange platform.

Student interests:
- Course codes: ${courses.length ? courses.join(', ') : 'not specified'}
- Subjects: ${subjects.length ? subjects.join(', ') : 'not specified'}

Available books for sale (use the exact listingId values from this list):
${JSON.stringify(listingContext, null, 2)}

PRIORITISATION RULES (apply in order):
1. HIGHEST: books whose "course" field matches any of the student's course codes (ignore dots and spaces, e.g. "159333" matches "159.333")
2. SECOND: books whose "subject" field relates to any of the student's subjects
3. LAST RESORT: books that are generally useful for university students in these fields

Recommend the 5 most relevant books following the rules above.
If fewer than 5 match rules 1–2, fill remaining slots using rule 3.
IMPORTANT: only use listingId values that appear in the list above. Do not invent new IDs.
Return ONLY a valid JSON array with no markdown formatting or extra text:
[{"listingId":"...","reason":"one concise sentence explaining why this suits the student, mentioning the matching course code or subject"}]`;

    const listingMap = Object.fromEntries(candidates.map(l => [l._id.toString(), l]));

    let recommendations = [];
    try {
      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      // Strip markdown code fences if model wraps the JSON
      text = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
      const picks = JSON.parse(text);
      recommendations = picks
        .filter(p => listingMap[p.listingId])
        .map(p => ({ listing: listingMap[p.listingId], reason: p.reason }));
    } catch (geminiErr) {
      console.error('Gemini error:', geminiErr.message);
    }

    // Fallback: if Gemini returned nothing valid, use top matched listings
    if (recommendations.length === 0) {
      const fallback = (matched.length > 0 ? matched : candidates).slice(0, 5);
      recommendations = fallback.map(l => ({
        listing: l,
        reason: 'Matches your course or subject interests.',
      }));
    }

    const responseData = { empty: false, recommendations };

    // Store in cache
    cache.set(userId, { data: responseData, expiresAt: Date.now() + CACHE_TTL });

    res.json(responseData);
  } catch (err) {
    console.error('Recommendation error:', err.message);
    res.status(500).json({ message: 'Failed to generate recommendations', error: err.message });
  }
});

// DELETE /api/recommendations/cache — called after user updates their interests
router.delete('/cache', auth, (req, res) => {
  cache.delete(req.user.id);
  res.json({ ok: true });
});

module.exports = router;
