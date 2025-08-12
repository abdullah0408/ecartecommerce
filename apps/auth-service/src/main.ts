import express from 'express';
import cors from 'cors';
import { errorMiddleware } from '@libs/middleware/error-handler/error.middleware';
import cookieParser from 'cookie-parser';
import router from './routes/auth.router';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger-output.json';

const app = express();

/**
 * Sets up Cross-Origin Resource Sharing (CORS) middleware for this Express server.
 *
 * CORS allows the backend to accept requests from specific frontend origins
 * and control which headers and credentials are permitted in those requests.
 *
 * Right now, it allows requests from "http://localhost:3000", which is
 * where the frontend runs during development.
 *
 * It explicitly permits the frontend to send the "Authorization" and "Content-Type" headers,
 * which are commonly used for authentication and JSON data.
 *
 * It also enables credentials (such as cookies or HTTP authentication) to be sent
 * with cross-origin requests.
 *
 * This is important because during development the frontend and backend
 * often run on different ports (like 3000 and 8080), which browsers treat
 * as different origins and block unless CORS is enabled with proper headers and credentials.
 *
 * In production, you would replace the origin(s) with your actual frontend domain(s)
 * and ensure the allowed headers and credentials settings match your authentication needs.
 */
app.use(
  cors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
  })
);

/**
 * Middleware to parse incoming JSON request bodies.
 *
 * This enables Express to automatically parse JSON payloads in incoming HTTP requests
 * and make the parsed data available in req.body.
 */
app.use(express.json());

/**
 * Middleware to parse cookies from incoming HTTP requests.
 *
 * This allows the Express app to read cookies sent by the client
 * and access them conveniently via req.cookies.
 *
 * Cookies are commonly used for maintaining sessions, authentication,
 * and storing user preferences.
 *
 * Without this middleware, cookies would need to be manually parsed from headers.
 */
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

/**
 * Swagger API documentation routes.
 *
 * These routes serve the Swagger UI and the JSON specification for the API.
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/docs-json', (_request, response) => {
  response.json(swaggerDocument);
});

/**
 * Mounts authentication routes at the `/api` base path.
 * All routes defined in `router` will be prefixed with `/api`.
 */
app.use('/api', router);

/**
 * Error handling middleware for the application.
 *
 * This middleware is responsible for catching and handling errors that occur
 * during the processing of requests. It ensures that any errors are properly
 * logged and that a consistent error response is sent to the client.
 */
app.use(errorMiddleware);

const port = process.env.PORT || 6001;
const server = app.listen(port, () => {
  console.log(`Auth service listening at http://localhost:${port}/api`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});
server.on('error', console.error);
