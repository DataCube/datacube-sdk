const { DataCubeClient } = require("datacube-sdk");

// Initialize the client with your API key
const client = new DataCubeClient({ apiKey: "sdc_{YOUR_API_TOKEN_HERE}" });

// Display available commands and flows
client.help();

// --- Native Methods ---
//    client.getStatus().then(console.log);
//    client.getUsage().then(console.log);
//    client.me().then(console.log);
//    client.executionStatus("execution-id").then(console.log); // Check status of an async execution
//
//    --- Manual Execution ---
//    Execute a flow by ID manually. Useful if you have the ID stored in a variable.
//    client.execute({
//      flow_id: "consulta-cnh-completa-1764938995458-45nr1u",
//      inputs: { cpf: "123" },
//      version: null // Optional: specific version string
//    }).then(console.log);



// --- Official Flows ---
// Call flows directly. 'inputs' is an object matching the flow's requirements.
// 'version' is optional (default: null).
// client["consulta-cnh-completa"]({ cpf: "123" }, null).then(console.log); // [Recommended]
// client.datacube.consultaCnhCompleta({ cpf: "123" }, null).then(console.log);

// --- Provider Flows ---
// client["consultasdeveiculos-cnh-parana-completa"]({cpf: "123", numeroRegistro: "123", dataValidade: "25/04/2033"}).then(console.log); // [Recommended]
// client.consultasdeveiculos.consultaCnhParanaCompleta({cpf: "123", numeroRegistro: "123", dataValidade: "25/04/2033"}).then(console.log);

// --- Personal Flows ---
// client["test-my-flow-1765010906589-46sxz2"]({ cpf: "123" }).then(console.log); // [Recommended]
// client.testMyFlow({ cpf: "123" }).then(console.log);

// --- Team Flows ---
// client["teste-1765010906589-46sxz2"]({ cpf: "123" }).then(console.log); // [Recommended]
// client.teams.teamfoiiii.teste({ cpf: "123" }).then(console.log);
