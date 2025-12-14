const { version } = require('../package.json');

/**
 * DataCubeError — erro customizado do SDK
 */
class DataCubeError extends Error {
    constructor(message, context = {}, stackStartFn = null) {
        super(`⚠️   ${message}`);
        this.name = "DataCubeError";
        this.context = context;

        if (stackStartFn && Error.captureStackTrace) {
            Error.captureStackTrace(this, stackStartFn);
        } else if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DataCubeError);
        }
    }
}

/**
 * DataCubeClient — cliente oficial do SDK
 */
class DataCubeClient {
    constructor(config) {
        this.apiUrl = "https://api.datacube.com.br/v1/";
        this.apiKey = config.apiKey;
        this.flows = [];

        return this.#buildProxy();
    }

    async request(path, options = {}) {
        const url = this.apiUrl + path;
        const headers = {
            "X-Api-Key": this.apiKey,
            "Content-Type": "application/json",
            "User-Agent": `DataCube-SDK/${version} (ESM)`,
            "X-Sdk-Version": version,
            "X-Sdk-Language": "javascript",
            ...(options.headers || {})
        };

        const res = await fetch(url, { ...options, headers });

        if (!res.ok) {
            const data = await res.json();
            const safeKey = this.apiKey ? `${this.apiKey.slice(0, 8)}...${this.apiKey.slice(-4)}` : "MISSING";

            let payload = options.body;
            try { payload = JSON.parse(payload); } catch (e) { }

            const debugHeaders = { ...headers, "X-Api-Key": safeKey };

            throw new DataCubeError(`Request failed  →  ${res.status}`, {
                request: { url, payload, headers: debugHeaders },
                response: data
            });
        }

        return res.json();
    }

    // Helper: Normalize
    _normalize(s) {
        if (!s) return null;
        return s.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
    }

    // Helper: Slugify
    _slug(s) {
        if (!s) return null;
        const clean = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "");
        return clean.trim().split(/\s+/)
            .map((p, i) => i === 0 ? p.toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
            .join("");
    }

    getFlows() {
        if (!this.flows.length) {
            const base = [
                {
                    id: "consulta-cnh-completa-1764938995458-45nr1u",
                    provider_name: "DataCube",
                    team_name: null,
                    name: "Consulta Cnh Completa"
                },
                {
                    id: "consultasdeveiculos-cnh-parana-completa",
                    provider_name: "Consultas de Veículos",
                    team_name: null,
                    name: "Consulta Cnh Paraná Completa"
                },
                {
                    id: "consulta-cnh-paran-completa-1764938995458-45nr1u",
                    provider_name: "teste",
                    team_name: null,
                    name: "Consulta Cnh Paraná Completa"
                },
                {
                    id: "consulta-cnh-ceara-completa-1764938995458-45nr1u",
                    provider_name: "Consultas de Veículos",
                    team_name: null,
                    name: "Consulta Cnh Ceará Completa"
                },
                {
                    id: "teste-meu-1765010906589-46sxz2",
                    provider_name: null,
                    team_name: null,
                    name: "teste Meu"
                },
                {
                    id: "aaa-meu-1765010906589-46sxz2",
                    provider_name: null,
                    team_name: null,
                    name: "teste AAA"
                },
                {
                    id: "teste-9999999996589-46sxz2",
                    provider_name: null,
                    team_name: "Team ÁEEEE",
                    name: "teste"
                },
                {
                    id: "teste-1765010906589-46sxz2",
                    provider_name: null,
                    team_name: "Team Foiiii",
                    name: "teste"
                }
            ];

            this.flows = base.map(f => ({
                id: f.id,
                name: f.name,
                provider_name: f.provider_name,
                provider: this._normalize(f.provider_name),
                team_name: f.team_name,
                team: this._normalize(f.team_name),
                slug: this._slug(f.name)
            }));
        }
        return this.flows;
    }

    getStatus() { return this.request("status"); }
    getUsage() { return this.request("usage"); }
    me() { return this.request("me"); }
    async execute(body) { return await this.request("execute", { method: "POST", body: JSON.stringify(body) }); }
    executionStatus(id) { return this.request(`execute/${id}`); }

    async help() {
        const flows = this.getFlows();

        // Group flows
        const groups = { datacube: [], personal: [], teams: {}, providers: {} };
        flows.forEach(f => {
            if (f.provider === 'datacube') {
                groups.datacube.push(f);
            } else if (f.provider) {
                if (!groups.providers[f.provider_name]) groups.providers[f.provider_name] = [];
                groups.providers[f.provider_name].push(f);
            } else if (f.team) {
                if (!groups.teams[f.team]) groups.teams[f.team] = [];
                groups.teams[f.team].push(f);
            } else {
                groups.personal.push(f);
            }
        });

        // Helper to format flow lines
        const formatFlow = (f, ctx) => {
            const call = ctx ? `client.${ctx}.${f.slug}` : `client.${f.slug}`;
            const l = `   • ${f.name} → `;
            const pad = " ".repeat(l.length + 1);
            return `${l} client["${f.id}"](inputs={ ... }, version=null)  [recommended]\n` +
                `${pad}${call}(inputs={ ... }, version=null)\n`;
        };

        let out = "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        out += "📘  DATACUBE SDK — COMMAND REFERENCE\n";
        out += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

        // Native Methods
        out += "\n🔧  NATIVE METHODS\n";
        out += "----------------------------------------------\n";
        const methods = ["getStatus()", "getUsage()", "me()", "execute(body)", "executionStatus(id)", "help()"];
        methods.forEach(m => {
            out += `   • ${m.padEnd(22)} →  client.${m}\n`;
        });

        // DataCube (Official)
        out += "\n\n";
        out += "⚡  DATACUBE FLOWS (OFFICIAL)\n";
        out += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        out += "     These are the official flows provided by DataCube.\n\n";

        if (groups.datacube.length) {
            groups.datacube.forEach(f => {
                out += formatFlow(f, "datacube") + "\n";
            });
        } else {
            out += "   • No DataCube flows found.\n";
        }

        // Personal Flows
        out += "\n\n🚀  PERSONAL FLOWS\n";
        out += "----------------------------------------------\n";
        if (groups.personal.length) {
            groups.personal.forEach(f => {
                out += formatFlow(f, null) + "\n";
            });
        } else {
            out += "   • No direct flows found.\n";
        }

        // Teams
        out += "\n\n👥  TEAM FLOWS\n";
        out += "----------------------------------------------\n";
        const teams = Object.keys(groups.teams);
        if (teams.length) {
            teams.forEach(t => {
                out += `\n🔸  team: ${t}\n`;
                groups.teams[t].forEach(f => {
                    out += formatFlow(f, `teams.${t}`) + "\n";
                });
            });
        } else {
            out += "   • No team flows found.\n";
        }

        // Providers
        out += "\n\n🏭  PROVIDER FLOWS\n";
        out += "----------------------------------------------\n";
        const provs = Object.keys(groups.providers);
        if (provs.length) {
            provs.forEach(p => {
                out += `\n🔹  ${this._normalize(p)}\n`;
                groups.providers[p].forEach(f => {
                    out += formatFlow(f, this._normalize(p)) + "\n";
                });
            });
        } else {
            out += "   • No providers found.\n";
        }

        out += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        out += "💡 RECOMMENDATION: Whenever possible, call flows by their ID.\n";
        out += "   This prevents your code from breaking if the flow name changes.\n";
        out += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

        console.log(out);
        return out;
    }

    #buildProxy() {
        const getTrap = (target, prop) => {
            if (prop in target) return target[prop];
            if (prop === "teams") return this.#buildTeamRoot();
            return this.#resolve(null, String(prop), false, getTrap) || this.#buildProviderProxy(String(prop));
        };
        return new Proxy(this, { get: getTrap });
    }

    #buildTeamRoot() {
        return new Proxy({}, {
            get: (_, team) => this.#buildTeamProxy(String(team))
        });
    }

    #buildTeamProxy(team) {
        const getTrap = (_, flow) => this.#resolve(team, String(flow), true, getTrap);
        return new Proxy(() => { }, { get: getTrap });
    }

    #buildProviderProxy(provider) {
        const getTrap = (_, flow) => this.#resolve(provider, String(flow), false, getTrap);
        const applyTrap = (_, __, [inputs, ver]) => {
            const fn = this.#resolve(null, provider, false, applyTrap);
            if (!fn) throw new DataCubeError(`'${provider}' is not a known flow.`, {}, applyTrap);
            return fn(inputs, ver);
        };

        return new Proxy(() => { }, {
            get: getTrap,
            apply: applyTrap
        });
    }

    #resolve(provider, name, isTeam = false, stackStartFn = null) {
        const flows = this.getFlows();
        const norm = v => v?.toLowerCase().replace(/_/g, "-");

        const nName = norm(name);
        const nProv = norm(provider);

        // Helper to return executable function
        const exec = (id, fnName) => {
            const wrapper = (inputs = {}, version = null) => {
                // Capture stack trace synchronously
                const capture = {};
                Error.captureStackTrace(capture);

                const payload = { flow_id: id, inputs };
                if (version) payload.version = version;
                return this.execute(payload).catch(err => {
                    if (capture.stack) {
                        err.stack += "\n" + capture.stack.substring(capture.stack.indexOf("\n") + 1);
                    }
                    throw err;
                });
            };
            Object.defineProperty(wrapper, "name", { value: fnName });
            return wrapper;
        };

        // 1. Team Flow
        if (isTeam) {
            const match = flows.find(f =>
                f.team &&
                norm(f.team) === nProv &&
                norm(f.slug) === nName
            );
            if (match) return exec(match.id, `client.teams.${nProv}.${nName}`);
            throw new DataCubeError(`Flow '${name}' not found under team '${provider}'`, {}, stackStartFn);
        }

        // 2. Provider Flow
        if (provider) {
            const match = flows.find(f =>
                f.provider &&
                norm(f.provider) === nProv &&
                (norm(f.slug) === nName || norm(f.id) === nName)
            );
            if (match) return exec(match.id, `client.${nProv}.${nName}`);
            throw new DataCubeError(`Flow '${name}' not found under provider '${provider}'`, {}, stackStartFn);
        }

        // 3. Direct/Personal Flow or Global ID
        const direct = flows.filter(f =>
            !f.provider &&
            !f.team &&
            (norm(f.slug) === nName || norm(f.id) === nName)
        );

        if (direct.length) {
            const newest = direct.sort((a, b) => b.id.localeCompare(a.id))[0];
            return exec(newest.id, `client.${nName}`);
        }

        const idMatch = flows.find(f => norm(f.id) === nName);
        if (idMatch) return exec(idMatch.id, `client["${idMatch.id}"]`);

        return null;
    }
}

module.exports = { DataCubeClient, DataCubeError };