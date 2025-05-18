import {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	NodeApiError,
} from 'n8n-workflow';

export async function airtableApiRequest(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	method: string,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
) {
	const credentials = await this.getCredentials('airtableApi');
	
	// Convert the method to a specific type that n8n expects
	const httpMethod = method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	
	const options = {
		method: httpMethod,
		headers: {
			'Authorization': `Bearer ${credentials.apiKey}`,
			'Content-Type': 'application/json',
		},
		body: Object.keys(body).length ? JSON.stringify(body) : undefined,
		qs,
		url: `https://api.airtable.com/v0${endpoint}`,
		json: true,
	};

	console.log(`Making request to: ${options.url}`);
	console.log(`With method: ${httpMethod}`);
	console.log(`With body: ${options.body}`);
	console.log(`With query: ${JSON.stringify(qs)}`);

	try {
		const response = await this.helpers.httpRequest(options);
		console.log(`Response received: ${JSON.stringify(response)}`);
		return response;
	} catch (error) {
		console.log(`Request error: ${JSON.stringify(error)}`);
		throw new NodeApiError(this.getNode(), error);
	}
}