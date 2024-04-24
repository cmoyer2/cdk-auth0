import { ENV } from "../lambda-base";
import { CdkCustomResourceEvent } from "aws-lambda";
import { getSecretValue } from "../get-secret-value";
import { ManagementClient } from "auth0";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends ENV {}
  }
}

export async function handler(event: CdkCustomResourceEvent) {
  const auth0Api = JSON.parse(
    await getSecretValue(
      event.ResourceProperties.secretName,
      process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT,
      process.env.AWS_SESSION_TOKEN,
    ),
  );

  const auth0 = new ManagementClient({
    domain: auth0Api.domain,
    clientId: auth0Api.clientId,
    clientSecret: auth0Api.clientSecret,
  });

  switch (event.RequestType) {
    case "Create": {
      const permissions = event.ResourceProperties.permissions ?
        event.ResourceProperties.permissions.map((permission) => {
          return {
            resource_server_identifier: permission.resourceServerIdentifier,
            permission_name: permission.permissionName
          }
        }) : []
      await auth0.roles.addPermissions({
        id: event.ResourceProperties.roleId
      }, {
        permissions: permissions
      });

      return {
        PhysicalResourceId: event.ResourceProperties.roleId,
        Data: {
          permissions: permissions
        }
      }
    }
    case "Update": {
      const currentPermissions = event.OldResourceProperties.permissions;
      const deleteRequest = currentPermissions.map((permission) => {
        return {
          resource_server_identifier: permission.resourceServerIdentifier,
          permission_name: permission.permissionName
        }
      });
      const permissions = event.ResourceProperties.permissions ?
        event.ResourceProperties.permissions.map((permission) => {
          return {
            resource_server_identifier: permission.resourceServerIdentifier,
            permission_name: permission.permissionName
          }
        }) : [];
      await auth0.roles.deletePermissions({id: event.ResourceProperties.roleId}, {permissions: deleteRequest});
      await auth0.roles.addPermissions({
        id: event.ResourceProperties.roleId
      }, {
        permissions: permissions
      });

      return {
        PhysicalResourceId: event.ResourceProperties.PhysicalResourceId,
        Data: {
          ...permissions
        }
      }
    }
    case "Delete": {
      const currentPermissions = ( await auth0.roles.getPermissions({id: event.ResourceProperties.roleId})).data;
      const deletePermissions = currentPermissions.map((permission) => {
        return {
          resource_server_identifier: permission.resource_server_identifier,
          permission_name: permission.permission_name
        }
      })
      await auth0.roles.deletePermissions({id: event.ResourceProperties.roleId}, {permissions: deletePermissions})

      return {
        PhysicalResourceId: event.PhysicalResourceId
      };
    }
    default: {
      throw new Error("Invalid request type");
    }

  }

}