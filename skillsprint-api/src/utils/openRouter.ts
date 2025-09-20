import axios from 'axios';

export async function generateTasksWithOpenRouter(goal: string, duration: number) {
  const prompt = `
You are a helpful assistant that generates structured learning plans.

Break down the goal "${goal}" into a ${duration}-day learning plan.

Respond ONLY with a valid JSON array like:
[
  { "day": 1, "title": "Intro to React", "description": "Learn JSX and components", "resources": ["React docs", "freeCodeCamp"] },
  ...
]

Do not include any explanation, greeting, or formatting outside the JSON.
`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'SkillSprint'
        }
      }
    );

    const raw = response.data.choices[0].message.content;
    console.log("Raw model output:", raw);

    const match = raw.match(/\[\s*{[\s\S]*?}\s*]/);
    if (!match) throw new Error("No valid JSON array found in response");

    return JSON.parse(match[0]);
  } catch (err: any) {
    console.error("OpenRouter error:", err.response?.data || err.message);
    throw err;
  }
}
