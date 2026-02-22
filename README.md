# Math Quiz MCP App

An MCP (Model Context Protocol) app that displays an interactive 6th grade math quiz **embedded within Claude.ai conversations**. Your son can ask Claude for a math quiz, and the UI renders inline—no separate browser window.

## Features

- **Embedded UI**: Quiz renders directly in the Claude.ai chat
- **Score tracking**: Correct/incorrect count at the top
- **Instant feedback**: Selecting an answer reveals correct/incorrect + explanation
- **Scrollable list**: All questions visible at once; answer in any order

## How It Works

1. Your son asks Claude: *"Give me 10 6th grade math questions with 4 answer choices"*
2. Claude generates the questions and calls the `display_math_quiz` tool with them
3. The quiz UI renders inline in the conversation
4. Your son selects answers; feedback and explanations appear immediately

## Prerequisites

- Node.js 18+
- Claude.ai account (or Claude Desktop) with MCP Apps support

## Installation

```bash
cd math-quiz-mcp-app
npm install
npm run build
```

## Configuration for Claude.ai

### Option A: Claude.ai (Web)

Claude.ai uses **Streamable HTTP** for MCP connectors. You need to expose your MCP server via a public URL. Options:

1. **ngrok** (local dev): `ngrok http 3001` → use the HTTPS URL
2. **Cloudflare Tunnel**: `cloudflared tunnel --url http://localhost:3001`
3. **Deploy** to a cloud provider (Railway, Render, etc.)

In Claude.ai: **Settings → Connectors → Add connector** → Enter your MCP server URL (e.g. `https://your-ngrok-url.ngrok.io/mcp`).

### Option B: Claude Desktop (Local)

Add to your MCP config (`claude_desktop_config.json` on macOS/Linux, or via Claude Desktop settings on Windows):

```json
{
  "mcpServers": {
    "math-quiz": {
      "command": "node",
      "args": ["C:/path/to/math-quiz-mcp-app/dist/main.js", "--stdio"]
    }
  }
}
```

Replace the path with your actual project path.

## Running the Server

**HTTP mode** (for Claude.ai web connector):

```bash
npm start
# Server listens on http://localhost:3001/mcp
```

**Stdio mode** (for Claude Desktop):

```bash
npm run start:stdio
```

## Development

```bash
npm run dev
```

This runs the UI watcher and HTTP server. After changing the React UI, the bundle rebuilds automatically.

## Usage

Once connected, ask Claude:

- *"Give my son 10 6th grade math questions with 4 multiple choice answers"*
- *"Create a 5-question math quiz for 6th grade on fractions"*

Claude will generate the questions and call the tool. The quiz UI will appear inline. Click an answer to see if it's correct and read the explanation.

## Project Structure

```
math-quiz-mcp-app/
├── server.ts       # MCP server + display_math_quiz tool
├── main.ts         # HTTP + stdio entry point
├── mcp-app.html    # UI entry HTML
├── src/
│   ├── mcp-app.tsx # Quiz React component
│   ├── types.ts    # MathQuestion type
│   ├── quiz.module.css
│   └── global.css
├── dist/           # Build output
└── package.json
```

## Tool Schema

The `display_math_quiz` tool expects Claude to pass:

```json
{
  "questions": [
    {
      "id": 1,
      "question": "What is 2/3 + 1/6?",
      "options": ["1/2", "5/6", "3/9", "1"],
      "correctIndex": 1,
      "explanation": "Find a common denominator (6): 4/6 + 1/6 = 5/6."
    }
  ]
}
```

- `correctIndex`: 0–3 (which option is correct)
- `explanation`: Shown after the student selects an answer

## License

MIT
