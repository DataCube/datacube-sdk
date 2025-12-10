const { DataCubeClient } = require("datacube-sdk");
const client = new DataCubeClient({ apiKey: "sdc_{YOUR_API_TOKEN_HERE}..." });

client.help();
//client.getStatus().then((obj) => {console.log(obj)});
//client.me().then((obj) => {console.log(obj)});
//
//client["teste-meu-1765010906589-46sxz2"]({ cpf: "123" }).then((obj) => {console.log(obj)});
//client.testeMeu({ cpf: "123" }).then((obj) => {console.log(obj)});
//
//client["consultasdeveiculos-cnh-parana-completa"]({ cpf:"123", numeroRegistro:"123", dataValidade:'25/04/2033' }).then((obj) => {console.log(obj)});
//client.consultasdeveiculos.consultaCnhParanaCompleta({ cpf:"123", numeroRegistro:"123", dataValidade:'25/04/2033' }).then((obj) => {console.log(obj)});

//client["teste-1765010906589-46sxz2"]({ cpf: "123" }).then((obj) => {console.log(obj)});
//client.teams.teamfoiiii.teste({ cpf: "123" }).then((obj) => {console.log(obj)});

