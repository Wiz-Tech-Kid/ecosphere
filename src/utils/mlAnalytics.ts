import * as tf from "@tensorflow/tfjs"; // TensorFlow.js for ML
import { default as KMeans } from "ml-kmeans"; // K-Means clustering library


// Predict future emissions using a simple linear regression model
export const predictEmissions = (data: { x: number; y: number }[], futureSteps: number) => {
  const xs = tf.tensor1d(data.map((point) => point.x));
  const ys = tf.tensor1d(data.map((point) => point.y));

  // Fit a linear regression model
  const [slope, intercept] = tf.tidy(() => {
    const xMean = xs.mean();
    const yMean = ys.mean();
    const numerator = xs.sub(xMean).mul(ys.sub(yMean)).sum();
    const denominator = xs.sub(xMean).square().sum();
    const slope = numerator.div(denominator);
    const intercept = yMean.sub(slope.mul(xMean));
    return [slope, intercept];
  });

  // Predict future values
  const futureXs = tf.range(data.length + 1, data.length + 1 + futureSteps, 1);
  const futureYs = futureXs.mul(slope).add(intercept);

  return (futureYs.arraySync() as number[]).map((y, i) => ({
    x: data.length + i + 1,
    y,
  }));
};

// Perform clustering on emissions data
export const clusterEmissions = (data: { region: string; emissions: number }[], clusters: number) => {
  const inputData = data.map((entry) => [entry.emissions]);
  const kmeans = new KMeans(inputData, clusters, { initialization: "kmeans++" });
  return data.map((entry, index) => ({
    ...entry,
    cluster: kmeans.clusters[index],
  }));
};

// Generate heatmap data for emissions
export const generateHeatmapData = (geoData: any, emissionsData: any) => {
  const filteredGeoData = geoData.features.filter(
    (feature: any) =>
      feature.properties.name === "Botswana" || feature.properties.name === "South Africa"
  );

  return filteredGeoData.map((region: any) => {
    const emissions = emissionsData.find(
      (entry: any) => entry.region === region.properties.name
    )?.emissions;

    return {
      id: region.properties.name,
      value: emissions || 0,
    };
  });
};
