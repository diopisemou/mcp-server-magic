# MCP Server Marketplace

The MCP Server Marketplace is a feature that allows users to share and discover MCP servers. This document describes the implementation of the marketplace feature.

## Features

- Browse, search, and filter MCP servers
- Submit external MCP servers to the marketplace
- Publish generated MCP servers to the marketplace
- View installation instructions for different platforms (Cline, Claude, Windsurf)
- Star and download servers
- Track popularity through stars and download counts

## Technical Implementation

### Database Schema

The marketplace uses the following database tables:

- `marketplace_listings`: Stores information about MCP servers in the marketplace
- `marketplace_capabilities`: Stores capabilities (resources and tools) of marketplace servers
- `deployments`: Updated with an `is_public` flag to indicate if a deployment is published to the marketplace

### Components

- `PublishToMarketplace`: Component for publishing generated servers to the marketplace
- `SubmitServerModal`: Component for submitting external MCP servers to the marketplace
- Updated `Marketplace` page to display real marketplace listings with filtering and sorting
- Updated `MarketplaceDetail` page to show detailed information about a server

### Backend Functions

- Supabase functions for increment/decrement operations (stars, downloads)
- Database stored procedures for atomic counter operations

## User Flows

### Publishing a Server

1. User generates an MCP server using the platform
2. After successful generation, user clicks "Publish to Marketplace"
3. User fills out marketplace listing details (title, description, author, version, tags)
4. System automatically extracts capabilities from the generated server
5. System generates installation instructions for different platforms
6. Server is published to the marketplace

### Submitting an External Server

1. User clicks "Submit Server" on the marketplace page
2. User fills out server details (title, description, author, version, server URL, tags)
3. User adds capabilities (resources and tools) manually
4. Server is submitted to the marketplace

### Browsing the Marketplace

1. User visits the marketplace page
2. User can search by keywords, filter by tags, and sort by various criteria
3. User can click on a server to view details

### Using a Marketplace Server

1. User views the server details
2. User can star the server to mark it as a favorite
3. User can download the server package
4. User can view installation instructions for different platforms
5. User can copy the configuration for their preferred platform

## Installation Instructions Format

The marketplace provides installation instructions for several platforms:

### Cline

```json
{
  "mcpServers": {
    "server-name": {
      "command": "curl",
      "args": ["-s", "https://server-url"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Claude

```json
{
  "tools": [
    {
      "name": "server-name",
      "url": "https://server-url",
      "auth": {
        "type": "none"
      }
    }
  ]
}
```

### Windsurf

```json
{
  "mcpServer": {
    "name": "Server Name",
    "endpoint": "https://server-url",
    "auth": "none"
  }
}
