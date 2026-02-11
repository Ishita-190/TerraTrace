/**
 * NLP Utilities for extracting compensation and displacement information from documents
 * This is a basic implementation using regex patterns and text analysis
 * For production, integrate with advanced NLP libraries like spaCy, NLTK, or transformers
 */

/**
 * Extract compensation amounts from text
 * Looks for patterns like "₹1000000", "$100000", "amount: 500000", etc.
 */
export const extractCompensationAmounts = (text) => {
  const compensationPatterns = [
    /₹\s?[\d,]+(?:\.\d{1,2})?/g,
    /\$\s?[\d,]+(?:\.\d{1,2})?/g,
    /(?:amount|compensation|paid|receive[d]?)\s*(?:of|is|:|≈)?\s*[\d,]+(?:\.\d{1,2})?/gi,
  ];

  const amounts = [];
  compensationPatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      amounts.push(...matches);
    }
  });

  return amounts;
};

/**
 * Extract affected population numbers
 */
export const extractAffectedPopulation = (text) => {
  const populationPatterns = [
    /(?:affected|displace[d]?|impact[ed]?)\s*(?:population|people|families|persons)\s*(?:of|is|:|≈)?\s*[\d,]+/gi,
    /[\d,]+\s*(?:people|families|persons)\s*(?:affected|displaced)/gi,
  ];

  const populations = [];
  populationPatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      populations.push(...matches);
    }
  });

  return populations;
};

/**
 * Extract key compensation terms
 */
export const extractCompensationTerms = (text) => {
  const terms = [];
  const keywords = [
    'rehabilitation',
    'resettlement',
    'land compensation',
    'cash assistance',
    'employment',
    'education support',
    'healthcare',
    'livelihood restoration',
    'community development',
    'infrastructure',
  ];

  keywords.forEach((keyword) => {
    const regex = new RegExp(`(.*?${keyword}.*?)\\n`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      terms.push(...matches.map((m) => m.trim()));
    }
  });

  return terms;
};

/**
 * Extract project timeline information
 */
export const extractTimeline = (text) => {
  const timelinePatterns = [
    /(?:start|begin|commence)\s*(?:date|on|from)?\s*(?:of|the)?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})/gi,
    /(?:complete|finish|end)\s*(?:date|on|by)?\s*(?:of|the)?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})/gi,
  ];

  const timelines = [];
  timelinePatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      timelines.push(...matches);
    }
  });

  return timelines;
};

/**
 * Extract environmental impact statements
 */
export const extractEnvironmentalImpact = (text) => {
  const impacts = [];
  const keywords = ['environmental', 'ecology', 'forest', 'wildlife', 'water', 'air quality', 'soil', 'biodiversity'];

  keywords.forEach((keyword) => {
    const regex = new RegExp(`(.*?${keyword}.*?)(?:\\n|$)`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      impacts.push(...matches.filter((m) => m.length > 10).map((m) => m.trim()));
    }
  });

  return impacts.slice(0, 5); // Return top 5 impacts
};

/**
 * Perform comprehensive document analysis
 */
export const analyzeDocument = (text, documentType = 'pdf') => {
  if (!text || text.length === 0) {
    return {
      success: false,
      error: 'Document text is empty',
      extractedData: null,
    };
  }

  try {
    const analysis = {
      documentType,
      extractedAt: new Date().toISOString(),
      compensation: {
        amounts: extractCompensationAmounts(text),
        terms: extractCompensationTerms(text),
      },
      affectedPopulation: extractAffectedPopulation(text),
      timeline: extractTimeline(text),
      environmentalImpact: extractEnvironmentalImpact(text),
      summary: {
        hasCompensationInfo: extractCompensationAmounts(text).length > 0,
        hasPopulationInfo: extractAffectedPopulation(text).length > 0,
        hasTimelineInfo: extractTimeline(text).length > 0,
        hasEnvironmentalInfo: extractEnvironmentalImpact(text).length > 0,
      },
    };

    return {
      success: true,
      extractedData: analysis,
      confidence: calculateConfidence(analysis),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      extractedData: null,
    };
  }
};

/**
 * Calculate confidence score of extracted data
 */
const calculateConfidence = (analysis) => {
  let score = 0;
  const maxScore = 4;

  if (analysis.summary.hasCompensationInfo) score += 1;
  if (analysis.summary.hasPopulationInfo) score += 1;
  if (analysis.summary.hasTimelineInfo) score += 1;
  if (analysis.summary.hasEnvironmentalInfo) score += 1;

  return (score / maxScore) * 100;
};

export default {
  extractCompensationAmounts,
  extractAffectedPopulation,
  extractCompensationTerms,
  extractTimeline,
  extractEnvironmentalImpact,
  analyzeDocument,
};
