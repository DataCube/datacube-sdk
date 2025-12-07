import { DataCubeClient } from 'datacube-sdk';
const client = new DataCubeClient({apiKey:"sdc_{YOUR_API_TOKEN_HERE}..."});

//Funções nativas da API
client.help();
//console.log(await client.getStatus());
//console.log(await client.me());
//
////console.log(await client.testeMeu({ cpf: "123" }));
//
//console.log(await client.consultasdeveiculos.consultaCnhParanaCompleta({ cpf:"123", numeroRegistro:"123", dataValidade:'25/04/2033' }));
//console.log(await client["consulta-cnh-paran-completa-1764938995458-45nr1u"]({ cpf:"123", numeroRegistro:"123", dataValidade:'25/04/2033' }));
