import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";
import path from "path";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Elite Finance Tracker API",
            version: "1.0.0",
            description:
                "API documentation for Elite Finance Tracker — personal finance management with transactions, categories, assets, analytics, and CSV import.",
        },
        servers: [
            {
                url: "/api",
                description: "API base path",
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "sid",
                },
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                },
            },
        },
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
    },
    apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "Elite Finance API Docs",
    }));

    app.get("/api-docs/swagger.json", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });
}
