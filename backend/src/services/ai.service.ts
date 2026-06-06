import logger from '../config/logger';

export interface AIAnalysisResult {
  category: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  severity: number;
  suggestedDepartment: string;
  urgencyScore: number;
  riskFactors: string[];
  estimatedResolutionTime: string;
}

const issuePatterns: Record<string, any> = {
  pothole: {
    keywords: ['pothole', 'road', 'damage', 'crack', 'hole', 'asphalt', 'pavement'],
    risk: ['vehicle damage', 'accident risk', 'traffic congestion'],
    dept: 'Public Works Department',
    urgency: 6,
    time: '3-5 days'
  },
  garbage: {
    keywords: ['garbage', 'waste', 'trash', 'dump', 'overflow', 'collection', 'litter'],
    risk: ['health hazard', 'pest attraction', 'foul odor'],
    dept: 'Waste Management Department',
    urgency: 4,
    time: '1-2 days'
  },
  streetlight: {
    keywords: ['streetlight', 'lamp', 'light', 'dark', 'broken', 'electricity', 'pole', 'bulb'],
    risk: ['safety concern', 'crime risk', 'poor visibility'],
    dept: 'Electrical Department',
    urgency: 5,
    time: '2-3 days'
  },
  water: {
    keywords: ['water', 'pipe', 'leak', 'supply', 'pressure', 'quality', 'leakage', 'burst'],
    risk: ['potable water wastage', 'flooding', 'property damage'],
    dept: 'Water Supply Department',
    urgency: 7,
    time: '1-3 days'
  },
  sewerage: {
    keywords: ['sewer', 'sewage', 'drain', 'manhole', 'overflow', 'smell', 'stench', 'drainage'],
    risk: ['flooding risk', 'health hazard', 'property damage'],
    dept: 'Sewerage Board (KWSC)',
    urgency: 8,
    time: '1-2 days'
  },
  safety: {
    keywords: ['robbery', 'theft', 'unsafe', 'danger', 'harassment', 'crime', 'threat', 'security'],
    risk: ['personal injury', 'security threat', 'low citizen safety'],
    dept: 'Law Enforcement / Security Dept',
    urgency: 9,
    time: '1 day'
  }
};

/**
 * Helper to analyze an issue using Groq Llama-3.2-11b-vision-preview API
 */
async function analyzeWithGroq(description: string, imageBase64?: string): Promise<AIAnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq API key is not configured');
  }

  const promptText = `Analyze this reported civic issue description: "${description || 'No description provided'}".
Determine the correct category (must be one of: pothole, garbage, streetlight, water, sewerage, safety).
Return a JSON object matching this schema:
{
  "category": "pothole | garbage | streetlight | water | sewerage | safety",
  "confidence": 0-100,
  "priority": "low | medium | high | critical",
  "severity": 1-10,
  "suggestedDepartment": "string department name",
  "urgencyScore": 1-10,
  "riskFactors": ["factor 1", "factor 2"],
  "estimatedResolutionTime": "e.g. 2-3 days"
}`;

  const content: any[] = [{ type: 'text', text: promptText }];

  if (imageBase64) {
    let imageUrl = imageBase64;
    if (!imageBase64.startsWith('data:')) {
      imageUrl = `data:image/jpeg;base64,${imageBase64}`;
    }
    content.push({
      type: 'image_url',
      image_url: {
        url: imageUrl
      }
    });
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API returned error status: ${response.status}. Details: ${errText}`);
  }

  const result = (await response.json()) as any;
  const jsonText = result.choices?.[0]?.message?.content;
  if (!jsonText) {
    throw new Error('Groq response content is empty');
  }

  const parsed = JSON.parse(jsonText) as AIAnalysisResult;
  parsed.category = String(parsed.category).toLowerCase();
  return parsed;
}

/**
 * Classifies an issue and extracts details using Google Gemini Flash API, falling back to
 * Groq Llama-3.2 Vision API, and finally to a deterministic rule-based pattern matching system.
 */
export async function analyzeIssue(description: string, imageBase64?: string): Promise<AIAnalysisResult> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (geminiApiKey) {
    try {
      const parts: any[] = [];
      
      const promptText = `Analyze this reported civic issue description: "${description || 'No description provided'}".
Determine the correct category (must be one of: pothole, garbage, streetlight, water, sewerage, safety).
Return a JSON object matching this schema:
{
  "category": "pothole | garbage | streetlight | water | sewerage | safety",
  "confidence": 0-100,
  "priority": "low | medium | high | critical",
  "severity": 1-10,
  "suggestedDepartment": "string department name",
  "urgencyScore": 1-10,
  "riskFactors": ["factor 1", "factor 2"],
  "estimatedResolutionTime": "e.g. 2-3 days"
}`;

      parts.push({ text: promptText });

      if (imageBase64) {
        let data = imageBase64;
        let mimeType = 'image/jpeg';
        if (imageBase64.includes(';base64,')) {
          const splitParts = imageBase64.split(';base64,');
          mimeType = splitParts[0].replace('data:', '');
          data = splitParts[1];
        }
        parts.push({
          inlineData: {
            mimeType,
            data
          }
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (response.ok) {
        const result = (await response.json()) as any;
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText) as AIAnalysisResult;
          // Ensure category is lowercase to match systems
          parsed.category = String(parsed.category).toLowerCase();
          return parsed;
        }
      } else {
        const errText = await response.text();
        logger.warn(`Gemini API returned error status: ${response.status}. Details: ${errText}`);
      }
    } catch (err) {
      logger.error('Gemini API call failed, will try Groq fallback if configured:', err);
    }
  }

  if (groqApiKey) {
    try {
      logger.info('Attempting Groq API analysis fallback...');
      const parsed = await analyzeWithGroq(description, imageBase64);
      return parsed;
    } catch (err) {
      logger.error('Groq API call failed, falling back to deterministic classifier:', err);
    }
  }

  // Fallback Rule-Based Pattern Matching (Deterministic)
  const text = (description || '').toLowerCase();
  let bestMatch = { type: 'garbage', score: 0, pattern: issuePatterns.garbage };

  Object.entries(issuePatterns).forEach(([type, pattern]) => {
    const score = pattern.keywords.reduce((acc: number, keyword: string) => {
      return acc + (text.includes(keyword) ? 2 : 0);
    }, 0);

    if (score > bestMatch.score) {
      bestMatch = { type, score, pattern };
    }
  });

  const baseConfidence = Math.min(80 + (bestMatch.score * 5), 98);
  const confidence = bestMatch.score > 0 ? baseConfidence : 72;
  const urgency = bestMatch.pattern.urgency;

  let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (urgency >= 9) priority = 'critical';
  else if (urgency >= 7) priority = 'high';
  else if (urgency >= 4) priority = 'medium';
  else priority = 'low';

  return {
    category: bestMatch.type,
    confidence,
    priority,
    severity: urgency,
    suggestedDepartment: bestMatch.pattern.dept,
    urgencyScore: urgency,
    riskFactors: bestMatch.pattern.risk,
    estimatedResolutionTime: bestMatch.pattern.time
  };
}
