const testAws = async (region, accessKeyId, secretAccessKey) => {
  const polly = new AWS.Polly({
    region: region,
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  });
  try {
    const result = await polly.describeVoices().promise();
    return { success: true, message: '' };
  } catch (error) {
    return { success: false, message: `ERROR: ${error.message}` };
  }
};

const pollyParams = (text, audioType, voice, ssml = false) => {
  params = {
    Engine: 'standard',
    Text: text,
    TextType: ssml ? 'ssml' : 'text',
    OutputFormat: audioType,
    VoiceId: voice,
  };

  return params;
};

const getPolly = async () => {
  const creds = await getFromStorage(WEBRICE_KEYS.AWS_CREDS);

  const polly = await new AWS.Polly({
    region: creds.region,
    accessKeyId: creds.akid,
    secretAccessKey: creds.sak,
  });

  return polly;
};

const requestPolly = async (polly, params) => {
  const response = await polly.synthesizeSpeech(params).promise();
  return response;
};
