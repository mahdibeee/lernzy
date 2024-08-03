const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

async function getSummary(content) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key is not set. Please check your .env file.");
  }

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: `Summary:\n[Provide a concise summary of the key points made in the content, highlighting the main topic and any significant findings or insights.]\n\nHighlights:\n\n[🧠] Key Point 1: [Summarize a major point made in the transcript related to the main topic.]\n[📚] Key Point 2: [Summarize another major point, especially one related to practice or behavior.]\n[🔄] Key Point 3: [Highlight any points about variability, personalized approaches, or individual differences.]\n[🧩] Key Point 4: [Summarize any scientific or technical findings, such as biomarkers or other crucial factors.]\n[🏫] Key Point 5: [Summarize points related to education, learning, or teaching strategies.]\n[💪] Key Point 6: [Highlight any advice or points about healthy practices or positive behaviors.]\n[🎵] Key Point 7: [Summarize points about personal understanding or application of the topic.]\n\nKey Insights:\n\n[🧬] Insight 1: [Provide an insight about the primary mechanism or driver discussed, such as behavior or practice.]\n[🎯] Insight 2: [Summarize insights related to the need for personalized or tailored approaches.]\n[🔍] Insight 3: [Highlight any insights about predictive factors or biomarkers, if applicable.]\n[🔄] Insight 4: [Provide insights about personalized learning or individualized approaches.]\n[💡] Insight 5: [Summarize insights about the impact of positive vs. negative changes or behaviors.]\n[🧠] Insight 6: [Highlight any insights about continuous adaptation, learning, or improvement.]\n\nContent:\n\n${content}`,
        },
      ],
      max_tokens: 1500,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  const result = response.data.choices[0].message.content.trim();
  console.log("API Response:", result); // Log the full response for debugging

  const summarySection = result.includes("Highlights:")
    ? result.split("Highlights:")[0].trim()
    : result;
  const keyPointsSection =
    result.includes("Highlights:") && result.includes("Key Insights:")
      ? result.split("Highlights:")[1].split("Key Insights:")[0].trim()
      : "";
  const keyInsightsSection = result.includes("Key Insights:")
    ? result.split("Key Insights:")[1].trim()
    : "";

  console.log("Summary Section:", summarySection); // Log the summary section
  console.log("Key Points Section:", keyPointsSection); // Log the key points section
  console.log("Key Insights Section:", keyInsightsSection); // Log the key insights section

  return {
    summary: summarySection,
    keyPoints: keyPointsSection,
    keyInsights: keyInsightsSection,
  };
}

module.exports = {
  getSummary,
};
