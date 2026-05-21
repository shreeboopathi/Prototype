// Serverless API for Vercel (or other serverless hosts)
// Expects POST { image: string(base64), mediaType: string }
// Reads ANTHROPIC_API_KEY from server environment (`ANTHROPIC_API_KEY`).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY on server' });
    return;
  }

  const { image, mediaType } = req.body || {};
  if (!image) {
    res.status(400).json({ error: 'Missing image in request' });
    return;
  }

  const breedList = [
    "Gir","Sahiwal","Red Sindhi","Ongole","Tharparkar","Hallikar","Kangayam","Deoni",
    "Murrah","Jaffarabadi","Surti","Mehsana","Pandharpuri","Bhadawari"
  ].join(', ');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: `You are an expert Indian cattle and buffalo breed identification system. First, validate whether the image contains a cow or buffalo. If not, respond with {"valid": false, "reason":"..."}. If yes, select the best matching breed from: ${breedList}. Respond ONLY with JSON: {"valid": true, "animal_type":"Cattle|Buffalo","breed":"...","confidence":number,"top3":[{"breed":"...","confidence":number},...]}` }
          ]
        }]
      })
    });

    if (!response.ok) {
      const txt = await response.text();
      res.status(502).json({ error: `Anthropic API error: ${response.status} - ${txt}` });
      return;
    }

    const data = await response.json();
    // Attempt to extract text content and parse JSON from Claude
    const text = (data.content || []).map(c => c.text || '').join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();

    try {
      const parsed = JSON.parse(clean);
      res.status(200).json(parsed);
    } catch (err) {
      res.status(502).json({ error: 'Failed to parse Anthropic response', raw: clean });
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
