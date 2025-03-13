
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          © {new Date().getFullYear()} MCP Server Generator. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link to="/" className="text-sm text-muted-foreground hover:underline">
            Home
          </Link>
          <Link to="/docs" className="text-sm text-muted-foreground hover:underline">
            Docs
          </Link>
          <a 
            href="https://github.com/yourusername/mcp-server-generator" 
            target="_blank" 
            rel="noreferrer"
            className="text-sm text-muted-foreground hover:underline"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
