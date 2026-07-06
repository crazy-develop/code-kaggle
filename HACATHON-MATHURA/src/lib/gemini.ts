export async function analyzeImage(imageBuffer: string, mimeType: string, prompt: string) {
  try {
    const url = 'http://localhost:3001/api/analyze';
    console.log(`Suvidha AI Engine connecting to Secure Backend at: ${url}`);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt,
        mimeType: mimeType,
        imageBuffer: imageBuffer
      })
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "Unable to process image on backend.");
    }

    return data.result;
  } catch (error) {
    console.error("Critical Engine Error:", error);
    throw error;
  }
}
