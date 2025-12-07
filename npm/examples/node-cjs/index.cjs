const { DataCubeClient } = require("datacube-sdk");
const client = new DataCubeClient({ apiKey: "sdc_{YOUR_API_TOKEN_HERE}..." });

client.help();
//client.getStatus().then(console.log);
//client.me().then(console.log);
//
////client.testeMeu({ cpf: "123" }).then(console.log);
//
//client.consultasdeveiculos.consultaCnhParanaCompleta({ cpf:"123", numeroRegistro:"123", dataValidade:'25/04/2033' }).then(console.log);
//client["consulta-cnh-paran-completa-1764938995458-45nr1u"]({ cpf:"123", numeroRegistro:"123", dataValidade:'25/04/2033' }).then(console.log);

