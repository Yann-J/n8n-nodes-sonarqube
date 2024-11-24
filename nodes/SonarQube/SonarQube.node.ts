import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { getMetrics, scrollRequest, sonarQubeApiRequest } from './GenericFunctions';

export class SonarQube implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SonarQube',
		name: 'sonarQube',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
		icon: 'file:sonar.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with SonarQube or SonarCloud API',
		defaults: {
			name: 'SonarQube',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'sonarQubeApi',
				required: true,
			},
		],

		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
						name: 'Measures',
						value: 'measures',
					},
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
						name: 'Metrics',
						value: 'metrics',
					},
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
						name: 'Components',
						value: 'components',
					},
				],
				default: 'measures',
			},

			// Measure Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,

				displayOptions: {
					show: {
						resource: ['measures'],
					},
				},
				options: [
					{
						name: 'Component',
						value: 'component',
						description: 'Get component measures',
						action: 'Get component measures',
					},
				],
				default: 'component',
			},

			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,

				displayOptions: {
					show: {
						resource: ['metrics', 'components'],
					},
				},
				options: [
					{
						name: 'Search',
						value: 'search',
						description: 'Search for metrics or components',
						action: 'Search a metric or component',
					},
				],
				default: 'search',
			},

			{
				displayName: `For a list of available component keys, visit your SonarQube portal, or use the 'Search Components' Operation to get a list of all components you have permissions to.`,
				name: 'notice',
				type: 'notice',
				displayOptions: {
					show: {
						resource: ['measures'],
						operation: ['component'],
					},
				},
				default: '',
			},
			{
				displayName: 'Component',
				name: 'component',
				type: 'string',
				requiresDataPath: 'single',
				displayOptions: {
					show: {
						resource: ['measures'],
						operation: ['component'],
					},
				},
				default: '',
			},

			// Measure Parameters
			{
				displayName: `For more information on each metric, visit the <a href="https://docs.sonarqube.org/latest/user-guide/metric-definitions/" target="_blank">SonarQube documentation</a>.
Alternatively, you can use the 'Search Metrics' Operation to get a list of all available metrics and their definitions, or enable the "Metrics" Additional Field on this request.`,
				name: 'notice',
				type: 'notice',
				displayOptions: {
					show: {
						resource: ['measures'],
						operation: ['component'],
					},
				},
				default: '',
			},
			{
				// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options, n8n-nodes-base/node-param-display-name-wrong-for-dynamic-multi-options
				displayName: 'Metrics',
				name: 'metricKeys',
				// eslint-disable-next-line n8n-nodes-base/node-param-description-missing-from-dynamic-multi-options
				type: 'multiOptions',
				// eslint-disable-next-line n8n-nodes-base/node-param-description-wrong-for-dynamic-options
				displayOptions: {
					show: {
						resource: ['measures'],
						operation: ['component'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getMetrics',
				},
				default: [
					'bugs',
					'code_smells',
					'complexity',
					'coverage',
					'duplicated_lines_density',
					'ncloc',
					'reliability_rating',
					'security_rating',
					'sqale_index',
					'sqale_rating',
					'violations',
					'vulnerabilities',
				],
			},

			{
				displayName: 'Branch',
				name: 'branch',
				type: 'string',
				requiresDataPath: 'single',
				displayOptions: {
					show: {
						resource: ['measures'],
						operation: ['component'],
					},
				},
				default: '',
			},

			{
				displayName: 'Pull Request ID',
				name: 'pullRequest',
				type: 'string',
				requiresDataPath: 'single',
				displayOptions: {
					show: {
						resource: ['measures'],
						operation: ['component'],
					},
				},
				default: '',
			},

			{
				displayName: 'Additional Fields',
				name: 'fields',
				type: 'multiOptions',
				displayOptions: {
					show: {
						resource: ['measures'],
						operation: ['component'],
					},
				},
				options: [
					{
						name: 'Periods',
						value: 'periods',
					},
					{
						name: 'Metrics',
						value: 'metrics',
					},
				],
				default: [],
			},

			// Search parameters
			{
				displayName: 'Page',
				name: 'p',
				type: 'number',
				typeOptions: {
					minValue: 1,
					numberPrecision: 0,
				},
				displayOptions: {
					show: {
						resource: ['metrics', 'components'],
						operation: ['search'],
						scroll: [false],
					},
				},
				default: 1,
			},
			{
				displayName: 'Page Size',
				name: 'ps',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 500,
					numberPrecision: 0,
				},
				displayOptions: {
					show: {
						resource: ['metrics', 'components'],
						operation: ['search'],
						scroll: [false],
					},
				},
				default: 100,
			},
			{
				displayName: 'Get All?',
				name: 'scroll',
				type: 'boolean',
				// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
				description: 'Fetch all records at once (automatic pagination)',
				default: false,
				displayOptions: {
					show: {
						resource: ['metrics', 'components'],
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Organization',
				name: 'organization',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['components'],
						operation: ['search'],
					},
				},
				default: '',
			},
			{
				displayName: 'Search Query',
				name: 'q',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['components'],
						operation: ['search'],
					},
				},
				default: '',
			},
		],
	};

	methods = {
		loadOptions: {
			getMetrics,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			item = items[itemIndex];
			try {
				if (resource === 'measures') {
					if (operation === 'component') {
						const component = this.getNodeParameter('component', itemIndex) as string;
						const metricKeys = this.getNodeParameter('metricKeys', itemIndex) as string[];
						const branch = this.getNodeParameter('branch', itemIndex) as string;
						const pullRequest = this.getNodeParameter('pullRequest', itemIndex) as string;
						const additionalFields = this.getNodeParameter('fields', itemIndex) as string[];

						const response = await sonarQubeApiRequest.call(this, {
							url: '/api/measures/component',
							qs: {
								component,
								...(metricKeys && { metricKeys: metricKeys.join(',') }),
								...(branch && { branch }),
								...(pullRequest && { pullRequest }),
								...(additionalFields && { additionalFields: additionalFields.join(',') }),
							},
						});

						item.json = response;
					}
				}

				if (resource === 'metrics') {
					if (operation === 'search') {
						const p = this.getNodeParameter('p', itemIndex, 1) as number;
						const ps = this.getNodeParameter('ps', itemIndex, 500) as number;
						const scroll = this.getNodeParameter('scroll', itemIndex) as boolean;

						let response;
						if (scroll) {
							response = await scrollRequest.call(
								this,
								{
									url: '/api/metrics/search',
								},
								{
									resultsKey: 'metrics',
								},
							);

							return [this.helpers.returnJsonArray(response)];
						} else {
							response = await sonarQubeApiRequest.call(this, {
								url: '/api/metrics/search',
								qs: {
									p,
									ps,
								},
							});
						}

						item.json = response;
					}
				}

				if (resource === 'components') {
					if (operation === 'search') {
						const organization = this.getNodeParameter('organization', itemIndex) as string;
						const p = this.getNodeParameter('p', itemIndex, 1) as number;
						const ps = this.getNodeParameter('ps', itemIndex, 500) as number;
						const q = this.getNodeParameter('q', itemIndex) as number;
						const scroll = this.getNodeParameter('scroll', itemIndex) as boolean;

						let response;
						if (scroll) {
							response = await scrollRequest.call(
								this,
								{
									url: '/api/components/search',
									qs: {
										organization,
										...(q && { q }),
									},
								},
								{
									resultsKey: 'components',
								},
							);

							return [this.helpers.returnJsonArray(response)];
						} else {
							response = await sonarQubeApiRequest.call(this, {
								url: '/api/components/search',
								qs: {
									organization,
									p,
									ps,
									...(q && { q }),
								},
							});
						}

						item.json = response;
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [items];
	}
}
