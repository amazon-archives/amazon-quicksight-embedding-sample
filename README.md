# Amazon QuickSight Embedding Sample
Thank you for using Amazon QuickSight. We have put together a sample for embedding dashboards in your apps running on a web browser. As the embedding API currently does not support CORS, we have provided an example of a lambda based setup, which enables you to invoke the embedding API from your web app.

## Usage
Before you can embed an Amazon QuickSight dashboard, you need to publish it and ensure that users are granted necessary permissions. For more information, see  [Embedding Amazon QuickSight Dashboards](https://docs.aws.amazon.com/quicksight/latest/user/embedding-dashboards.html) in the Amazon QuickSight User Guide.

# Amazon QuickSight SSO
QuickSight Embedding SSO works by obtaining AWS Credentials from the users logged in credentials.

Amazon QuickSight provides the following options for implementing SSO.
1. OpenID Connect
2. SAML
3. QuickSight authenticated.

The sample application covers OpenID Connect based SSO integrating with Cognito - Refer to OpenIDAuthentication folder for more details.

QuickSight authenticated can be used for QuickSight enterprise account with AD integration, or can be used in cases. A sample application highlighting that is available in QuickSightAuthentication folder.