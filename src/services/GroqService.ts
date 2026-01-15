export class GroqService {
    private static apiKey = import.meta.env.VITE_GROQ_API_KEY;
    private static apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

    static async generate(messages: { role: string; content: string }[], temperature: number = 0.7, jsonMode: boolean = true) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: messages,
                    temperature: temperature,
                    response_format: jsonMode ? { type: "json_object" } : undefined
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Groq API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            console.error('Groq Generation Failed:', error);
            throw error;
        }
    }
}
