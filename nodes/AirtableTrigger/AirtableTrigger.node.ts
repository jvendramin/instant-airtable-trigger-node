// import { createHmac } from 'crypto';
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

export class AirtableTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Airtable Webhook Trigger',
		name: 'airtableTrigger',
		icon: 'file:node_logo.svg',
		group: ['trigger'],
		version: 1,
		description: 'Handles Airtable events via webhooks',
		defaults: {
			name: 'Airtable Webhook Trigger',
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
				displayName: 'Fields to Watch Names or IDs',
				name: 'fieldsToWatch',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getFields',
					loadOptionsDependsOn: ['base', 'table'],
				},
				required: true,
				default: [],
				description: 'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'Fields to Include in Output Names or IDs',
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
				displayName: 'Include Previous Values',
				name: 'includePreviousValues',
				type: 'boolean',
				default: false,
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
					// For simplicity, return mock data for now
					// In a production environment, you would fetch real data from the Airtable API
					const mockBases = [
						{ id: 'appXXXXXXXXXXXXXX', name: 'My Base 1' },
						{ id: 'appYYYYYYYYYYYYYY', name: 'My Base 2' },
					];
					
					console.log('Returning mock bases:', mockBases);
					
					return mockBases.map(base => ({
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
					return [];
				}
				
				try {
					// For simplicity, return mock data for now
					const mockTables = [
						{ id: 'tblXXXXXXXXXXXXXX', name: 'Table 1' },
						{ id: 'tblYYYYYYYYYYYYYY', name: 'Table 2' },
					];
					
					console.log('Returning mock tables:', mockTables);
					
					return mockTables.map(table => ({
						name: table.name,
						value: table.id,
					}));
				} catch (error) {
					console.error('Error loading tables:', error);
					return [];
				}
			},
			
			async getFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				console.log('Loading fields...');
				const baseId = this.getNodeParameter('base', '') as string;
				const tableId = this.getNodeParameter('table', '') as string;
				
				if (!baseId || !tableId) {
					return [];
				}
				
				try {
					// For simplicity, return mock data for now
					const mockFields = [
						{ id: 'fldXXXXXXXXXXXXXX', name: 'Name', type: 'text' },
						{ id: 'fldYYYYYYYYYYYYYY', name: 'Email', type: 'text' },
						{ id: 'fldZZZZZZZZZZZZZZ', name: 'Status', type: 'select' },
					];
					
					console.log('Returning mock fields:', mockFields);
					
					return mockFields.map(field => ({
						name: field.name,
						value: field.id,
						description: `Type: ${field.type}`,
					}));
				} catch (error) {
					console.error('Error loading fields:', error);
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
					// Simplified implementation - in production, you would actually check with the Airtable API
					const baseId = this.getNodeParameter('base') as string;
					console.log(`Would check if webhook ${webhookData.webhookId} exists for base ${baseId}`);
					
					// For now, just return false to test webhook creation
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
				const fieldsToWatch = this.getNodeParameter('fieldsToWatch') as string[];
				const includePreviousValues = this.getNodeParameter('includePreviousValues') as boolean;
				const eventTypes = this.getNodeParameter('eventTypes') as string[];
				
				console.log('Parameters:', {
					baseId,
					tableId,
					fieldsToWatch,
					includePreviousValues,
					eventTypes,
					webhookUrl
				});
				
				try {
					// Simplified implementation - in production, you would make a real API call to Airtable
					console.log('Would create webhook with Airtable API');
					
					// Simulate a successful response
					const mockWebhookId = 'whk_' + Math.random().toString(36).substring(2, 15);
					const mockSecret = 'secret_' + Math.random().toString(36).substring(2, 15);
					
					webhookData.webhookId = mockWebhookId;
					webhookData.baseId = baseId;
					webhookData.macSecretBase64 = mockSecret;
					webhookData.lastCursor = 1; // Start with cursor 1
					
					console.log('Webhook created successfully:', {
						webhookId: webhookData.webhookId,
						baseId: webhookData.baseId,
						macSecret: webhookData.macSecretBase64,
					});
					
					return true;
				} catch (error) {
					console.error('Error creating webhook:', error);
					return false;
				}
			},
			
			async delete(this: IHookFunctions): Promise<boolean> {
				console.log('Deleting webhook...');
				const webhookData = this.getWorkflowStaticData('node');
				
				if (webhookData.webhookId === undefined) {
					console.log('No webhook ID to delete');
					return false;
				}
				
				try {
					// Simplified implementation - in production, you would make a real API call to Airtable
					console.log(`Would delete webhook ${webhookData.webhookId} from Airtable API`);
					
					// Clean up the static data
					delete webhookData.webhookId;
					delete webhookData.baseId;
					delete webhookData.macSecretBase64;
					delete webhookData.lastCursor;
					
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
		const headerData = this.getHeaderData();
		
		console.log('Webhook request body:', req.body);
		console.log('Webhook headers:', headerData);
		
		try {
			// In production, you would use req.body to get the webhook payload from Airtable
			// For now, let's create a mock payload to return
			
			const mockPayload = {
				recordId: 'rec123456789',
				fieldChanged: 'Name',
				fieldChangedId: 'fldXXXXXXXXXXXXXX',
				previousValue: 'Old Name',
				currentValue: 'New Name',
				includedData: {
					'Name': 'New Name',
					'Email': 'test@example.com',
					'Status': 'Active'
				}
			};
			
			console.log('Returning mock payload:', mockPayload);
			
			return {
				workflowData: [
					this.helpers.returnJsonArray([mockPayload]),
				],
			};
		} catch (error) {
			console.error('Error processing webhook:', error);
			return {};
		}
	}
}
