
export interface DataCubeClientConfig { apiKey: string; }

export class DataCubeClient {
  private apiUrl = "https://api.datacube.com.br/v1/";
  private apiKey: string;

  constructor(config: DataCubeClientConfig){
    this.apiKey = config.apiKey;
  }

  private async request(path: string, options: RequestInit = {}){
    const res = await fetch(this.apiUrl + path, {
      ...options,
      headers:{
        "X-Api-Key": this.apiKey,
        "Content-Type":"application/json",
        ...(options.headers||{})
      }
    });
    if(!res.ok) throw new Error(`Request failed ${res.status}`);
    return res.json();
  }

  getStatus(){ return this.request("status"); }
  getUsage(){ return this.request("usage"); }
  me(){ return this.request("me"); }
  execute(body:any){ return this.request("execute",{method:"POST",body:JSON.stringify(body)}); }
  executionStatus(id:string){ return this.request(`execute/${id}`); }
}
