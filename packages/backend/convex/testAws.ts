import { action } from "./_generated/server";
import { createSecretsManagerClient } from "./lib/secrets";
import { CreateSecretCommand, ResourceExistsException } from "@aws-sdk/client-secrets-manager";

export default action(async (ctx) => {
  const client = createSecretsManagerClient();
  const secretName = "test/duplicate_secret_123";

  try {
    // Try to create it twice to force a ResourceExistsException
    await client.send(
      new CreateSecretCommand({
        Name: secretName,
        SecretString: "{}",
      }),
    );
  } catch (e) {
    // Ignore first error
  }

  try {
    await client.send(
      new CreateSecretCommand({
        Name: secretName,
        SecretString: "{}",
      }),
    );
    return "SUCCESS_NO_ERROR";
  } catch (error: any) {
    const isInstance = error instanceof ResourceExistsException;
    return {
      message: error.message,
      name: error.name,
      isInstance,
    };
  }
});
