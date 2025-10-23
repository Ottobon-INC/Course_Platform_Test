import { createApp } from "./app";
import { env } from "./config/env";
const app = createApp();
app.listen(env.port, () => {
    console.log(`API ready on http://localhost:${env.port}`);
    const dbUrl = new URL(env.databaseUrl);
    console.log(`Database connected to ${dbUrl.host}/${dbUrl.pathname.replace("/", "")}`);
});
