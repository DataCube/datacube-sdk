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
		"User-Agent": "DataCube-SDK (JS)",
                ...(options.headers || {})
            }
        });

        if (!res.ok) {
            throw new Error(`Request failed ${res.status} → ${(await res.text())}`);
        }
        return res.json();
    }

    // ---------------------
    // NORMALIZAÇÃO
    // ---------------------
    stripAccents(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    normalizeProvider(name) {
        if (!name) return null;
        return this.stripAccents(name)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
    }

    normalizeSlug(name) {
        if (!name) return null;

        let s = this.stripAccents(name).replace(/[^a-zA-Z0-9 ]/g, "");
        const parts = s.trim().split(/\s+/);

        return parts
            .map((p, i) => {
                const lower = p.toLowerCase();
                if (i === 0) return lower;
                return lower.charAt(0).toUpperCase() + lower.slice(1);
            })
            .join("");
    }

    // ---------------------
    // FLOWS
    // ---------------------
    getFlows() {
        if (!this.flows.length) {
            let base = [
                {
                    id: "consulta-cnh-completa-1764938995458-45nr1u",
                    provider_name: "DataCube",
                    name: "Consulta Cnh Completa"
                },
                {
                    id: "consulta-cnh-paran-completa-1764938995458-45nr1u",
                    provider_name: "Consultas de Veículos",
                    name: "Consulta Cnh Paraná Completa"
                },
                {
                    id: "consulta-cnh-paran-completa-1764938995458-45nr1u",
                    provider_name: "teste",
                    name: "Consulta Cnh Paraná Completa"
                },
                {
                    id: "consulta-cnh-ceara-completa-1764938995458-45nr1u",
                    provider_name: "Consultas de Veículos",
                    name: "Consulta Cnh Ceará Completa"
                },
                {
                    id: "teste-meu-1765010906589-46sxz2",
                    provider_name: null,
                    name: "teste Meu"
                },
                {
                    id: "aaa-meu-1765010906589-46sxz2",
                    provider_name: null,
                    name: "teste AAA"
                }
            ];

            this.flows = base.map(f => ({
                id: f.id,
                name: f.name,
                provider_name: f.provider_name,
                provider: this.normalizeProvider(f.provider_name),
                slug: this.normalizeSlug(f.name)
            }));
        }
        return this.flows;
    }

    // ---------------------
    // MÉTODOS NATIVOS
    // ---------------------
    getStatus() { return this.request("status"); }
    getUsage() { return this.request("usage"); }
    me() { return this.request("me"); }
    execute(body) { return this.request("execute", { method: "POST", body: JSON.stringify(body) }); }
    executionStatus(id) { return this.request(`execute/${id}`); }

    // ---------------------
    // HELP()
    // ---------------------
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

        const directs = flows.filter(f => !f.provider);
        const providers = {};
        flows.forEach(f => {
            if (f.provider) {
                if (!providers[f.provider]) providers[f.provider] = [];
                providers[f.provider].push(f);
            }
        });

        let out = "\n📘 DataCube SDK Help\n";

        // NATIVOS
        out += "\n NATIVE METHODS:\n";
        nativeMethods.forEach(m => out += `   • ${m} → client.${m}\n`);

        // DIRECT FLOWS
        out += "\n FLOWS:\n";
        directs.forEach(f => {
            const left = `   • ${f.name} →`;
            const rightA = `client["${f.id}"](inputs={ ... }, version=null) [recommended]`;
            const rightB = `client.${f.slug}(inputs={ ... }, version=null)`;

            const pad = " ".repeat(left.length + 1);
            out += `${left} ${rightA}\n`;
            out += `${pad}${rightB}\n\n`;
        });

        // PROVIDERS
        out += "\n DATACUBE FLOWS:\n";
        Object.keys(providers).forEach(p => {
	    if(p == "datacube"){
		providers[p].forEach(f => {
		    const left = `     • ${f.name} →`;
		    const rightA = `client["${f.id}"](inputs={ ... }, version=null) [recommended]`;
		    const rightB = `client.${p}.${f.slug}(inputs={ ... }, version=null)`;

		    const pad = " ".repeat(left.length + 1);
		    out += `${left} ${rightA}\n`;
		    out += `${pad}${rightB}\n\n`;
		});
	    }
        });

        // PROVIDERS
        out += "\n PROVIDER FLOWS:\n";
        Object.keys(providers).forEach(p => {
	    if(p != "datacube"){
		out += `\n   ${p}:\n`;
		providers[p].forEach(f => {
		    const left = `     • ${f.name} →`;
		    const rightA = `client["${f.id}"](inputs={ ... }, version=null) [recommended]`;
		    const rightB = `client.${p}.${f.slug}(inputs={ ... }, version=null)`;

		    const pad = " ".repeat(left.length + 1);
		    out += `${left} ${rightA}\n`;
		    out += `${pad}${rightB}\n\n`;
		});
	    }
        });

        console.log(out);
        return out;
    }

    // ---------------------
    // PROXY ROOT
    // ---------------------
    #buildRootProxy() {
        const self = this;
        return new Proxy(this, {
            get(target, prop) {
                if (prop in target) return target[prop];
                return self.#buildProviderOrDirectProxy(String(prop));
            }
        });
    }

    #buildProviderOrDirectProxy(name) {
        const flows = this.getFlows();
        const normalize = v => v?.toLowerCase().replace(/_/g, "-");

        // ID MATCH
        const byId = flows.find(f => normalize(f.id) === normalize(name));
        if (byId) {
            return (inputs = {}, version = null) =>
                this.#resolveDynamicCall(null, byId.id, inputs, version);
        }

        // DIRECT FLOWS
        const direct = flows.filter(f =>
            !f.provider && normalize(f.slug) === normalize(name)
        );

        if (direct.length === 1) {
            return (inputs = {}, version = null) =>
                this.#resolveDynamicCall(null, direct[0].slug, inputs, version);
        }

        if (direct.length > 1) {
            const newest = direct.sort((a, b) => b.id.localeCompare(a.id))[0];
            return (inputs = {}, version = null) =>
                this.#resolveDynamicCall(null, newest.slug, inputs, version);
        }

        // Provider
        return this.#buildProviderProxy(name);
    }

    #buildProviderProxy(providerName) {
        const self = this;
        return new Proxy(function () {}, {
            get(_, subProp) {
                return (inputs = {}, version = null) =>
                    self.#resolveDynamicCall(providerName, String(subProp), inputs, version);
            },
            apply(_, __, args) {
                const inputs = args[0] || {};
                const version = args[1] || null;
                return self.#resolveDynamicCall(null, providerName, inputs, version);
            }
        });
    }

    // ---------------------
    // RESOLVER
    // ---------------------
    #resolveDynamicCall(provider, name, inputs, version = null) {
        const flows = this.getFlows();
        const normalize = v => v?.toLowerCase().replace(/_/g, "-");

        const normName = normalize(name);
        const normProvider = normalize(provider);

        // 1) Provider match
        if (provider) {
            const match = flows.find(f =>
                f.provider &&
                normalize(f.provider) === normProvider &&
                (normalize(f.slug) === normName || normalize(f.id) === normName)
            );

            if (!match) throw new Error(`Flow '${name}' not found under provider '${provider}'.`);

            const payload = { flow_id: match.id, inputs };
            if (version) payload.version = version;
            return this.execute(payload);
        }

        // 2) Direct match
        const direct = flows.filter(f =>
            !f.provider &&
            (normalize(f.slug) === normName || normalize(f.id) === normName)
        );

        if (direct.length) {
            const newest = direct.sort((a, b) => b.id.localeCompare(a.id))[0];
            const payload = { flow_id: newest.id, inputs };
            if (version) payload.version = version;
            return this.execute(payload);
        }

        // 3) Match global por ID
        const idMatch = flows.find(f => normalize(f.id) === normName);
        if (idMatch) {
            const payload = { flow_id: idMatch.id, inputs };
            if (version) payload.version = version;
            return this.execute(payload);
        }

        throw new Error(`Flow not found: name=${name}`);
    }
}
