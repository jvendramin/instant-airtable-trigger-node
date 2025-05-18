import type {
	IHookFunctions,
	IWebhookFunctions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

import {
	airtableApiRequest,
	extractFieldInfo,
	getBases,
	getFields
} from './GenericFunctions';

export class AirtableTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'vwork Instant Airtable Trigger',
		name: 'airtableTrigger',
		icon: 'file:nodelogo.svg',
		group: ['trigger'],
		version: 1,
		description: 'Handles Airtable events via webhooks',
		defaults: {
			name: 'vwork Instant Airtable Trigger',
		},
		inputs: [],
		outputs: [{ type: NodeConnectionType.Main }],
		credentials: [
			{
				name: 'airtableApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Base Name or ID',
				name: 'base',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getBases',
				},
				required: true,
				default: '',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'Table Name or ID',
				name: 'table',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTables',
					loadOptionsDependsOn: ['base'],
				},
				required: true,
				default: '',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'Fields to Watch For Changes',
				name: 'fieldsToWatch',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getFields',
					loadOptionsDependsOn: ['base', 'table'],
				},
				default: [],
				description: 'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'Extra Fields to Include in Output',
				name: 'fieldsToInclude',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getFields',
					loadOptionsDependsOn: ['base', 'table'],
				},
				default: [],
				description: 'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'Include Previous Cell Values?',
				name: 'includePreviousValues',
				type: 'boolean',
				default: true,
				description: 'Whether to include previous field values in the output',
			},
			{
				displayName: 'Event Types',
				name: 'eventTypes',
				type: 'multiOptions',
				options: [
					{
						name: 'Record Created',
						value: 'add',
						description: 'Trigger when a record is created',
					},
					{
						name: 'Record Updated',
						value: 'update',
						description: 'Trigger when a record is updated',
					},
					{
						name: 'Record Deleted',
						value: 'remove',
						description: 'Trigger when a record is deleted',
					},
				],
				required: true,
				default: ['update'],
				description: 'The events to listen for',
			},
		],
	};

	methods = {
		loadOptions: {
			async getBases(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				console.log('Loading bases...');
				try {
					const bases = await getBases.call(this);
					console.log('Loaded bases:', bases);

					return bases.map(base => ({
						name: base.name,
						value: base.id,
					}));
				} catch (error) {
					console.error('Error loading bases:', error);
					return [];
				}
			},

			async getTables(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				console.log('Loading tables...');
				const baseId = this.getNodeParameter('base', '') as string;

				if (!baseId) {
					console.log('No base ID provided');
					return [];
				}

				try {
					// Direct API call to get tables
					const endpoint = `/meta/bases/${baseId}/tables`;
					console.log(`Calling API endpoint: ${endpoint}`);
					const response = await airtableApiRequest.call(this, 'GET', endpoint);

					console.log('Tables API response received');

					if (!response.tables || !Array.isArray(response.tables)) {
						console.error('Invalid response format: tables array is missing');
						return [];
					}

					console.log(`Loaded ${response.tables.length} tables from base ${baseId}`);
					response.tables.forEach((table: any) => {
						console.log(`- Table: ${table.name}, ID: ${table.id}, Fields: ${table.fields ? table.fields.length : 0}`);
					});

					return response.tables.map((table: any) => ({
						name: table.name,
						value: table.id,
						description: `${table.fields ? table.fields.length : 0} fields available`,
					}));
				} catch (error) {
					console.error('Error loading tables:', error);
					return [];
				}
			},

			async getFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				console.log('getFields method called in node');
				const baseId = this.getNodeParameter('base', '') as string;
				const tableId = this.getNodeParameter('table', '') as string;

				if (!baseId || !tableId) {
					console.log('Missing baseId or tableId');
					return [];
				}

				try {
					console.log(`Requesting fields for base: ${baseId}, table: ${tableId}`);
					const fields = await getFields.call(this, baseId, tableId);
					console.log(`Retrieved ${fields.length} fields:`, fields);

					if (!fields || fields.length === 0) {
						console.log('No fields returned from API');
						return [];
					}

					return fields.map(field => ({
						name: field.name,
						value: field.id,
						description: `Type: ${field.type}`,
					}));
				} catch (error) {
					console.error('Error in getFields:', error);
					return [];
				}
			},
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				console.log('Checking if webhook exists...');
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId === undefined) {
					console.log('No webhook ID in static data');
					return false;
				}

				try {
					const baseId = webhookData.baseId as string;
					console.log(`Checking if webhook ${webhookData.webhookId} exists for base ${baseId}`);

					const endpoint = `/bases/${baseId}/webhooks`;
					const { webhooks } = await airtableApiRequest.call(this, 'GET', endpoint);

					console.log('Existing webhooks:', webhooks);

					for (const webhook of webhooks) {
						if (webhook.id === webhookData.webhookId) {
							console.log('Webhook found');
							return true;
						}
					}

					console.log('Webhook not found');
					return false;
				} catch (error) {
					console.error('Error checking webhook existence:', error);
					return false;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				console.log('Creating webhook...');
				const webhookUrl = this.getNodeWebhookUrl('default');
				const webhookData = this.getWorkflowStaticData('node');

				const baseId = this.getNodeParameter('base') as string;
				const tableId = this.getNodeParameter('table') as string;
				const fieldsToWatch = this.getNodeParameter('fieldsToWatch', []) as string[];
				const includePreviousValues = this.getNodeParameter('includePreviousValues') as boolean;

				console.log('Parameters:', {
					baseId,
					tableId,
					fieldsToWatch,
					includePreviousValues,
					webhookUrl
				});

				try {
					const endpoint = `/bases/${baseId}/webhooks`;

					// Prepare the webhook specification
					const body: any = {
						notificationUrl: webhookUrl,
						specification: {
							options: {
								filters: {
									dataTypes: ['tableData'],
									recordChangeScope: tableId
								},
								includes: {
									includePreviousCellValues: includePreviousValues
								}
							}
						}
					};

					// Add fields to watch if specified
					if (fieldsToWatch && fieldsToWatch.length > 0) {
						body.specification.options.filters.watchDataInFieldIds = fieldsToWatch;
					}

					// Add fields to include in the output
					const fieldsToInclude = this.getNodeParameter('fieldsToInclude', []) as string[];
					if (fieldsToInclude && fieldsToInclude.length > 0) {
						body.specification.options.includes.includeCellValuesInFieldIds = fieldsToInclude;
						console.log('Including these fields in the webhook payload:', fieldsToInclude);
					}

					console.log('Creating webhook with body:', body);

					const response = await airtableApiRequest.call(this, 'POST', endpoint, body);
					console.log('Webhook creation response:', response);

					webhookData.webhookId = response.id;
					webhookData.baseId = baseId;
					webhookData.tableId = tableId;
					webhookData.macSecretBase64 = response.macSecretBase64;
					webhookData.lastCursor = 1; // Start with cursor 1
					webhookData.fieldsToInclude = this.getNodeParameter('fieldsToInclude', []) as string[];

					console.log('Webhook created successfully:', {
						webhookId: webhookData.webhookId,
						baseId: webhookData.baseId,
						macSecret: webhookData.macSecretBase64,
					});

					return true;
				} catch (error) {
					console.error('Error creating webhook:', error);
					throw error;
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				console.log('Deleting webhook...');
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId === undefined || webhookData.baseId === undefined) {
					console.log('No webhook ID or base ID to delete');
					return false;
				}

				try {
					const endpoint = `/bases/${webhookData.baseId}/webhooks/${webhookData.webhookId}`;
					console.log(`Deleting webhook ${webhookData.webhookId} from base ${webhookData.baseId}`);

					await airtableApiRequest.call(this, 'DELETE', endpoint);

					// Clean up the static data
					delete webhookData.webhookId;
					delete webhookData.baseId;
					delete webhookData.tableId;
					delete webhookData.macSecretBase64;
					delete webhookData.lastCursor;
					delete webhookData.fieldsToInclude;

					console.log('Webhook deleted successfully');

					return true;
				} catch (error) {
					console.error('Error deleting webhook:', error);
					return false;
				}
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		console.log('Webhook triggered');
		const req = this.getRequestObject();
		const webhookData = this.getWorkflowStaticData('node');

		console.log('Webhook request body:', req.body);

		// Verify this is an Airtable webhook ping and not just any random request
		if (!req.body || !req.body.base || !req.body.webhook) {
			console.log('Invalid webhook request');
			return {};
		}

		try {
			// Extract data from the initial webhook notification
			const baseId = req.body.base.id;
			const webhookId = req.body.webhook.id;
			const timestamp = req.body.timestamp;

			console.log('Processing webhook notification:', { baseId, webhookId, timestamp });

			// First, get the webhook details to obtain the cursor for the next payload
			const webhookEndpoint = `/bases/${baseId}/webhooks`;
			const webhooksResponse = await airtableApiRequest.call(this, 'GET', webhookEndpoint);

			console.log('Webhooks response:', webhooksResponse);

			let cursorForNextPayload = 1;

			// Find the current webhook in the list
			if (webhooksResponse && webhooksResponse.webhooks) {
				for (const webhook of webhooksResponse.webhooks) {
					if (webhook.id === webhookId) {
						cursorForNextPayload = webhook.cursorForNextPayload || 1;
						console.log('Found webhook, next cursor:', cursorForNextPayload);
						break;
					}
				}
			}

			// Store this cursor for future use
			webhookData.lastCursor = cursorForNextPayload;

			// Fetch the actual webhook payload data
			const payloadEndpoint = `/bases/${baseId}/webhooks/${webhookId}/payloads`;
			const queryParams = { cursor: cursorForNextPayload - 1 }; // Use previous cursor to get the current payload

			console.log('Fetching payload with cursor:', queryParams.cursor);

			const payloadsResponse = await airtableApiRequest.call(this, 'GET', payloadEndpoint, {}, queryParams);

			console.log('Payloads response:', payloadsResponse);

			if (!payloadsResponse.payloads || payloadsResponse.payloads.length === 0) {
				console.log('No payloads found');
				return {};
			}

			// Extract data from the payloads
			const formattedPayloads = [];
			const fieldsToInclude = (webhookData.fieldsToInclude as string[]) || [];

			console.log('Fields to include in output:', fieldsToInclude);

			for (const payload of payloadsResponse.payloads) {
				console.log('Processing payload:', payload);

				if (!payload.changedTablesById) {
					console.log('No table changes in payload');
					continue;
				}

				for (const tableId in payload.changedTablesById) {
					console.log(`Processing changes for table: ${tableId}`);
					if (!webhookData.tableId || tableId === webhookData.tableId) {
						const tableData = payload.changedTablesById[tableId];
						const changedRecords = tableData.changedRecordsById;

						console.log(`Found ${Object.keys(changedRecords).length} changed records in table ${tableId}`);

						// Extract field changes
						const fieldInfos = extractFieldInfo(changedRecords, fieldsToInclude);
						console.log(`Extracted ${fieldInfos.length} field info entries with included data`);

						for (const fieldInfo of fieldInfos) {
							formattedPayloads.push({
								...fieldInfo,
								changedBy: payload.actionMetadata?.sourceMetadata?.user ? {
									userId: payload.actionMetadata.sourceMetadata.user.id,
									userName: payload.actionMetadata.sourceMetadata.user.name,
									userEmail: payload.actionMetadata.sourceMetadata.user.email,
								} : undefined,
								timestamp: payload.timestamp,
							});
						}
					}
				}
			}

			console.log('Formatted payloads:', formattedPayloads);

			return {
				workflowData: [
					this.helpers.returnJsonArray(formattedPayloads),
				],
			};
		} catch (error) {
			console.error('Error processing webhook:', error);
			// If there's an error, still return the original request body
			// so we have some data to work with for debugging
			return {
				workflowData: [
					this.helpers.returnJsonArray([req.body]),
				],
			};
		}
	}
}
