export class DataCubeClient {
    constructor(config) {
        this.apiUrl = "https://api.datacube.com.br/v1/";
        this.apiKey = config.apiKey;
        this.flows = [];

        return this.#buildRootProxy();
    }

    async request(path, options = {}) {
        const res = await fetch(this.apiUrl + path, {
            ...options,
            headers: {
                "X-Api-Key": this.apiKey,
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

        if (!res.ok) {
            throw new Error(`Request failed ${res.status}`);
        }
        return res.json();
    }

    getFlows() {
        if (!this.flows.length) {
            this.flows = [
                {
                    id: "consulta-cnh-paran-completa-1764938995458-45nr1u",
                    provider: "consultasdeveiculos",
                    slug: "ConsultaCnhParanaCompleta"
                },
                {
                    id: "teste-meu-1765010906589-46sxz2",
                    provider: null,
                    slug: "testeMeu"
                },
                {
                    id: "teste-meu-1765010906589-46sxz2",
                    provider: null,
                    slug: "ConsultaCnhParanaCompleta"
                }
            ];
        }
        return this.flows;
    }

    getStatus() { return this.request("status"); }
    getUsage() { return this.request("usage"); }
    me() { return this.request("me"); }
    execute(body) { return this.request("execute", { method: "POST", body: JSON.stringify(body) }); }
    executionStatus(id) { return this.request(`execute/${id}`); }


    // ---------------------------------------------------------------------
    // HELP METHOD
    // ---------------------------------------------------------------------
    help() {
        const flows = this.getFlows();

        const nativeMethods = [
            "getStatus()",
            "getUsage()",
            "me()",
            "execute(body)",
            "executionStatus(id)",
            "help()"
        ];

        const normalize = v => v?.toLowerCase().replace(/_/g, "-");

        const directs = flows.filter(f => !f.provider);
        const providers = {};

        flows.forEach(f => {
            if (f.provider) {
                if (!providers[f.provider]) providers[f.provider] = [];
                providers[f.provider].push(f);
            }
        });

        let out = "\n📘 DataCube SDK Help\n";
        out += "\nNATIVE METHODS:\n";
//        nativeMethods.forEach(m => out += "  • " + m + "\n");
	nativeMethods.forEach(m => out += `  • ${m} → client.${m}\n`);

        out += "\nFLOWS:\n";
        directs.forEach(f => {
            out += `  • ${f.slug} → client.${f.slug}({ ... })\n`;
            out += `  • ${f.id} → client["${f.id}"]({ ... })\n`;
        });

        out += "\nPROVIDER FLOWS:\n";
        Object.keys(providers).forEach(p => {
            out += `\n  ${p}:\n`;
            providers[p].forEach(f => {
                out += `    • ${f.slug} → client.${p}.${f.slug}({ ... })\n`;
            });
        });

        out += "\n";
	console.log(out);
        return out;
    }



    // ---------------------------------------------------------------------
    // ROOT PROXY
    // ---------------------------------------------------------------------
    #buildRootProxy() {
        const self = this;

        return new Proxy(this, {
            get(target, prop) {
                if (prop in target) return target[prop];
                return self.#buildProviderOrDirectProxy(String(prop));
            }
        });
    }

    /**
     * Decide se é diret flow, provider, slug ou ID
     */
    #buildProviderOrDirectProxy(name) {
        const flows = this.getFlows();
        const normalize = v => v?.toLowerCase().replace(/_/g, "-");

        // -------------------------------------------------------------------
        // 1) MATCH DIRETO POR ID — PRIORIDADE MÁXIMA
        // -------------------------------------------------------------------
        const matchById = flows.find(f => normalize(f.id) === normalize(name));
        if (matchById) {
            return (inputs = {}) =>
                this.#resolveDynamicCall(null, matchById.id, inputs);
        }

        // -------------------------------------------------------------------
        // 2) FLOWS DIRETOS (SEM PROVIDER)
        // -------------------------------------------------------------------
        const directMatches = flows.filter(f =>
            !f.provider &&
            (
                normalize(f.slug) === normalize(name)
            )
        );

        if (directMatches.length === 1) {
            return (inputs = {}) =>
                this.#resolveDynamicCall(null, directMatches[0].slug, inputs);
        }

        if (directMatches.length > 1) {
            const newest = directMatches.sort((a, b) => b.id.localeCompare(a.id))[0];
            return (inputs = {}) =>
                this.#resolveDynamicCall(null, newest.slug, inputs);
        }

        // -------------------------------------------------------------------
        // 3) NÃO É DIRETO → então é provider
        // (NÃO vamos bloquear! pois existe flow direto com mesmo nome)
        // -------------------------------------------------------------------
        return this.#buildProviderProxy(name);
    }

    // ---------------------------------------------------------------------
    // PROVIDER PROXY
    // ---------------------------------------------------------------------
    #buildProviderProxy(providerName) {
        const self = this;

        return new Proxy(function () {}, {
            get(_, subProp) {
                return (inputs = {}) =>
                    self.#resolveDynamicCall(providerName, String(subProp), inputs);
            },
            apply(_, __, args) {
                return self.#resolveDynamicCall(null, providerName, args[0] || {});
            }
        });
    }

    /**
     * Resolve chamada dinâmica
     */
#resolveDynamicCall(provider, name, inputs) {
    const flows = this.getFlows();
    const normalize = v => v?.toLowerCase().replace(/_/g, "-");

    const normName = normalize(name);
    const normProvider = normalize(provider);

    // -------------------------------------------------------
    // 1) SE A CHAMADA VEIO VIA PROVIDER → PRIORIDADE TOTAL
    // -------------------------------------------------------
    if (provider) {
        const providerMatch = flows.find(f =>
            f.provider &&
            normalize(f.provider) === normProvider &&
            (normalize(f.slug) === normName || normalize(f.id) === normName)
        );

        if (providerMatch) {
            return this.execute({
                flow_id: providerMatch.id,
                inputs: inputs || {}
            });
        }
        // Se chamou via provider, mas não existe flow para ele,
        // NÃO deve cair no direct. Deve falhar.
        throw new Error(
            `Flow '${name}' not found under provider '${provider}'.`
        );
    }

    // -------------------------------------------------------
    // 2) SE A CHAMADA É DIRETA → PRIORIDADE PARA DIRECT FLOWS
    // -------------------------------------------------------
    const directMatches = flows.filter(f =>
        !f.provider &&
        (normalize(f.slug) === normName || normalize(f.id) === normName)
    );

    if (directMatches.length > 0) {
        // Se houver vários directs → pegar o mais novo
        const newest = directMatches.sort((a, b) => b.id.localeCompare(a.id))[0];
        return this.execute({
            flow_id: newest.id,
            inputs: inputs || {}
        });
    }

    // -------------------------------------------------------
    // 3) SENÃO → Procurar por ID (independente de provider)
    // -------------------------------------------------------
    const idMatch = flows.find(f => normalize(f.id) === normName);
    if (idMatch) {
        return this.execute({
            flow_id: idMatch.id,
            inputs: inputs || {}
        });
    }

    throw new Error(`Flow not found: name=${name}`);
}


}

