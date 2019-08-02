# fej
Fetch API with middleware

fej exposes simple middleware API to manipulate request properties.

You can override middleware and initial data with each request: `fej("/api/users", { headers: {"Accept": "application/xml"} })`

#### Fej.setInit
Set some static headers

```javascript
  import Fej from "fej";
  
  Fej.setInit({
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  });
```

#### Fej.addAsyncMiddleware
Updating `fetch` properties asynchronously
```javascript
  import Fej from "fej";

  Fej.addAsyncMiddleware(async init => {
  
    // get access token
    const token = await authService.acquireTokenSilent();

    // update Authorization header with new access token
    return Promise.resolve({
      headers: { Authorization: "Bearer " + token.accessToken }
    });
  });
```


#### Fej.addMiddleware
```javascript
  import Fej from "fej";

  Fej.addAsyncMiddleware(async init => {
  
    // Get current time
    const currentDateTime = new Date().toISOString()

    // update Authorization header with new access token
    return Promise.resolve({
      headers: { "Z-CURRENTTIME": currentDateTime }
    });
  });
```

