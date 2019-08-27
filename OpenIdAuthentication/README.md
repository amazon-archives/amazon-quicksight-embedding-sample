
## Usage
Before you can embed an Amazon QuickSight dashboard, you need to publish it and ensure that users are granted necessary permissions. For more information, see  [Embedding Amazon QuickSight Dashboards](https://docs.aws.amazon.com/quicksight/latest/user/embedding-dashboards.html) in the Amazon QuickSight User Guide.

The example below is using Amazon Cognito for authenticating users into the app (you could use your own OpenID connect based auth provider and change the lambda code accordingly). Amazon API Gateway is used to expose an API which can be invoked by the web app. The API gateway triggers a function in AWS Lambda, which eventually calls the `GetDashboardEmbedUrl` API with the parameters you pass to the API gateway, along with the cognito user credentials. An authenticated Cognito role, bound to the Cognito Identity Pool, is used to invoke the embeddiing API to get the embed url.

### Step 1: Setup the Cognito stack using AWS CloudFormation

- Create a new CloudFormation stack using `QuickSightEmbeddingCognito.yaml`, which you can find inside the cloudformation/ folder of this repo.

- Make a note of the output of the cloudformation stack: `IdentityPoolId`, `UserPoolClientId`, `UserPoolId`. We will need this in a later step.

- Create a user in the Cognito user pool using your app. Verify the user so that user status changes to CONFIRMED. For more information about Amazon Cognito, see [Amazon Cognito Documentation](https://docs.aws.amazon.com/cognito/index.html). Assuming you already have a CONFIRMED Cognito User Pool user, make a note of the username and password for this user. You could also confirm a user for testing by using the below commands:

  ```
      aws cognito-idp admin-initiate-auth --user-pool-id <> --client-id <> --auth-flow ADMIN_NO_SRP_AUTH --auth-parameters USERNAME=<>,PASSWORD=<>

      aws cognito-idp admin-respond-to-auth-challenge --user-pool-id <> --client-id <> --challenge-name NEW_PASSWORD_REQUIRED --challenge-responses NEW_PASSWORD=<>,USERNAME=<>,userAttributes.name=<> --session “output_of_previous_command"
  ```

### Step 2: Setup the Lambda stack using AWS CloudFormation

- Create a new CloudFormation stack using `QuickSightEmbeddingLambda.json`, which you can find inside the cloudformation/ folder of this repo.

- Note: Lambda Execution role created has permissions to call `quicksight:RegisterUser` action on the assumedRole user, before vending a QuickSight dashboard embedding URL with Authcode.

- Note: 

- The `QuickSightCognito-CognitoAuthorizedRole-XXXX...` roleArn is assumed by the lambda on behalf of the user principle with the openId token. 

- The`QuickSightCognito-CognitoAuthorizedRole-XXXX...` give the assumed role user the permission to call `quicksight:GetDashboardEmbedURL` action.

- Make a note of the `RootUrl`, which will be an output of the CloudFormation stack. This is our API Gateway endpoint.

- You should see a new lambda function created for you in the AWS Lambda console called `GetDashboardEmbedURL`, and also a new API in the AWS API Gateway console called `GetDashboardEmbedURL`.

### Step 3: Package and deploy Lambda code

- Inside the lambda/ directory, run

  ```
      npm install
  ```

- The above command should create a new folder called node_modules. Inside the lambda code (index.js), 
- Next, package the index.js, package.json, and node_modules into a zip. Run the below command inside the lambda/ directory.

  ```
      zip -r getDashboardEmbedURL.zip *
  ```

- Go to the lambda, inside the AWS console and upload this zip file and hit save.

### Step 4: Setup your web app to call the API Gateway endpoint

- Create a new CloudFormation stack using `QuickSightEmbeddingWebApp.yaml`, which you can find inside the cloudformation/ folder of this repo.

- The cloud formation creates a cloud front endpoint supported by an S3 bucket `quicksightembwebapp-thebucket-xxxxxxxx` bucket.

- Replace the following parameters in the `index.html` within the `web` folder and upload the following file 

 -- `amazon-cognito-identity.min.js` obtained from `https://www.npmjs.com/package/amazon-cognito-identity-js`
 -- `index.html`

to the S3 bucket, and give read permisions to everyone.

```
var awsData = {
            cognitoAuthenticatedUserName:`'<cognito userpool username>'`,
            cognitoAuthenticatedUserPassword:`'<cognito userpool password>'`,
            dashboardId: getParameterValues('dashboardid'),
            region:`'<AWS region where cognito userpool and quicksight dashboard exists>'`,
            cognitoIdentityPoolId:`'<identitypool id>'`,
            cognitoAuthenticatedUserPoolId:`'<userpool id>'`,
            cognitoAuthenticatedClientId:`'<cognito userpool clientid>'`,
            roleSessionName: `'<session identifier>'`,
            apiGatewayUrl:`'https://<APIGateway rool url>/prod/getDashboardEmbedURL?'`,
            cognitoAuthenticatedLogins: `'cognito-idp.<region>.amazonaws.com/<userpoolid>'`
        }
```

- Pick the `Domain name` from cloudfront and whitelist it in QuickSight `Domains and Embedding` section of the QuickSight Admin page.

- Try the url in the browser - `https://<DomainName>?dashboarid=<dashboardId>` and verify the embedding page load.

- Make sure to use the [Amazon QuickSight Embedding SDK](https://github.com/awslabs/amazon-quicksight-embedding-sdk) for setting up embedding and passing parameter between parent and embedded iframe in your web app.

- 

## License
This library is licensed under the Apache 2.0 License.
