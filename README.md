# Amazon QuickSight Embedding Sample
Thank you for using Amazon QuickSight. We have put together a sample for embedding dashboards in your apps running on a web browser. As the embedding API currently does not support CORS, we have provided an example of a lambda based setup, which enables you to invoke the embedding API from your web app.

## Usage
Before you can embed an Amazon QuickSight dashboard, you need to publish it and ensure that users are granted necessary permissions. For more information, see  [Embedding Amazon QuickSight Dashboards](https://docs.aws.amazon.com/quicksight/latest/user/embedding-dashboards.html) in the Amazon QuickSight User Guide.

The example below is using Amazon Cognito for authenticating users into the app (you could use your own auth provider and change the lambda code accordingly). Amazon API Gateway is used to expose an API which can be invoked by the web app. The API gateway triggers a function in AWS Lambda, which eventually calls the `GetDashboardEmbedUrl` API with the parameters you pass to the API gateway, along with the cognito user credentials. An authenticated Cognito role, bound to the Cognito Identity Pool, is used to invoke the embeddiing API to get the embed url.

### Step 1: Setup the Cognito stack using AWS CloudFormation

- Create a new CloudFormation stack using `QuickSightEmbeddingCognito.yaml`, which you can find inside the cloudformation/ folder of this repo.

- Make a note of the output of the cloudformation stack: `IdentityPoolId`, `UserPoolClientId`, `UserPoolId`, & `CognitoAuthorizedRoleArn`. We will need this in a later step.

- Create a user in the Cognito user pool using your app. Verify the user so that user status changes to CONFIRMED. For more information about Amazon Cognito, see [Amazon Cognito Documentation](https://docs.aws.amazon.com/cognito/index.html)

### Step 2: Setup the Lambda stack using AWS CloudFormation

- Create a new CloudFormation stack using `QuickSightEmbeddingLambda.json`, which you can find inside the cloudformation/ folder of this repo.

- Make a note of the `RootUrl`, which will be an output of the CloudFormation stack. This is our API Gateway endpoint.

- You should see a new lambda function created for you in the AWS Lambda console called `GetDashboardEmbedURL`, and also a new API in the AWS API Gateway console called `GetDashboardEmbedURL`.

### Step 3: Package and deploy Lambda code

- Inside the lambda/ directory, run

  ```
      npm install
  ```

- The above command should create a new folder called node_modules. Inside the lambda code (index.js), we need to replace a few parameters
  - `IdentityPoolId`: from Step 1
  - `UserPoolId`: from Step 1
  - `ClientId`: from Step 1
  - `roleArn`: from Step 1 (`CognitoAuthorizedRoleArn`)
  - `Logins`: if you have a confirmed user in the user pool, replace with: cognito-idp.`REGION`.amazonaws.com/`UserPoolId`

- Next, package the index.js, package.json, and node_modules into a zip. Run the below command inside the lambda/ directory.

  ```
      zip -r getDashboardEmbedURL.zip *
  ```

- Go to the lambda, inside the AWS console and upload this zip file and hit save.

### Step 4: Test your new API

- Assuming you already have a confirmed Cognito User Pool user, make a note of the username and password for this user.

- Go to the AWS API Gateway console, go the API `GetDashboardEmbedURL` and click on `GET`.

- Inside the query string parameters, we need 3 parameters
  - `username`: Cognito user's username
  - `password`: Cognito user's password
  - `dashboardId`: Your dashboard id

  ```
      username=username&password=password&dashboardId=63b780fb-XXXX-XXXX-XXXX-7ee661ab6212
  ```

- Copy the above string after replacing it with your parameters, and add it under `Query Strings`. Hit `Test` and the output should be an embed url.
  - The embed url has an auth code stamped on it, and so the url is valid for 5 minutes. But once the url auth code is redeemed to initiate a QuickSight session, the session is valid for 10 hours, which can be controlled using `SessionLifeTimeInMinutes`.
  - This implies that `static embedding will not work`. We expect each page refresh in your app to make a new request to get the embed url via the API gateway (setup in Step 2).

### Step 5: Setup your web app to call the API Gateway endpoint

- Make sure to use the [Amazon QuickSight Embedding SDK](https://github.com/awslabs/amazon-quicksight-embedding-sdk) for setting up embedding in your web app.

- Below is an example of a ajax call to invoke the API Gateway endpoint to get the embedding url

  ```
      var gatewayApiUrl = "https://xxxxxxxxxx.execute-api.REGION.amazonaws.com/prod/getDashboardEmbedURL?"; // update with RootUrl found in Step 2
      $(document).ready(function () {
          var username = getParameterValues('username');
          var password = getParameterValues('password');
          var dashboardId = getParameterValues('dashboardid');
          embedUrl();

          function getParameterValues(param) {
              var url = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
              for (var i = 0; i < url.length; i++) {
                  var urlparam = url[i].split('=');
                  if (urlparam[0].toLowerCase() === param) {
                      return urlparam[1];
                  }
              }
          }

          function embedUrl() {
              var parameters = {
                  username: username,
                  password: password,
                  dashboardId: dashboardId
              }

              var queryString = $.param(parameters);
              gatewayApiUrl = gatewayApiUrl + queryString;
              $.ajax({
                  type: "GET",
                  url: gatewayApiUrl,
                  contentType: "application/json",
                  crossDomain: true,
                  success: function(data, status) {
                      console.log(data);
                      embedDashboard(data.EmbedUrl);
                  }
              })
          }

          function onVisualLoaded() {
              var div = document.getElementById("loadedContainer");
              div.innerHTML = "Hey! I am fully loaded";
          }

          function onError() {
              var div = document.getElementById("errorContainer");
              div.innerHTML = "your seesion has expired";
          }

          function embedDashboard(embedUrl) {
              var containerDiv = document.getElementById("dashboardContainer");
              var params = {
                  url: embedUrl,
                  container: containerDiv,
                  height: "800px"
              };
              var dashboard = QuickSightEmbedding.embedDashboard(params);
              dashboard.on('error', onError);
              dashboard.on('load', onVisualLoaded);
          }
      });
  ```

## License
This library is licensed under the Apache 2.0 License.