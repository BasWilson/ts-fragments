# Request que
This class makes using access/refresh tokens easy. It will que up requests, in case a request fails because of an expired access_token, it will automatically refresh and then retry the request and execute the rest of the que in order.

## Dependencies
- Axios
- TypeScript
