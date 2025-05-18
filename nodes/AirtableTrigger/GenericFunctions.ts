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
 * Helper function to extract fields for a specific table
 */
function getFieldsByTableId(tableId: string, data: any) {
  // Validate inputs
  if (!tableId || !data || !data.tables || !Array.isArray(data.tables)) {
    console.log('Invalid data structure for getFieldsByTableId', { tableId, dataKeys: data ? Object.keys(data) : null });
    return null;
  }

  // Find the table with the matching ID
  const table = data.tables.find((table: any) => table.id === tableId);

  // Return the fields array if table found, otherwise null
  return table ? table.fields : null;
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
 * Load all fields of a table
 */
export async function getFields(this: ILoadOptionsFunctions, baseId: string, tableId: string): Promise<Array<{ id: string; name: string; type: string }>> {
	try {
		console.log(`Loading fields for base: ${baseId}, table: ${tableId}`);
		const endpoint = `/meta/bases/${baseId}/tables`;

		console.log(`Calling API endpoint: ${endpoint}`);
		const response = await airtableApiRequest.call(this, 'GET', endpoint);

		console.log('Base schema response received, extracting fields for table:', tableId);

		// Use the helper function to extract fields
		const fields = getFieldsByTableId(tableId, response);

		if (!fields) {
			console.error(`No fields found for table ID: ${tableId}`);
			return [];
		}

		console.log(`Found ${fields.length} fields for table ${tableId}`);
		fields.forEach((field: any, index: number) => {
			console.log(`Field ${index + 1}: id=${field.id}, name=${field.name}, type=${field.type || 'unknown'}`);
		});

		return fields.map((field: any) => ({
			id: field.id,
			name: field.name,
			type: field.type || 'unknown',
		}));
	} catch (error) {
		console.error('Error loading fields:', error);
		throw error;
	}
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

		console.log('Current data:', current);
		console.log('Previous data:', previous);
		console.log('Unchanged data:', unchanged);

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
					// Create includedData as an array of objects with fieldId and value
					const includedData: Array<{fieldId: string, value: any}> = [];

					console.log('Processing unchanged data for record:', recordId);

					// If there's unchanged data, include it in the output
					if (unchanged && unchanged.cellValuesByFieldId) {
						console.log('Unchanged data found with fields:', Object.keys(unchanged.cellValuesByFieldId));

						// Use Object.entries to iterate through all key-value pairs in the object
						for (const [fieldId, value] of Object.entries(unchanged.cellValuesByFieldId)) {
							includedData.push({ fieldId, value });
							console.log(`Added unchanged field ${fieldId} with value:`, value);
						}
					} else {
						console.log('No unchanged data found for record:', recordId);
					}

					// Create the result entry
					const result = {
						recordId,
						fieldChanged: {
							id: fieldId,
						},
						values: {
							current: currentValue,
							previous: previousValue,
						},
						includedData,
					};

					console.log(`Created result with ${includedData.length} included fields:`, result);
					results.push(result);
				}
			}
		}
	}

	return results;
}
