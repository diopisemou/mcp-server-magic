// Simple test script for Go server generation
import { generateGoServer } from '../src/utils/serverTemplates/goServer';

// Test configuration
const testConfig = {
    name: "Test Go MCP Server",
    description: "A test MCP server in Go",
    language: "Go" as const,
    authentication: {
        type: "API Key" as const,
        location: "header" as const,
        name: "X-API-Key"
    },
    hosting: {
        provider: "Self-hosted" as const,
        type: "Container" as const,
        region: "us-east-1"
    },
    endpoints: [
        {
            id: "1",
            path: "/api/users",
            method: "GET" as const,
            description: "Get all users",
            parameters: [],
            responses: [],
            mcpType: "resource" as const
        },
        {
            id: "2",
            path: "/api/users/{userId}",
            method: "GET" as const,
            description: "Get user by ID",
            parameters: [{ name: "userId", type: "string", required: true, description: "User ID" }],
            responses: [],
            mcpType: "resource" as const
        },
        {
            id: "3",
            path: "/api/users",
            method: "POST" as const,
            description: "Create user",
            parameters: [],
            responses: [],
            mcpType: "tool" as const
        }
    ]
};

// Main function to run the test
function runTest() {
    console.log("Generating Go MCP server...");
    const result = generateGoServer(testConfig);

    if (result.success) {
        console.log(`✅ Server generation successful! Generated ${result.files?.length || 0} files`);

        // List files
        console.log("\nGenerated files:");
        result.files?.forEach(file => {
            console.log(`- ${file.name} (${file.type})`);
        });

        // Show file content example
        const mainFile = result.files?.find(f => f.name === "main.go");
        if (mainFile) {
            console.log("\nExample file (main.go):");
            console.log("---------------------");
            console.log(mainFile.content.substring(0, 300) + "...");
        }

        console.log("\n✅ Test completed!");
    } else {
        console.error("❌ Server generation failed:", result.error);
    }
}

// Run the test
runTest();
