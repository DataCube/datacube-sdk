class DataCubeClient {
    constructor(config) {
        this.apiUrl = "https://api.datacube.com.br/v1/";
        this.apiKey = config.apiKey;
        this.flows = [];

        return this._buildRootProxy();
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

    execute(body) {
        return this.request("execute", {
            method: "POST",
            body: JSON.stringify(body)
        });
    }

    executionStatus(id) { return this.request(`execute/${id}`); }

    // ---------------------------------------------------------------------
    // HELP METHOD
    // ---------------------------------------------------------------------
    async help() {
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
        nativeMethods.forEach(m => out += "  • " + m + "\n");

        out += "\nDIRECT FLOWS:\n";
        directs.forEach(f => {
            out += `  • ${f.slug} → client.${f.slug}({ ... })\n`;
            out += `  • ${f.id} → client["${f.id}"]({ ... })\n`;
        });

        out += "\nPROVIDER FLOWS:\n";
        Object.keys(providers).forEach(p => {
            out += `\n${p}:\n`;
            providers[p].forEach(f => {
                out += `  • ${f.slug} → client.${p}.${f.slug}({ ... })\n`;
            });
        });

        out += "\n";
	console.log(out);
        return out;
    }

    // ---------------------------------------------------------------------
    // ROOT PROXY
    // ---------------------------------------------------------------------
    _buildRootProxy() {
        const self = this;

        return new Proxy(this, {
            get(target, prop) {
                if (prop in target) return target[prop];
                return self._buildProviderOrDirectProxy(String(prop));
            }
        });
    }

    /**
     * Decide se é direct flow, provider, slug ou id
     */
    _buildProviderOrDirectProxy(name) {
        const flows = this.getFlows();
        const normalize = v => v?.toLowerCase().replace(/_/g, "-");

        // ------------------------------------------
        // 1) PRIORIDADE MÁXIMA: MATCH POR ID
        // ------------------------------------------
        const matchById = flows.find(f => normalize(f.id) === normalize(name));
        if (matchById) {
            return (inputs = {}) =>
                this._resolveDynamicCall(null, matchById.id, inputs);
        }

        // ------------------------------------------
        // 2) FLOWS DIRETOS (SEM PROVIDER)
        // ------------------------------------------
        const directMatches = flows.filter(f =>
            !f.provider &&
            normalize(f.slug) === normalize(name)
        );

        if (directMatches.length === 1) {
            return (inputs = {}) =>
                this._resolveDynamicCall(null, directMatches[0].slug, inputs);
        }

        if (directMatches.length > 1) {
            const newest = directMatches.sort((a, b) => b.id.localeCompare(a.id))[0];
            return (inputs = {}) =>
                this._resolveDynamicCall(null, newest.slug, inputs);
        }

        // ------------------------------------------
        // 3) Não é direct → tratar como provider
        // ------------------------------------------
        return this._buildProviderProxy(name);
    }

    // ---------------------------------------------------------------------
    // PROVIDER PROXY
    // ---------------------------------------------------------------------
    _buildProviderProxy(providerName) {
        const self = this;

        return new Proxy(function () {}, {
            get(_, subProp) {
                return (inputs = {}) =>
                    self._resolveDynamicCall(providerName, String(subProp), inputs);
            },
            apply(_, __, args) {
                return self._resolveDynamicCall(null, providerName, args[0] || {});
            }
        });
    }

    // ---------------------------------------------------------------------
    // RESOLVER CHAMADAS DINÂMICAS
    // ---------------------------------------------------------------------
    _resolveDynamicCall(provider, name, inputs) {
        const flows = this.getFlows();
        const normalize = v => v?.toLowerCase().replace(/_/g, "-");

        const normName = normalize(name);
        const normProvider = normalize(provider);

        // -------------------------------------------------------
        // 1) VIA PROVIDER → PRIORIDADE TOTAL PARA O PROVIDER
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

            throw new Error(
                `Flow '${name}' not found under provider '${provider}'.`
            );
        }

        // -------------------------------------------------------
        // 2) DIRECT CALL → PRIORIDADE PARA DIRECT FLOWS
        // -------------------------------------------------------
        const directMatches = flows.filter(f =>
            !f.provider &&
            (normalize(f.slug) === normName || normalize(f.id) === normName)
        );

        if (directMatches.length > 0) {
            const newest = directMatches.sort((a, b) => b.id.localeCompare(a.id))[0];
            return this.execute({
                flow_id: newest.id,
                inputs: inputs || {}
            });
        }

        // -------------------------------------------------------
        // 3) FALLBACK: MATCH POR ID (independente de provider)
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

module.exports = { DataCubeClient };

