export async function analyzeImage(imageBuffer: string, mimeType: string, prompt: string) {
  try {
    // @ts-ignore
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyDnr4Mgix440arZr6qfaCPDYaehI0lPNps";

    // Probing endpoints for stability
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
    ];

    const payload = {
      contents: [{
        parts: [
          { text: prompt + "\n\nExplain step by step in Hindi and English mix. Be a personal tutor." },
          { inline_data: { mime_type: mimeType, data: imageBuffer } }
        ]
      }]
    };

    let result = null;
    let success = false;

    for (const url of endpoints) {
      try {
        console.log(`Suvidha AI Engine Probing: ${url.split('v1')[1].split('?')[0]}`);
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.candidates && data.candidates[0].content) {
          result = data.candidates[0].content.parts[0].text;
          success = true;
          break;
        }
      } catch (e) {
        console.error("Local Probe Error:", e);
      }
    }

    if (!success) {
      throw new Error("Unable to process image. Model or API key mismatch.");
    }

    return result;
  } catch (error) {
    console.error("Critical Engine Error:", error);
    throw error;
  }
}
