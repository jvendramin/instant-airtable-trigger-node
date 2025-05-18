import { 
  IExecuteFunctions, 
  IHookFunctions, 
  IDataObject, 
  ILoadOptionsFunctions, 
  IWebhookFunctions,
  IHttpRequestOptions,
  IHttpRequestMethods
} from 'n8n-workflow';

/**
 * Make an API request to Airtable
 */
export async function airtableApiRequest(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions | IWebhookFunctions,
	method: string,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
	uri?: string,
): Promise<any> {
	const credentials = await this.getCredentials('airtableApi');
	
  // Convert the method string to IHttpRequestMethods type
  const httpMethod = method as IHttpRequestMethods;

  // Create the options object with the correct type
  const options: IHttpRequestOptions = {
    method: httpMethod,
    url: uri || `https://api.airtable.com/v0${endpoint}`,
    headers: {
      Authorization: `Bearer ${credentials.apiKey}`,
      'Content-Type': 'application/json',
    },
  };

  // Only add body if it's not empty
  if (Object.keys(body).length > 0) {
    options.body = body;
  }

  // Only add query parameters if they're not empty
  if (Object.keys(query).length > 0) {
    options.qs = query;
  }

  // Set json option
  options.json = true;

	console.log(`Airtable API Request: ${method} ${options.url}`, { query, body });
	
	try {
		const response = await this.helpers.request!(options);
		console.log('Airtable API Response:', response);
		return response;
	} catch (error) {
		console.error('Airtable API Error:', error);
		throw error;
	}
}

/**
 * Load all available bases
 */
export async function getBases(this: ILoadOptionsFunctions): Promise<Array<{ id: string; name: string }>> {
	const endpoint = '/meta/bases';
	const { bases } = await airtableApiRequest.call(this, 'GET', endpoint);
	return bases;
}

/**
 * Load all tables of a base
 */
export async function getTables(this: ILoadOptionsFunctions, baseId: string): Promise<Array<{ id: string; name: string }>> {
	const endpoint = `/meta/bases/${baseId}/tables`;
	const { tables } = await airtableApiRequest.call(this, 'GET', endpoint);
	return tables;
}

/**
 * Load all fields of a table
 */
export async function getFields(this: ILoadOptionsFunctions, baseId: string, tableId: string): Promise<Array<{ id: string; name: string; type: string }>> {
	const endpoint = `/meta/bases/${baseId}/tables/${tableId}/fields`;
	const { fields } = await airtableApiRequest.call(this, 'GET', endpoint);
	return fields;
}

/**
 * Extract field information from a payload
 */
export function extractFieldInfo(
	changedRecordsById: any,
	fieldsToInclude: string[] = [],
	fieldsByIdMap: Record<string, { name: string }> = {},
): any[] {
	const results: any[] = [];

	for (const recordId in changedRecordsById) {
		const recordData = changedRecordsById[recordId];
		const { current, previous, unchanged } = recordData;

		// Process each changed field
		if (current && current.cellValuesByFieldId) {
			for (const fieldId in current.cellValuesByFieldId) {
				// Skip if this field wasn't in the previous data (meaning it was just added)
				if (!previous || !previous.cellValuesByFieldId || !(fieldId in previous.cellValuesByFieldId)) {
					continue;
				}

				const currentValue = current.cellValuesByFieldId[fieldId];
				const previousValue = previous.cellValuesByFieldId[fieldId];

				// Only include if values are different
				if (JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
					const includedData: Record<string, any> = {};

					// Add fields to include if they exist in unchanged or current data
					if (fieldsToInclude.length > 0) {
						fieldsToInclude.forEach((includeFieldId) => {
							if (unchanged && unchanged.cellValuesByFieldId && includeFieldId in unchanged.cellValuesByFieldId) {
								includedData[includeFieldId] = unchanged.cellValuesByFieldId[includeFieldId];
							} else if (current && current.cellValuesByFieldId && includeFieldId in current.cellValuesByFieldId) {
								includedData[includeFieldId] = current.cellValuesByFieldId[includeFieldId];
							}
						});
					}

					results.push({
						recordId,
						fieldChanged: {
							name: fieldsByIdMap[fieldId]?.name || fieldId,
							id: fieldId,
						},
						values: {
							current: currentValue,
							previous: previousValue,
						},
						includedData,
					});
				}
			}
		}
	}

	return results;
}
