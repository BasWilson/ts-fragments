export default interface IRequest {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    dontRetry?: boolean;
    data?: any;
    status?: number;
    callback?: Function;
    errorCallback?: Function;
}