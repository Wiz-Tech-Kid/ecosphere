export const getVercelInfo = () => {
  return {
    isVercel: process.env.VERCEL === "1",
    environment: process.env.VERCEL_ENV,
    url: process.env.VERCEL_URL,
    region: process.env.VERCEL_REGION,
  };
};
