const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');

const router = express.Router();

const publicDir = path.join(__dirname, '../../public');

// Try to guess forest file path in public when not provided
function findForestFile() {
  if (!fs.existsSync(publicDir)) return null;
  const files = fs.readdirSync(publicDir);
  // Prefer CSV with 'forest' in name
  const csvCandidate = files.find(f => f.toLowerCase().includes('forest') && f.toLowerCase().endsWith('.csv'));
  if (csvCandidate) return path.join(publicDir, csvCandidate);
  // Fallback: any CSV
  const anyCsv = files.find(f => f.toLowerCase().endsWith('.csv'));
  if (anyCsv) return path.join(publicDir, anyCsv);
  // Try XLSX with 'forest' in name
  const xlsxCandidate = files.find(f => f.toLowerCase().includes('forest') && f.toLowerCase().endsWith('.xlsx'));
  if (xlsxCandidate) return path.join(publicDir, xlsxCandidate);
  // Fallback: any XLSX
  const anyXlsx = files.find(f => f.toLowerCase().endsWith('.xlsx'));
  if (anyXlsx) return path.join(publicDir, anyXlsx);
  return null;
}

// Normalize a generic record to our Forest shape
function normalizeForestRecord(row, idx) {
  const getVal = (keys) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
        return row[k];
      }
    }
    // Try dynamic matching by substring
    const lcKeys = Object.keys(row);
    for (const k of lcKeys) {
      const lk = k.toLowerCase();
      if (keys.some(target => lk.includes(target.toLowerCase()))) {
        const v = row[k];
        if (v !== undefined && v !== null && String(v).trim() !== '') return v;
      }
    }
    return undefined;
  };

  const name = getVal(['name', 'forest_name', 'forest', 'site', 'location']);
  const latRaw = getVal(['lat', 'latitude']);
  const lngRaw = getVal(['lng', 'lon', 'long', 'longitude']);
  const covRaw = getVal(['coverage', 'coverage%', 'coverage %', 'percent', 'percentage']);
  const lat = parseFloat(latRaw);
  const lng = parseFloat(lngRaw);
  const coverage = covRaw !== undefined ? parseFloat(covRaw) : undefined;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    id: String(idx + 1),
    name: name ? String(name).trim() : `Forest ${idx + 1}`,
    location: { lat, lng },
    coveragePercent: Number.isFinite(coverage) ? coverage : undefined,
  };
}

// Read forests from CSV
function readForestsCsv(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return resolve([]);
    }
    const raw = [];
    fs.createReadStream(filePath)
      .pipe(csv({ mapHeaders: ({ header }) => (header || '').trim() }))
      .on('data', (row) => raw.push(row))
      .on('end', () => {
        const data = raw
          .map((r, idx) => normalizeForestRecord(r, idx))
          .filter(Boolean);
        resolve(data);
      })
      .on('error', reject);
  });
}

// Read forests from XLSX
function readForestsXlsx(filePath) {
  if (!fs.existsSync(filePath)) return Promise.resolve([]);
  try {
    const wb = XLSX.readFile(filePath);
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);
    const data = rows
      .map((r, idx) => normalizeForestRecord(r, idx))
      .filter(Boolean);
    return Promise.resolve(data);
  } catch (err) {
    return Promise.reject(err);
  }
}

// GET /api/forests -> from CSV/XLSX under public
router.get('/', async (req, res) => {
  try {
    // Resolve file path
    let filePath;
    if (req.query.filePath) {
      filePath = path.isAbsolute(req.query.filePath)
        ? req.query.filePath
        : path.join(publicDir, req.query.filePath);
    } else {
      filePath = findForestFile() || path.join(publicDir, 'forest.csv');
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.json({ success: true, data: [], count: 0 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const data = ext === '.xlsx' ? await readForestsXlsx(filePath) : await readForestsCsv(filePath);
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    console.error('[Forests] Read error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;