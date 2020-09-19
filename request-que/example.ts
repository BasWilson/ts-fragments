import requestService from "./request.service";
import requests from "./requests";

//////
////// This is all hypthetical and the endpoints are not set up.
//////

(async () => {
    await register();
})

async function register() {

    // Register an account
    const request = requests.register;

    // 
    request.data = {
        email: "anemail@gmail.com",
        password: "anicepassword"
    }

    request.callback = async (result) => {
        console.log("REGISTRATION_RESULT", result);

        // Should do some checking here, but we'll assume account was made
        await login();

        // Again, let's assume we've logged in, lets que up some requests to retrieve the profile multiple times
        requestService.que([requests.profile, requests.profile, requests.profile])

        // If any of these fail because of an expired access_token, 
        // the service will automatically refresh and retry the failed request.
    }

    request.errorCallback = (error) => {
        console.log("REGISTRATION_ERROR", error);
    }

    // Add the request to the que (it will be executed)
    await requestService.que(request);
}

async function login() {

    // Log in to get access/refresh tokens
    // (This function might need to be adjusted for yourself)
    const loggedIn = await requestService.login("anemail@gmail.com", "anicepassword");
    console.log("LOGGED_IN", loggedIn);
}