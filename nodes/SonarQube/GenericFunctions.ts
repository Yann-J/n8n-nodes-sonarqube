import {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	IWebhookFunctions,
	NodeOperationError,
} from 'n8n-workflow';

const MAX_PAGE_SIZE = 500;
const MAX_PAGES = 1000;

export async function sonarQubeApiRequest(
	this: IExecuteFunctions | IWebhookFunctions | IHookFunctions | ILoadOptionsFunctions,
	options: any,
): Promise<any> {
	const credentials = await this.getCredentials('sonarQubeApi');
	if (credentials === undefined) {
		throw new NodeOperationError(this.getNode(), 'No credentials got returned!');
	}

	const opt = {
		json: true,
		headers: {
			Authorization: 'Bearer ' + credentials.token,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		baseURL: credentials.domain as string,
		...options,
	};

	return this.helpers.request(opt);
}

export async function getMetrics(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const responseData = await scrollRequest.call(
		this,
		{
			uri: '/api/metrics/search',
		},
		{
			resultsKey: 'metrics',
		},
	);

	return (
		responseData?.map((metric: any) => ({
			name: metric.name,
			value: metric.key,
		})) || []
	);
}

export async function scrollRequest(
	this: IExecuteFunctions | IWebhookFunctions | IHookFunctions | ILoadOptionsFunctions,
	options: any,
	scrollOptions: any,
): Promise<any[]> {
	const results = [];

	const opt = Object.assign({}, options);
	opt.qs = Object.assign({}, opt.qs);
	opt.qs.p = 1;
	opt.qs.ps = MAX_PAGE_SIZE;

	while (opt.qs.p < MAX_PAGES) {
		const response = await sonarQubeApiRequest.call(this, opt);

		if (
			response &&
			response[scrollOptions.resultsKey] &&
			response[scrollOptions.resultsKey].length > 0
		) {
			results.push(...response[scrollOptions.resultsKey]);
		} else {
			break;
		}

		opt.qs.p++;
	}

	return results;
}
