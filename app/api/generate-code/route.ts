import { generateText } from 'ai';
import anthropic from 'anthropic'; // Declare the anthropic variable

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || prompt.trim().length === 0) {
      return Response.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert code generator. Generate clean, well-commented, production-ready code based on user prompts.

IMPORTANT RULES:
1. Generate ONLY the code, no explanations or markdown
2. For UI components, generate React/JSX code
3. Use Tailwind CSS for styling (include className attributes)
4. Make sure React components export a default App component
5. Keep code concise but readable
6. Include helpful comments

Example output format for React:
export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Your component here */}
    </div>
  );
}`;

    const { text } = await generateText({
      model: 'openai/gpt-4-mini',
      system: systemPrompt,
      prompt: `Generate React/JSX code for: ${prompt}`,
      temperature: 0.7,
      maxTokens: 2000,
    });

    return Response.json({
      code: text.trim(),
      language: 'jsx',
    });
  } catch (error) {
    console.error('Code generation error:', error);
    return Response.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate code',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
