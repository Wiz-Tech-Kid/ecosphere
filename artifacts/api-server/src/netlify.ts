import serverless from "serverless-http";
import app from "./function-app";

const serverlessHandler = serverless(app);

export const handler = async (
  event: Parameters<typeof serverlessHandler>[0],
  context: Parameters<typeof serverlessHandler>[1],
) => {
  if (context && typeof context === "object") {
    (context as { callbackWaitsForEmptyEventLoop?: boolean }).callbackWaitsForEmptyEventLoop =
      false;
  }

  return serverlessHandler(event, context);
};
