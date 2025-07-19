/**
 * @jest-environment node
 */

import {
  DataAnalyzer,
  Dataset,
  DescriptiveStats,
  MLModel,
  Correlation,
  DataQuality,
  OutlierDetectionResult,
  ClusteringResult,
  ClassificationResult,
  RegressionResult,
  DataAnalyzerConfig
} from '../../../src/agents/pythagoras/DataAnalyzer';
import { LLMProvider } from '../../../src/utils/llm/SimpleLLMProvider';

// Mock LLM Provider for DataAnalyzer tests
class MockDataAnalyzerLLMProvider implements LLMProvider {
  async generateResponse(prompt: string, options?: any): Promise<string> {
    if (prompt.includes('Analyze data quality')) {
      return JSON.stringify({
        completeness: 0.95,
        accuracy: 0.92,
        consistency: 0.88,
        validity: 0.90,
        uniqueness: 0.85,
        timeliness: 0.93,
        issues: [
          {
            type: 'missing_values',
            severity: 'medium',
            description: '5% missing values in age column',
            affectedRows: 50,
            affectedColumns: ['age'],
            suggestedAction: 'Impute missing values using median'
          }
        ]
      });
    }

    if (prompt.includes('Recommend ML algorithm')) {
      return JSON.stringify({
        algorithm: 'RandomForest',
        reasoning: 'Good balance of accuracy and interpretability for this dataset',
        hyperparameters: {
          n_estimators: 100,
          max_depth: 10,
          min_samples_split: 2
        },
        expectedAccuracy: 0.87,
        trainingTime: 120
      });
    }

    if (prompt.includes('Interpret correlation')) {
      return JSON.stringify({
        interpretation: 'Strong positive correlation indicates direct relationship',
        significance: 'Statistically significant at p < 0.001',
        practical_importance: 'High practical significance for business decisions',
        causal_inference: 'Correlation does not imply causation - further investigation needed'
      });
    }

    if (prompt.includes('Identify outliers')) {
      return JSON.stringify({
        outlier_indices: [5, 23, 67, 89],
        outlier_scores: [3.2, 2.8, 3.5, 2.9],
        explanation: 'Values exceed 2.5 standard deviations from mean',
        recommendations: ['investigate data entry errors', 'consider legitimate extreme values']
      });
    }

    return 'Default LLM response for data analysis';
  }
}

describe('DataAnalyzer', () => {
  let dataAnalyzer: DataAnalyzer;
  let mockLLMProvider: MockDataAnalyzerLLMProvider;
  let sampleDataset: Dataset;

  beforeEach(() => {
    mockLLMProvider = new MockDataAnalyzerLLMProvider();
    dataAnalyzer = new DataAnalyzer(mockLLMProvider, {
      maxDatasetSize: 10000,
      enableCaching: true,
      defaultPrecision: 'double',
      parallelProcessing: true,
      qualityThreshold: 0.8
    });

    sampleDataset = {
      id: 'test-dataset-1',
      name: 'Customer Analysis Dataset',
      data: [
        { id: 1, age: 25, income: 50000, category: 'A', active: true },
        { id: 2, age: 30, income: 60000, category: 'B', active: true },
        { id: 3, age: 35, income: 70000, category: 'A', active: false },
        { id: 4, age: 40, income: 80000, category: 'C', active: true },
        { id: 5, age: 45, income: 90000, category: 'B', active: false }
      ],
      schema: {
        columns: [
          { name: 'id', type: 'number', nullable: false, unique: true },
          { name: 'age', type: 'number', nullable: false, unique: false },
          { name: 'income', type: 'number', nullable: false, unique: false },
          { name: 'category', type: 'categorical', nullable: false, unique: false },
          { name: 'active', type: 'boolean', nullable: false, unique: false }
        ],
        relationships: [],
        constraints: [],
        types: {
          id: 'number',
          age: 'number',
          income: 'number',
          category: 'categorical',
          active: 'boolean'
        }
      },
      metadata: {
        source: 'test_data',
        created: new Date(),
        lastUpdated: new Date(),
        version: '1.0',
        tags: ['test', 'customer'],
        description: 'Sample dataset for testing'
      },
      size: 5,
      quality: {
        completeness: 1.0,
        accuracy: 0.95,
        consistency: 0.9,
        validity: 0.95,
        uniqueness: 1.0,
        timeliness: 0.9,
        issues: []
      }
    };
  });

  describe('Core Functionality', () => {
    test('should initialize with default configuration', () => {
      const analyzer = new DataAnalyzer(mockLLMProvider);
      expect(analyzer).toBeInstanceOf(DataAnalyzer);
      expect(analyzer.getConfig().maxDatasetSize).toBe(100000);
    });

    test('should initialize with custom configuration', () => {
      const config: Partial<DataAnalyzerConfig> = {
        maxDatasetSize: 5000,
        enableCaching: false,
        qualityThreshold: 0.9
      };
      const analyzer = new DataAnalyzer(mockLLMProvider, config);
      expect(analyzer.getConfig().maxDatasetSize).toBe(5000);
      expect(analyzer.getConfig().enableCaching).toBe(false);
      expect(analyzer.getConfig().qualityThreshold).toBe(0.9);
    });

    test('should get current metrics', () => {
      const metrics = dataAnalyzer.getMetrics();
      expect(metrics).toHaveProperty('datasetsProcessed');
      expect(metrics).toHaveProperty('analysisAccuracy');
      expect(metrics).toHaveProperty('avgProcessingTime');
      expect(typeof metrics.datasetsProcessed).toBe('number');
    });
  });

  describe('Data Quality Assessment', () => {
    test('should assess data quality comprehensively', async () => {
      const quality = await dataAnalyzer.assessDataQuality(sampleDataset);
      
      expect(quality).toHaveProperty('completeness');
      expect(quality).toHaveProperty('accuracy');
      expect(quality).toHaveProperty('consistency');
      expect(quality).toHaveProperty('validity');
      expect(quality).toHaveProperty('uniqueness');
      expect(quality).toHaveProperty('timeliness');
      expect(quality).toHaveProperty('issues');
      
      expect(quality.completeness).toBeGreaterThanOrEqual(0);
      expect(quality.completeness).toBeLessThanOrEqual(1);
      expect(Array.isArray(quality.issues)).toBe(true);
    });

    test('should identify data quality issues', async () => {
      const datasetWithIssues: Dataset = {
        ...sampleDataset,
        data: [
          { id: 1, age: 25, income: 50000, category: 'A', active: true },
          { id: 2, age: null, income: 60000, category: 'B', active: true },
          { id: 3, age: 35, income: -70000, category: 'A', active: false },
          { id: 1, age: 40, income: 80000, category: 'C', active: true }
        ]
      };

      const quality = await dataAnalyzer.assessDataQuality(datasetWithIssues);
      expect(quality.issues.length).toBeGreaterThan(0);
      expect(quality.completeness).toBeLessThan(1);
    });

    test('should provide improvement recommendations', async () => {
      const recommendations = await dataAnalyzer.generateQualityRecommendations(sampleDataset);
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(typeof recommendations[0]).toBe('string');
    });
  });

  describe('Descriptive Statistics', () => {
    test('should calculate comprehensive descriptive statistics', async () => {
      const stats = await dataAnalyzer.performDescriptiveStatistics(sampleDataset);
      
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThan(0);
      
      const ageStats = stats.find(s => s.column === 'age');
      expect(ageStats).toBeDefined();
      expect(ageStats!.count).toBe(5);
      expect(ageStats!.mean).toBeDefined();
      expect(ageStats!.median).toBeDefined();
      expect(ageStats!.std).toBeDefined();
      expect(ageStats!.min).toBeDefined();
      expect(ageStats!.max).toBeDefined();
    });

    test('should handle categorical data appropriately', async () => {
      const stats = await dataAnalyzer.performDescriptiveStatistics(sampleDataset);
      const categoryStats = stats.find(s => s.column === 'category');
      
      expect(categoryStats).toBeDefined();
      expect(categoryStats!.count).toBe(5);
      expect(categoryStats!.mode).toBeDefined();
      expect(categoryStats!.uniqueValues).toBeDefined();
    });

    test('should calculate distribution information', async () => {
      const stats = await dataAnalyzer.performDescriptiveStatistics(sampleDataset);
      const numericStats = stats.filter(s => s.mean !== undefined);
      
      numericStats.forEach(stat => {
        expect(stat.distribution).toBeDefined();
        expect(stat.skewness).toBeDefined();
        expect(stat.kurtosis).toBeDefined();
      });
    });
  });

  describe('Correlation Analysis', () => {
    test('should find correlations between numeric variables', async () => {
      const correlations = await dataAnalyzer.findCorrelations(sampleDataset);
      
      expect(Array.isArray(correlations)).toBe(true);
      expect(correlations.length).toBeGreaterThan(0);
      
      const correlation = correlations[0];
      expect(correlation).toHaveProperty('variable1');
      expect(correlation).toHaveProperty('variable2');
      expect(correlation).toHaveProperty('coefficient');
      expect(correlation).toHaveProperty('pValue');
      expect(correlation).toHaveProperty('interpretation');
      
      expect(correlation.coefficient).toBeGreaterThanOrEqual(-1);
      expect(correlation.coefficient).toBeLessThanOrEqual(1);
    });

    test('should calculate different correlation types', async () => {
      const pearsonCorr = await dataAnalyzer.calculateCorrelation(
        sampleDataset, 'age', 'income', 'pearson'
      );
      expect(pearsonCorr).toHaveProperty('coefficient');
      expect(pearsonCorr).toHaveProperty('pValue');
      expect(pearsonCorr).toHaveProperty('confidenceInterval');
    });

    test('should provide correlation interpretation', async () => {
      const correlations = await dataAnalyzer.findCorrelations(sampleDataset);
      correlations.forEach(corr => {
        expect(corr.interpretation).toBeDefined();
        expect(typeof corr.interpretation).toBe('string');
        expect(corr.interpretation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Outlier Detection', () => {
    test('should detect outliers using multiple methods', async () => {
      const outliers = await dataAnalyzer.detectOutliers(sampleDataset);
      
      expect(Array.isArray(outliers)).toBe(true);
      outliers.forEach(outlier => {
        expect(outlier).toHaveProperty('method');
        expect(outlier).toHaveProperty('column');
        expect(outlier).toHaveProperty('outlierIndices');
        expect(outlier).toHaveProperty('outlierValues');
        expect(outlier).toHaveProperty('threshold');
        expect(outlier).toHaveProperty('explanation');
      });
    });

    test('should provide outlier recommendations', async () => {
      const outliers = await dataAnalyzer.detectOutliers(sampleDataset);
      outliers.forEach(outlier => {
        expect(outlier.recommendations).toBeDefined();
        expect(Array.isArray(outlier.recommendations)).toBe(true);
      });
    });

    test('should handle different outlier detection methods', async () => {
      const methods = ['zscore', 'iqr', 'isolation_forest'];
      
      for (const method of methods) {
        const outliers = await dataAnalyzer.detectOutliers(sampleDataset, { method: method as any });
        expect(outliers.some(o => o.method === method)).toBe(true);
      }
    });
  });

  describe('Machine Learning', () => {
    test('should train predictive models', async () => {
      const model = await dataAnalyzer.trainPredictiveModel(sampleDataset, 'income');
      
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('type');
      expect(model).toHaveProperty('target');
      expect(model).toHaveProperty('features');
      expect(model).toHaveProperty('performance');
      expect(model).toHaveProperty('metadata');
      
      expect(model.target).toBe('income');
      expect(model.performance.accuracy).toBeGreaterThan(0);
      expect(model.performance.accuracy).toBeLessThanOrEqual(1);
    });

    test('should perform clustering analysis', async () => {
      const clustering = await dataAnalyzer.performClustering(sampleDataset);
      
      expect(clustering).toHaveProperty('algorithm');
      expect(clustering).toHaveProperty('clusters');
      expect(clustering).toHaveProperty('centroids');
      expect(clustering).toHaveProperty('assignments');
      expect(clustering).toHaveProperty('metrics');
      
      expect(Array.isArray(clustering.clusters)).toBe(true);
      expect(Array.isArray(clustering.assignments)).toBe(true);
      expect(clustering.assignments.length).toBe(sampleDataset.data.length);
    });

    test('should perform classification', async () => {
      const classification = await dataAnalyzer.performClassification(
        sampleDataset, 'category'
      );
      
      expect(classification).toHaveProperty('model');
      expect(classification).toHaveProperty('accuracy');
      expect(classification).toHaveProperty('confusionMatrix');
      expect(classification).toHaveProperty('featureImportance');
      expect(classification).toHaveProperty('crossValidation');
      
      expect(classification.accuracy).toBeGreaterThan(0);
      expect(classification.accuracy).toBeLessThanOrEqual(1);
    });

    test('should perform regression analysis', async () => {
      const regression = await dataAnalyzer.performRegression(
        sampleDataset, 'income'
      );
      
      expect(regression).toHaveProperty('model');
      expect(regression).toHaveProperty('r2Score');
      expect(regression).toHaveProperty('mse');
      expect(regression).toHaveProperty('coefficients');
      expect(regression).toHaveProperty('residuals');
      
      expect(regression.r2Score).toBeGreaterThanOrEqual(0);
      expect(regression.r2Score).toBeLessThanOrEqual(1);
    });
  });

  describe('Advanced Analytics', () => {
    test('should perform time series analysis', async () => {
      const timeSeriesData: Dataset = {
        ...sampleDataset,
        data: Array.from({ length: 100 }, (_, i) => ({
          timestamp: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
          value: Math.sin(i * 0.1) + Math.random() * 0.1,
          trend: i * 0.01
        }))
      };

      const analysis = await dataAnalyzer.performTimeSeriesAnalysis(
        timeSeriesData, 'value'
      );
      
      expect(analysis).toHaveProperty('trend');
      expect(analysis).toHaveProperty('seasonality');
      expect(analysis).toHaveProperty('stationarity');
      expect(analysis).toHaveProperty('forecast');
      expect(analysis).toHaveProperty('decomposition');
    });

    test('should perform feature engineering', async () => {
      const features = await dataAnalyzer.performFeatureEngineering(sampleDataset);
      
      expect(features).toHaveProperty('newFeatures');
      expect(features).toHaveProperty('transformations');
      expect(features).toHaveProperty('encodings');
      expect(features).toHaveProperty('scalings');
      
      expect(Array.isArray(features.newFeatures)).toBe(true);
      expect(Array.isArray(features.transformations)).toBe(true);
    });

    test('should perform dimensionality reduction', async () => {
      const reduction = await dataAnalyzer.performDimensionalityReduction(
        sampleDataset, { method: 'pca', components: 2 }
      );
      
      expect(reduction).toHaveProperty('method');
      expect(reduction).toHaveProperty('transformedData');
      expect(reduction).toHaveProperty('explainedVariance');
      expect(reduction).toHaveProperty('components');
      
      expect(reduction.method).toBe('pca');
      expect(Array.isArray(reduction.transformedData)).toBe(true);
    });
  });

  describe('Statistical Testing', () => {
    test('should perform hypothesis testing', async () => {
      const testResult = await dataAnalyzer.performHypothesisTest(
        sampleDataset, 'age', { test: 'ttest', null_hypothesis: 30 }
      );
      
      expect(testResult).toHaveProperty('test');
      expect(testResult).toHaveProperty('statistic');
      expect(testResult).toHaveProperty('pValue');
      expect(testResult).toHaveProperty('conclusion');
      expect(testResult).toHaveProperty('effect_size');
      
      expect(testResult.pValue).toBeGreaterThanOrEqual(0);
      expect(testResult.pValue).toBeLessThanOrEqual(1);
    });

    test('should perform A/B testing', async () => {
      const groupA = [1, 2, 3, 4, 5];
      const groupB = [2, 3, 4, 5, 6];
      
      const abTest = await dataAnalyzer.performABTest(groupA, groupB);
      
      expect(abTest).toHaveProperty('statistic');
      expect(abTest).toHaveProperty('pValue');
      expect(abTest).toHaveProperty('effect_size');
      expect(abTest).toHaveProperty('confidence_interval');
      expect(abTest).toHaveProperty('recommendation');
    });

    test('should calculate confidence intervals', async () => {
      const ci = await dataAnalyzer.calculateConfidenceInterval(
        [1, 2, 3, 4, 5], 0.95
      );
      
      expect(ci).toHaveProperty('lower');
      expect(ci).toHaveProperty('upper');
      expect(ci).toHaveProperty('confidence_level');
      expect(ci).toHaveProperty('margin_of_error');
      
      expect(ci.lower).toBeLessThan(ci.upper);
      expect(ci.confidence_level).toBe(0.95);
    });
  });

  describe('Data Visualization Support', () => {
    test('should generate visualization recommendations', async () => {
      const vizRecs = await dataAnalyzer.recommendVisualizations(sampleDataset);
      
      expect(Array.isArray(vizRecs)).toBe(true);
      expect(vizRecs.length).toBeGreaterThan(0);
      
      vizRecs.forEach(rec => {
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('variables');
        expect(rec).toHaveProperty('purpose');
        expect(rec).toHaveProperty('priority');
      });
    });

    test('should prepare data for specific visualization types', async () => {
      const scatterData = await dataAnalyzer.prepareVisualizationData(
        sampleDataset, 'scatter', ['age', 'income']
      );
      
      expect(scatterData).toHaveProperty('data');
      expect(scatterData).toHaveProperty('config');
      expect(scatterData).toHaveProperty('annotations');
      
      expect(Array.isArray(scatterData.data)).toBe(true);
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle large datasets efficiently', async () => {
      const largeDataset: Dataset = {
        ...sampleDataset,
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          value: Math.random() * 100,
          category: Math.random() > 0.5 ? 'A' : 'B'
        })),
        size: 1000
      };

      const startTime = Date.now();
      const stats = await dataAnalyzer.performDescriptiveStatistics(largeDataset);
      const endTime = Date.now();
      
      expect(stats).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should cache results when enabled', async () => {
      const firstCall = await dataAnalyzer.performDescriptiveStatistics(sampleDataset);
      const secondCall = await dataAnalyzer.performDescriptiveStatistics(sampleDataset);
      
      expect(firstCall).toEqual(secondCall);
    });

    test('should validate dataset size limits', async () => {
      const oversizedDataset: Dataset = {
        ...sampleDataset,
        size: 200000 // Exceeds default limit
      };

      await expect(
        dataAnalyzer.performDescriptiveStatistics(oversizedDataset)
      ).rejects.toThrow('Dataset size exceeds maximum limit');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid dataset gracefully', async () => {
      const invalidDataset = { ...sampleDataset, data: [] };
      
      await expect(
        dataAnalyzer.performDescriptiveStatistics(invalidDataset)
      ).rejects.toThrow('Dataset is empty');
    });

    test('should handle missing target variable in ML', async () => {
      await expect(
        dataAnalyzer.trainPredictiveModel(sampleDataset, 'nonexistent_column')
      ).rejects.toThrow('Target variable not found');
    });

    test('should handle insufficient data for analysis', async () => {
      const smallDataset = {
        ...sampleDataset,
        data: [sampleDataset.data[0]]
      };
      
      await expect(
        dataAnalyzer.performClustering(smallDataset)
      ).rejects.toThrow('Insufficient data for clustering');
    });
  });

  describe('Integration Tests', () => {
    test('should perform end-to-end data analysis workflow', async () => {
      // Quality assessment
      const quality = await dataAnalyzer.assessDataQuality(sampleDataset);
      expect(quality.completeness).toBeGreaterThan(0.8);
      
      // Descriptive statistics
      const stats = await dataAnalyzer.performDescriptiveStatistics(sampleDataset);
      expect(stats.length).toBeGreaterThan(0);
      
      // Correlation analysis
      const correlations = await dataAnalyzer.findCorrelations(sampleDataset);
      expect(correlations.length).toBeGreaterThan(0);
      
      // Outlier detection
      const outliers = await dataAnalyzer.detectOutliers(sampleDataset);
      expect(Array.isArray(outliers)).toBe(true);
      
      // Machine learning
      const model = await dataAnalyzer.trainPredictiveModel(sampleDataset, 'income');
      expect(model.performance.accuracy).toBeGreaterThan(0);
    });

    test('should integrate with LLM for advanced insights', async () => {
      const insights = await dataAnalyzer.generateDataInsights(sampleDataset);
      
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
      
      insights.forEach(insight => {
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('significance');
        expect(insight).toHaveProperty('confidence');
      });
    });
  });
});