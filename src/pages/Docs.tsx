
import React from 'react';

import { Footer } from "@/components/ui/footer";

export default function Docs() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="container py-10 flex-1">
        <h1 className="text-3xl font-bold mb-6">MCP Server Generator Documentation</h1>
        
        <div className="grid gap-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <p className="mb-4">
              The MCP Server Generator is a tool that allows you to create Machine-Callable Program (MCP) servers 
              from your API definitions. This enables AI models to interact with your services through a standardized interface.
            </p>
            <p>
              To get started, upload your API definition file (OpenAPI, Swagger, RAML, or API Blueprint) or use one of our templates.
            </p>
          </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Support for multiple API definition formats</li>
            <li>Automatic endpoint detection and categorization</li>
            <li>Customizable server configuration</li>
            <li>Code generation for multiple languages and frameworks</li>
            <li>Deployment guides and integrations</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">API Definition Formats</h2>
          <p className="mb-4">
            We support the following API definition formats:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>OpenAPI 2.0/3.0</strong> (formerly known as Swagger) - The most widely used API description format</li>
            <li><strong>RAML</strong> - RESTful API Modeling Language</li>
            <li><strong>API Blueprint</strong> - Markdown-based API description format</li>
          </ul>
        </section>
      </div>
      <Footer />
    </div>
  );
}
