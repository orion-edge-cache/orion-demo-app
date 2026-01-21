/**
 * Local development server
 * Run with: npm run dev
 */
import { app, PORT } from "./app.js";
import { logEnvironment } from "./config.js";
logEnvironment();
app.listen(PORT, () => {
    console.log(`\nGraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`Health check: http://localhost:${PORT}/health\n`);
});
//# sourceMappingURL=server.js.map