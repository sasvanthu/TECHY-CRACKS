const speech = require('@google-cloud/speech');
const client = new speech.SpeechClient();

const transcribeSpeech = async (req, res) => {
  const { audio, languageCode } = req.body;
  if (!audio || !languageCode) {
    return res.status(400).json({ message: 'Missing audio or languageCode' });
  }

  try {
    const [response] = await client.recognize({
      audio: { content: audio },
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode, // e.g., 'hi-IN', 'ta-IN', 'te-IN'
      },
    });

    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
    res.json({ transcription });
  } catch (error) {
    res.status(500).json({ message: 'Error transcribing speech', error: error.message });
  }
};

module.exports = { transcribeSpeech };