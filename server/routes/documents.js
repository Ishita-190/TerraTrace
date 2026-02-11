const express = require('express');

const router = express.Router();

// Mock database for documents
const documents = [];

// Get all documents
router.get('/', (req, res) => {
  try {
    const { damId, forestId, type } = req.query;
    let filtered = documents;

    if (damId) {
      filtered = filtered.filter(d => d.damId === damId);
    } else if (forestId) {
      filtered = filtered.filter(d => d.forestId === forestId);
    }
    if (type) {
      filtered = filtered.filter(d => d.type === type);
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

// Get document by ID
router.get('/:id', (req, res) => {
  try {
    const document = documents.find(d => d.id === req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload new document
router.post('/', (req, res) => {
  try {
    const { damId, forestId, title, type, documentUrl, extractedData } = req.body;

    if ((!damId && !forestId) || !title || !type) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const newDocument = {
      id: String(Date.now()),
      damId: damId || null,
      forestId: forestId || null,
      title,
      type, // 'pdf', 'rti', 'satellite', 'report'
      documentUrl: documentUrl || '',
      extractedData: extractedData || {
        compensation: {
          amounts: ['₹50,000', '₹75,000'],
          terms: ['One-time payment', 'Monthly installment']
        },
        affectedPopulation: ['~200 families', '15 villages affected'],
        timeline: ['2020-2023', 'Phase 2 ongoing'],
        environmentalImpact: ['Forest area reduced by 15%', 'Water quality affected'],
        summary: {
          hasCompensation: true,
          hasEnvironmentalImpact: true,
          hasLegalIssues: false,
          isComplete: true
        }
      },
      status: 'processed', // 'pending', 'processed', 'error'
      uploadedAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    };

    documents.push(newDocument);
    
    // Simulate processing delay
    setTimeout(() => {
      console.log(`Document ${newDocument.id} processed successfully`);
    }, 2000);
    
    res.status(201).json({ success: true, data: newDocument });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update document
router.put('/:id', (req, res) => {
  try {
    const docIndex = documents.findIndex(d => d.id === req.params.id);
    if (docIndex === -1) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const updatedDocument = {
      ...documents[docIndex],
      ...req.body,
      processedAt: req.body.status === 'processed' ? new Date().toISOString() : documents[docIndex].processedAt
    };

    documents[docIndex] = updatedDocument;
    res.json({ success: true, data: updatedDocument });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
