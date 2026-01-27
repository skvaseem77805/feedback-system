'use client';

import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, Copy, Download, Zap, AlertCircle, Code2, Eye } from 'lucide-react';

interface GeneratedCode {
  code: string;
  language: string;
  timestamp: number;
}

export default function AIGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generateCode = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate code');
      }

      const data = await response.json();
      setGeneratedCode({
        code: data.code,
        language: data.language || 'jsx',
        timestamp: Date.now(),
      });
      
      // Auto-render preview for JSX/HTML
      if (data.language === 'jsx' || data.language === 'html') {
        setActiveTab('preview');
        renderPreview(data.code, data.language);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating code');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPreview = (code: string, language: string) => {
    if (!iframeRef.current) return;

    let htmlContent = '';

    if (language === 'jsx' || language === 'javascript') {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            #root { min-height: 100vh; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel">
            ${code}
            const root = ReactDOM.createRoot(document.getElementById('root'));
            if (typeof App !== 'undefined') {
              root.render(<App />);
            }
          </script>
        </body>
        </html>
      `;
    } else {
      htmlContent = code;
    }

    iframeRef.current.srcdoc = htmlContent;
  };

  const copyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode.code);
    }
  };

  const downloadCode = () => {
    if (!generatedCode) return;

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(generatedCode.code)}`);
    element.setAttribute('download', `code.${generatedCode.language === 'jsx' ? 'jsx' : 'html'}`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10">
      <Navbar />

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">AI Code Generator</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Describe what you want to build. Our AI will generate the code and show you a live preview.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <Card className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Describe what you want to build
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      setError('');
                    }}
                    placeholder="e.g., Create a beautiful card component with an image, title, and description. Add hover effects."
                    className="w-full h-40 p-4 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={generateCode}
                  disabled={isLoading || !prompt.trim()}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Send className="w-4 h-4" />
                  {isLoading ? 'Generating...' : 'Generate Code'}
                </Button>
              </Card>

              {/* Quick Examples */}
              <Card className="p-6 space-y-4">
                <h3 className="font-semibold">Quick Examples</h3>
                <div className="space-y-2">
                  {[
                    'Create a hero section with title and CTA button',
                    'Build a testimonials carousel component',
                    'Make a pricing table with feature checklist',
                    'Design a contact form with validation'
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => setPrompt(example)}
                      className="text-left p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Output Section */}
            <div className="space-y-6">
              {generatedCode ? (
                <>
                  {/* Tabs */}
                  <div className="flex gap-2 border-b">
                    <button
                      onClick={() => setActiveTab('code')}
                      className={`px-4 py-2 font-medium text-sm transition-colors ${
                        activeTab === 'code'
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Code2 className="w-4 h-4 inline mr-2" />
                      Code
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('preview');
                        renderPreview(generatedCode.code, generatedCode.language);
                      }}
                      className={`px-4 py-2 font-medium text-sm transition-colors ${
                        activeTab === 'preview'
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Eye className="w-4 h-4 inline mr-2" />
                      Preview
                    </button>
                  </div>

                  {/* Content */}
                  {activeTab === 'code' ? (
                    <Card className="p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground font-mono">
                          {generatedCode.language}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            onClick={copyCode}
                            variant="outline"
                            size="sm"
                            className="gap-2 bg-transparent"
                          >
                            <Copy className="w-4 h-4" />
                            Copy
                          </Button>
                          <Button
                            onClick={downloadCode}
                            variant="outline"
                            size="sm"
                            className="gap-2 bg-transparent"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                      </div>

                      <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono">
                        <code>{generatedCode.code}</code>
                      </pre>
                    </Card>
                  ) : (
                    <Card className="p-6 overflow-hidden">
                      <iframe
                        ref={iframeRef}
                        className="w-full h-96 rounded-lg border"
                        title="Code Preview"
                        sandbox="allow-scripts"
                      />
                    </Card>
                  )}
                </>
              ) : (
                <Card className="p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-96">
                  <Code2 className="w-16 h-16 text-muted-foreground/50" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Generated code will appear here</h3>
                    <p className="text-muted-foreground">
                      Write a prompt and click generate to see your code and preview
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
