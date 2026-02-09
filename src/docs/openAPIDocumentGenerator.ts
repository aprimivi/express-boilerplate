import { authRegistry } from "@/routes/auth.routes";
import { userRegistry } from "@/routes/user.routes";
import { monitoringRegistry } from "@/routes/monitoring.routes";
import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { version } from "../../package.json";

export type OpenAPIDocument = ReturnType<OpenApiGeneratorV3["generateDocument"]>;

export function generateOpenAPIDocument(): OpenAPIDocument {
	const registry = new OpenAPIRegistry([authRegistry, userRegistry, monitoringRegistry]);

	// Register security scheme used across all routes
	registry.registerComponent("securitySchemes", "bearerAuth", {
		type: "http",
		scheme: "bearer",
		bearerFormat: "JWT",
	});

	const generator = new OpenApiGeneratorV3(registry.definitions);

	return generator.generateDocument({
		openapi: "3.0.0",
		info: {
			version,
			title: "Express TypeScript API",
			description: "API documentation for Express TypeScript Boilerplate",
			license: {
				name: "MIT",
				url: "https://opensource.org/licenses/MIT",
			},
		},
		servers: [
			{
				url: "/api",
				description: "API server",
			},
		],
		externalDocs: {
			description: "View the raw OpenAPI Specification in JSON format",
			url: "/swagger.json",
		},
	});
}
