const { DataCubeClient } = require("datacube-sdk");
const client = new DataCubeClient({ apiKey: "sdc_{YOUR_API_TOKEN_HERE}..." });

client.help();
//client.getStatus().then(console.log);
//client.me().then(console.log);
//
//client["teste-meu-1765010906589-46sxz2"]({ cpf: "123" }).then(console.log);
//client.testeMeu({ cpf: "123" }).then(console.log);
//
//client["consultasdeveiculos-cnh-parana-completa"]({ cpf:"123", numeroRegistro:"123", dataValidade:'25/04/2033' }).then(console.log);
//client.consultasdeveiculos.consultaCnhParanaCompleta({ cpf:"123", numeroRegistro:"123", dataValidade:'25/04/2033' }).then(console.log);

//client["teste-1765010906589-46sxz2"]({ cpf: "123" }).then(console.log);
//client.teams.teamfoiiii.teste({ cpf: "123" }).then(console.log);

