import Axios, { AxiosInstance, AxiosResponse } from "axios";
import requests from "./requests";
import IRequest from "./i.request";

class RequestService {

    private reqQue: IRequest[];
    private baseUrl: string;
    private dev: boolean;
    private busy: boolean = true;
    private access_token: string;
    private refresh_token: string;
    private axios: AxiosInstance;
    private errorCount: number;

    constructor() {

        this.readStorage();

        this.reqQue = [];

        // Determine if its dev
        this.dev = location.hostname == "localhost";

        // Determine base url
        this.baseUrl = this.dev ?
            "http://localhost:3000" :
            "https://api.hvh.gg";

        this.axios = Axios.create({
            withCredentials: true,
            baseURL: this.baseUrl,
            headers: {
                "Authorization": `Bearer ${this.access_token}`
            },
            validateStatus: (status) => status < 499
        });

        this.errorCount = 0;
        this.busy = false;
    }

    public que = async (request: IRequest | IRequest[]) => {

        if (Array.isArray(request)) {
            this.reqQue = this.reqQue.concat(request);
        } else {
            // Add to que
            this.reqQue.push(request);
        }

        // If not busy, execute que
        if (!this.busy) {
            await this.executeQue();
        }
    }

    private executeQue = async () => {

        this.busy = true;

        if (this.reqQue.length > 0) {
            const request = this.reqQue[0];
            const executed = await this.executeRequest(request);

            // If request executes correctly or fails more than 3 times remove from que.
            if (executed || this.errorCount > 0 || request.dontRetry) {
                this.errorCount = 0;
                this.reqQue.splice(0, 1);

                // Check if it errored 3 times, call the errorCallback if it exists
                if (request.errorCallback && this.errorCount > 0) {
                    request.errorCallback({ error: "timeout" });
                }
            } else {
                this.errorCount++;
            }
        }

        // If theres more left in the que, keep executing them recursivly
        if (this.reqQue.length > 0) {
            await this.executeQue();
        } else {
            // Nothing left in que. We're not busy anymore!
            this.busy = false;
        }
    }

    /**
     * Returns false if request needs to be rerun
     * @param request 
     */
    private executeRequest = async (request: IRequest): Promise<boolean> => {
        try {

            let response: AxiosResponse;

            // Set auth header
            this.axios = Axios.create({
                withCredentials: true,
                baseURL: this.baseUrl,
                headers: {
                    "Authorization": `Bearer ${this.access_token}`
                },
                validateStatus: (status) => status < 499
            });
            switch (request.method) {
                case "GET":
                    response = await this.axios.get(request.path);
                    break;
                case "POST":
                    response = await this.axios.post(request.path, request.data);
                    break;
                case "DELETE":
                    response = await this.axios.delete(request.path);
                    break;
                case "PUT":
                    response = await this.axios.put(request.path, request.data);
                    break;
            }

            console.log("REQUEST_EXECUTED:", response);
            // If response fails because access_token is expired, refresh first and re-execute this request.
            if (response.status === 401) {
                // unauthorized, refresh our access token
                await this.refresh();

                // Return false so the request can be called again after the refresh
                return false;
            }

            // Check if successfull
            if (response.status >= 200 && response.status <= 400) {
                if (request.callback) {
                    request.callback(response.data);
                }

                return true;
            }

            return false;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    /**
     * Refresh the JWT token
     */
    private refresh = async () => {
        if (!this.refresh_token) {
            return;
        }

        const response = await this.axios.post(
            requests.refresh.path,
            {
                'refresh_token': this.refresh_token
            }
        );

        if (response.status == 401) {
            // Our refresh token is invalid, clear que etc.
            this.clearQue();
        } else if (response.status >= 200 && response.status < 300) {
            // Assign new refresh_token and access_token
            this.access_token = response.data.access_token;
            this.refresh_token = response.data.refresh_token;

            // Update local storage
            localStorage.setItem("refresh_token", this.refresh_token);
            localStorage.setItem("access_token", this.access_token);
        }
    }

    public login = async (email: string, password: string) => {

        try {
            const response = await this.axios.post(
                requests.login.path,
                {
                    'email': email,
                    'password': password
                }
            );

            if (response.status == 401) {
                return false;

            } else if (response.status >= 200 && response.status < 300) {
                // Assign new refresh_token and access_token
                this.access_token = response.data.access_token;
                this.refresh_token = response.data.refresh_token;

                // Update local storage
                localStorage.setItem("refresh_token", this.refresh_token);
                localStorage.setItem("access_token", this.access_token);

                return true;
            }
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    /**
     * Retrieves a possible refresh token from the local storage
     */
    private readStorage = () => {
        const refresh_token = localStorage.getItem("refresh_token");
        const access_token = localStorage.getItem("access_token");

        if (refresh_token) {
            this.refresh_token = refresh_token;
        }

        if (access_token) {
            this.access_token = access_token;
        }
    }

    private clearQue = () => {
        this.reqQue = [];
        this.busy = false;
    }
}

export default new RequestService();