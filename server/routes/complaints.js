const express = require('express');

const router = express.Router();

// Mock database for complaints
const complaints = [];

// Get all complaints
router.get('/', (req, res) => {
  try {
    const { damId, forestId, status } = req.query;
    let filtered = complaints;

    if (damId) {
      filtered = filtered.filter(c => c.damId === damId);
    } else if (forestId) {
      filtered = filtered.filter(c => c.forestId === forestId);
    }
    if (status) {
      filtered = filtered.filter(c => c.status === status);
    }

    res.json({
      success: true,
      data: filtered,
      count: filtered.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get complaints for logged-in user
router.get('/user', (req, res) => {
  try {
    // In a real app, you'd get user ID from JWT token
    // For now, we'll return complaints that would belong to a user
    // This is a mock implementation
    const userComplaints = [
      {
        id: '1738901234567',
        title: 'Water contamination in nearby village',
        category: 'environmental',
        status: 'open',
        targetType: 'dam',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '1738901234568',
        title: 'Compensation not received for land acquisition',
        category: 'compensation',
        status: 'pending',
        targetType: 'dam',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]; // Return sample user complaints
    
    res.json({
      success: true,
      data: userComplaints,
      count: userComplaints.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get complaint by ID
router.get('/:id', (req, res) => {
  try {
    const complaint = complaints.find(c => c.id === req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }
    res.json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new complaint
router.post('/', (req, res) => {
  try {
    const { damId, forestId, title, description, complainantName, contactInfo, category, location } = req.body;

    if ((!damId && !forestId) || !title || !description) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const newComplaint = {
      id: String(Date.now()),
      damId: damId || null,
      forestId: forestId || null,
      title,
      description,
      complainantName: complainantName || 'Anonymous',
      contactInfo: contactInfo || '',
      category: category || 'general',
      location: location || null,
      status: 'open',
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    complaints.push(newComplaint);
    res.status(201).json({ success: true, data: newComplaint });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update complaint
router.put('/:id', (req, res) => {
  try {
    const complaintIndex = complaints.findIndex(c => c.id === req.params.id);
    if (complaintIndex === -1) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }

    const updatedComplaint = {
      ...complaints[complaintIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    complaints[complaintIndex] = updatedComplaint;
    res.json({ success: true, data: updatedComplaint });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
