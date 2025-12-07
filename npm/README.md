# DataCube SDK

SDK oficial para integração com a plataforma **DataCube**, permitindo executar fluxos, consultar status, gerenciar integrações e acessar dados de maneira padronizada.

---

## 📦 Instalação

Você pode instalar usando **npm**, **yarn** ou **pnpm** — todos utilizam o mesmo registro do npm.

```bash
NPM  →  npm install datacube-sdk
YARN →  yarn add datacube-sdk
PNPM →  pnpm add datacube-sdk
```




## 📦 JAVASCRIPT
// example.js
```
import { DataCubeClient } from "datacube-sdk";
const client = new DataCubeClient({apiKey: "sdc_{YOUR_API_TOKEN_HERE}..."});

// Exibe lista de métodos e fluxos disponíveis
client.help();
```

## 📦 TYPESCRIPT
// example.ts
```
import { DataCubeClient } from "datacube-sdk";
const client = new DataCubeClient({apiKey: "sdc_{YOUR_API_TOKEN_HERE}..."});

(async () => {
    // Exibe lista de métodos e fluxos disponíveis
    await client.help();
})();
```

## 📦 ESM
// example.mjs
```
import { DataCubeClient } from "datacube-sdk";
const client = new DataCubeClient({apiKey: "sdc_{YOUR_API_TOKEN_HERE}..."});

// Exibe lista de métodos e fluxos disponíveis
await client.help();
```

## 📦 CJS
// example.cjs
```
const { DataCubeClient } = require("datacube-sdk");
const client = new DataCubeClient({apiKey: "sdc_{YOUR_API_TOKEN_HERE}..."});

(async () => {
    // Exibe lista de métodos e fluxos disponíveis
    await client.help();
})();
```




📚 Como chamar fluxos

O SDK suporta 3 formas de execução:

1️⃣ Chamada direta (slug)
```
await client.myExapleFlow({
    cpf: "123"
});
```

2️⃣ Chamada via provider
```
await client.consultasdeveiculos.consultaCnhParanaCompleta({
    cpf: "123",
    numeroRegistro: "123",
    dataValidade: "01/01/2030"
});
```

3️⃣ Chamada via ID do fluxo
```
await client["consulta-cnh-paran-completa-1764938995458-45nr1u"]({
    cpf: "123",
    numeroRegistro: "123",
    dataValidade: "01/01/2030"
});
```


🆕 Versão opcional (param extra)
```
Todos os métodos aceitam um segundo parâmetro opcional, que será enviado como "version":
await client.myExapleFlow(
    { cpf: "123" },
    "1.0.23"
);
```
Ou pelo ID:
```
await client["my-example-flow-1999999999458-45nr1u"](
    { cpf: "123" },
    "1.0.23"
);
```

📘 Help automático
Execute:
```
client.help();
```

