const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

async function main() {
  try {
    const completion = await openai.chat.completions.create({
      model: "minimax-m2.7",
      messages: [{ role: "system", content: "Hello" }],
      temperature: 0.7,
      max_tokens: 1024,
    });

    console.log(JSON.stringify(completion, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
  }
}

main();
