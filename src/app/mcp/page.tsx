import Link from "next/link";

export const metadata = {
  title: "MCP Server | Clarityx402",
  description:
    "Give your AI agents the ability to find the best x402 endpoint for any task",
};

export default function MCPPage() {
  return (
    <div className="space-y-16 max-w-4xl mx-auto">
      {/* Hero */}
      <section className="space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse-dot" />
          <span className="text-xs font-medium text-accent">
            Model Context Protocol
          </span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl tracking-tight">
          <span className="text-gradient">MCP Server</span>
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Give your AI agents the ability to find the best x402 endpoint for any
          task. Compare pricing, uptime, and latency—all through natural
          conversation.
        </p>

        <div className="flex flex-wrap gap-3">
          <a
            href="https://www.npmjs.com/package/clarityx402-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-neural inline-flex items-center gap-2"
          >
            <NpmIcon className="w-4 h-4" />
            View on npm
          </a>
          <a
            href="https://github.com/tonbistudio/clarityx402/tree/main/mcp-server"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost-neural inline-flex items-center gap-2"
          >
            <GitHubIcon className="w-4 h-4" />
            Source Code
          </a>
        </div>
      </section>

      {/* Compatibility */}
      <section className="space-y-6">
        <SectionHeader
          title="Compatibility"
          subtitle="Works with any MCP-compatible AI client"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: "Claude Desktop", status: "Native support" },
            { name: "Cursor IDE", status: "Built-in MCP" },
            { name: "Continue", status: "VS Code extension" },
            { name: "Cline", status: "VS Code extension" },
          ].map((client) => (
            <div key={client.name} className="card-neural p-4">
              <p className="font-medium text-sm">{client.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {client.status}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Installation */}
      <section className="space-y-6">
        <SectionHeader title="Installation" />

        <div className="space-y-4">
          <div className="card-static p-6 space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-display">
                1
              </span>
              Install the package
            </h3>
            <CodeBlock code="npm install -g clarityx402-mcp" />
          </div>

          <div className="card-static p-6 space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-display">
                2
              </span>
              Add to your AI client config
            </h3>
            <p className="text-sm text-muted-foreground">
              For Claude Desktop, edit your{" "}
              <code className="px-1.5 py-0.5 rounded bg-secondary text-xs font-mono">
                claude_desktop_config.json
              </code>
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Windows:</strong>{" "}
                <code className="font-mono">%APPDATA%\Claude\claude_desktop_config.json</code>
              </p>
              <p>
                <strong>macOS:</strong>{" "}
                <code className="font-mono">
                  ~/Library/Application Support/Claude/claude_desktop_config.json
                </code>
              </p>
            </div>
            <CodeBlock
              code={`{
  "mcpServers": {
    "clarityx402": {
      "command": "clarityx402-mcp"
    }
  }
}`}
            />
          </div>

          <div className="card-static p-6 space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-display">
                3
              </span>
              Start chatting
            </h3>
            <p className="text-sm text-muted-foreground">
              Restart your AI client and start asking about x402 endpoints!
            </p>
          </div>
        </div>

        {/* Alternative: npx */}
        <div className="card-neural p-6 space-y-4">
          <div className="flex items-center gap-2">
            <LightningIcon className="w-4 h-4 text-accent" />
            <h3 className="font-medium text-sm">Quick start with npx</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            No installation required—use npx to run directly:
          </p>
          <CodeBlock
            code={`{
  "mcpServers": {
    "clarityx402": {
      "command": "npx",
      "args": ["-y", "clarityx402-mcp"]
    }
  }
}`}
          />
        </div>
      </section>

      {/* Available Tools */}
      <section className="space-y-6">
        <SectionHeader
          title="Available Tools"
          subtitle="5 tools for endpoint intelligence"
        />

        <div className="space-y-4">
          <ToolCard
            name="find_best_endpoint"
            description="Find the optimal x402 endpoint for a given task based on quality score, price, and uptime."
            params={[
              { name: "task", type: "string", required: true, desc: 'Category like "llm-inference", "image-generation"' },
              { name: "budget", type: "number", required: false, desc: "Max price in micro USDC" },
              { name: "min_uptime", type: "number", required: false, desc: "Minimum uptime % (default: 90)" },
            ]}
          />

          <ToolCard
            name="compare_endpoints"
            description="Compare endpoints within a category with ranked quality scores."
            params={[
              { name: "category", type: "string", required: true, desc: "Category to compare" },
              { name: "sort", type: "string", required: false, desc: '"score", "price", "uptime", or "latency"' },
            ]}
          />

          <ToolCard
            name="check_endpoint_health"
            description="Get current health status of a specific endpoint by URL."
            params={[
              { name: "url", type: "string", required: true, desc: "Full URL of the x402 endpoint" },
            ]}
          />

          <ToolCard
            name="get_price_history"
            description="Historical pricing data for trend analysis."
            params={[
              { name: "endpoint_id", type: "string", required: true, desc: "Endpoint ID" },
              { name: "days", type: "number", required: false, desc: "Days of history (default: 30)" },
            ]}
          />

          <ToolCard
            name="list_categories"
            description="List all available endpoint categories with counts."
            params={[]}
          />
        </div>
      </section>

      {/* Example Prompts */}
      <section className="space-y-6">
        <SectionHeader
          title="Example Prompts"
          subtitle="Try these with your AI assistant"
        />

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            "Find me the best LLM inference endpoint under $0.01 per request",
            "Compare all image generation endpoints by uptime",
            "What's the cheapest search API with at least 95% uptime?",
            "Check if api.example.com/v1/chat is healthy",
            "Show me price trends for the top DeFi endpoint",
            "What categories of x402 endpoints are available?",
          ].map((prompt, i) => (
            <div key={i} className="card-neural p-4 group">
              <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                &ldquo;{prompt}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Self-hosting */}
      <section className="space-y-6">
        <SectionHeader
          title="Configuration"
          subtitle="Advanced options"
        />

        <div className="card-static p-6 space-y-4">
          <h3 className="font-medium">Custom API URL</h3>
          <p className="text-sm text-muted-foreground">
            By default, the server connects to{" "}
            <code className="px-1.5 py-0.5 rounded bg-secondary text-xs font-mono">
              https://clarityx402.vercel.app
            </code>
            . To use your own instance:
          </p>
          <CodeBlock
            code={`{
  "mcpServers": {
    "clarityx402": {
      "command": "clarityx402-mcp",
      "env": {
        "CLARITYX402_API_URL": "https://your-instance.com"
      }
    }
  }
}`}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="card-static p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="relative space-y-4">
          <h2 className="font-display text-2xl">Ready to get started?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Install the MCP server and give your AI agents superpowers for
            finding the best x402 endpoints.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link href="/endpoints" className="btn-neural">
              Browse Endpoints
            </Link>
            <a
              href="https://modelcontextprotocol.io"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost-neural"
            >
              Learn about MCP
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

// Components

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-1">
      <h2 className="font-display text-xl">{title}</h2>
      {subtitle && (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative group">
      <pre className="bg-[#0a0a0a] border border-border/50 rounded-lg p-4 overflow-x-auto">
        <code className="text-sm font-mono text-emerald-400">{code}</code>
      </pre>
    </div>
  );
}

function ToolCard({
  name,
  description,
  params,
}: {
  name: string;
  description: string;
  params: { name: string; type: string; required: boolean; desc: string }[];
}) {
  return (
    <div className="card-static p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-mono text-primary font-medium">{name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <ToolIcon className="w-5 h-5 text-muted-foreground shrink-0" />
      </div>

      {params.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Parameters
          </p>
          <div className="space-y-2">
            {params.map((param) => (
              <div
                key={param.name}
                className="flex items-start gap-3 text-sm"
              >
                <code className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded shrink-0">
                  {param.name}
                </code>
                <span className="text-muted-foreground text-xs">
                  {param.required && (
                    <span className="text-red-400 mr-1">*</span>
                  )}
                  <span className="text-accent">{param.type}</span>
                  {" — "}
                  {param.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Icons

function NpmIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LightningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );
}

function ToolIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
