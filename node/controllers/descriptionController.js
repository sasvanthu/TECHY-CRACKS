const { OpenAI } = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const generateDescription = async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: 'Missing text' });

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `Generate a product description for: ${text}` }],
      max_tokens: 150,
    });
    const description = completion.choices[0].message.content.trim();
    res.json({ description });
  } catch (error) {
    res.status(500).json({ message: 'Error generating description', error: error.message });
  }
};

module.exports = { generateDescription };