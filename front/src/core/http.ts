class Http {
    public async get<T>(url: string): Promise<T> {
        return await this.internalFetch(url, "GET");
    }

    public async post<T>(url: string, body: any): Promise<T> {
        return await this.internalFetch(url, "POST", body);
    }

    private async internalFetch<T>(url: string, method: string, payload?: any): Promise<T> {
        const body = payload ? JSON.stringify(payload) : undefined;
        const response: Response = await fetch(url, {
            method, body, mode: "cors", headers: {
                'Content-type': 'application/json'
            }
        });
        if (response.ok) {
            if (response.headers.get('Content-Length') === "0") {
                return undefined!;
            }
            return await response.json();
        }
        else {
            console.log("Error", response);
            throw new Error(`${response.status}: ${response.statusText}`);
        }
    }
}

export const http = new Http();