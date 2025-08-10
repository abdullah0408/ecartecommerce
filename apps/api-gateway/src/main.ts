import express, { Request } from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

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
 * HTTP request logging middleware for Node.js using Morgan.
 *
 * Logs HTTP requests to the console in different formats depending on needs:
 *
 * - 'combined': Detailed Apache-style logs with IP, user, date, method, URL, status, referrer, and user-agent. Suitable for production logging.
 * - 'common': Similar to combined but excludes referrer and user-agent.
 * - 'dev': Concise, colored output showing method, URL, status, response time, and response length. Great for development.
 * - 'short': Shorter output including method, URL, status, and response time.
 * - 'tiny': Minimal output showing method, URL, status, response length, and response time.
 *
 * This app uses 'dev' for concise, readable logs during development.
 */
app.use(morgan('dev'));

/**
 * Middleware to parse incoming JSON request bodies.
 *
 * This enables Express to automatically parse JSON payloads in incoming HTTP requests
 * and make the parsed data available in req.body.
 *
 * The `limit: "100mb"` option increases the maximum allowed size for JSON bodies to 100 megabytes,
 * which is useful if your application expects to handle large JSON payloads.
 *
 * Without this, requests with JSON bodies larger than the default limit would be rejected with an error.
 */
app.use(express.json({ limit: '100mb' }));

/**
 * Middleware to parse incoming URL-encoded form data.
 *
 * This enables Express to automatically parse requests with
 * 'application/x-www-form-urlencoded' content type,
 * commonly used by HTML forms.
 *
 * The `extended: true` option allows parsing of rich objects and nested arrays
 * using the qs library.
 *
 * The `limit: "100mb"` option increases the maximum allowed size for URL-encoded bodies to 100 megabytes,
 * which helps if large form submissions are expected.
 */
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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

/**
 * Trust the first proxy in front of the Express app.
 *
 * This is necessary when the app is behind a proxy or load balancer
 * that forwards client requests.
 *
 * By trusting the proxy, Express uses the X-Forwarded-* headers to:
 * - Determine the original client's IP address (req.ip).
 * - Detect if the original request was made via HTTPS (req.secure).
 *
 * The number 1 means to trust only the first proxy.
 */
app.set('trust proxy', 1);

/**
 * Rate limiting middleware to control request frequency and protect the server.
 * 
 * - Limits requests within a 15-minute window (`windowMs`).
 * - Dynamically sets the maximum allowed requests based on whether the request has a user:
 *   - Authenticated users (`request.user` exists) get a higher limit (1000 requests).
 *   - Unauthenticated users get a lower limit (100 requests).
 * - Sends a JSON error message when the limit is exceeded.
 * - Enables sending standardized rate limit info in response headers:
 *   - `RateLimit-*` headers (modern standard).
 *   - `X-RateLimit-*` headers (legacy support for older clients).
 * 
 * This helps prevent abuse and denial-of-service attacks while allowing
 * authenticated users more generous usage.
 */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (request: Request & { user?: unknown }) => (request.user ? 1000 : 100),
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: true, // Use the legacy `X-RateLimit-*` headers
  })
);

app.get('/gateway-health', (req, res) => {
  res.send({ message: 'Welcome to api-gateway!' });
});

app.use("/", proxy("http://localhost:6001"));

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
