import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SonarQubeApi implements ICredentialType {
	name = 'sonarQubeApi';
	displayName = 'SonarQube API';
	documentationUrl = 'https://docs.sonarsource.com/sonarqube/latest/extension-guide/web-api/';
	properties: INodeProperties[] = [
		{
			displayName: 'Token',
			name: 'token',
			type: 'string',
			default: '',
			typeOptions: {
				password: true,
			},
		},
		{
			displayName: 'Domain',
			name: 'domain',
			type: 'string',
			default: 'https://sonarcloud.io',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{"Bearer " + $credentials.token}}',
				'Content-Type': 'application/json',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.domain}}',
			method: 'GET',
			url: '/api/authentication/validate',
		},
	};
}
