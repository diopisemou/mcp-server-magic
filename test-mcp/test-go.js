// Simple test script for Go server generation
const { generateGoServer } = require('../src/utils/serverTemplates/goServer');

// Test configuration
const testConfig = {
    name: "Test Go MCP Server",
    description: "A test MCP server in Go",
    language: "Go",
    authentication: {
        type: "API Key",
        location: "header",
        name: "X-API-Key"
    },
    hosting: {
        provider: "Self-hosted",
        type: "Container",
        region: "us-east-1"
    },
    endpoints: [
        {
            id: "1",
            path: "/api/users",
            method: "GET",
            description: "Get all users",
            parameters: [],
            responses: [],
            mcpType: "resource"
        },
        {
            id: "2",
            path: "/api/users/{userId}",
            method: "GET",
            description: "Get user by ID",
            parameters: [{ name: "userId", type: "string", required: true, description: "User ID" }],
            responses: [],
            mcpType: "resource"
        },
        {
            id: "3",
            path: "/api/users",
            method: "POST",
            description: "Create user",
            parameters: [],
            responses: [],
            mcpType: "tool"
        }
    ]
};

// Generate server
console.log("Generating Go MCP server...");
const result = generateGoServer(testConfig);

if (result.success) {
    console.log(`✅ Server generation successful! Generated ${result.files.length} files`);

    // List files
    console.log("\nGenerated files:");
    result.files.forEach(file => {
        console.log(`- ${file.name} (${file.type})`);
    });

    // Show file content example
    const mainFile = result.files.find(f => f.name === "main.go");
    if (mainFile) {
        console.log("\nExample file (main.go):");
        console.log("---------------------");
        console.log(mainFile.content.substring(0, 300) + "...");
    }

    console.log("\n✅ Test completed!");
} else {
    console.error("❌ Server generation failed:", result.error);
}
