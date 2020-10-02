export default interface IRequest {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    data?: any;
    contentType?: string;
}