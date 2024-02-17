import { Construct } from "constructs";
import { Stack } from "aws-cdk-lib";
import { Provider as AwsProvider } from "aws-cdk-lib/custom-resources";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";

import { OnEventHandler } from "./on-event-handler";

export class Provider extends AwsProvider {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      onEventHandler: new OnEventHandler(scope, `${id}OnEventHandler`),
    });
  }

  static getOrCreate(scope: Construct, apiSecret: ISecret) {
    const stack = Stack.of(scope);
    const id = "Auth0ConnectionProvider";
    const provider =
      (stack.node.tryFindChild(id) as Provider) || new Provider(stack, id);

    apiSecret.grantRead(provider.onEventHandler);

    return provider.serviceToken;
  }
}
