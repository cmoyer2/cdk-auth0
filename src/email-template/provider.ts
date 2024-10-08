import { Provider as AwsProvider } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { LambdaBase, LambdaRole } from "../lambda-base";
import { join } from "path";
import { Stack } from "aws-cdk-lib";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";

export class Provider extends AwsProvider {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      onEventHandler: new LambdaBase(scope, `${id}OnEventHandler`, {
        entry: join(__dirname, "./../../src/email-template/handler.ts"),
      }),
      role: new LambdaRole(scope, `${id}Role`),
    });
  }

  static getOrCreate(scope: Construct, apiSecret: ISecret) {
    const stack = Stack.of(scope);
    const id = "Auth0EmailTemplateProvider";
    const provider =
      (stack.node.tryFindChild(id) as Provider) || new Provider(stack, id);

    apiSecret.grantRead(provider.onEventHandler);

    return provider.serviceToken;
  }
}
