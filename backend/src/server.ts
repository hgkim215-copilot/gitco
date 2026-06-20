import Fastify from "fastify";

export function buildServer() {
  const app = Fastify({ logger: true });
  app.get("/api/health", async () => ({ ok: true }));
  app.get("/", async (_req, reply) =>
    reply.type("text/html").send("<h1>AI Chief of Staff</h1>"),
  );
  return app;
}

if (process.argv[1]?.includes("server")) {
  const app = buildServer();
  app
    .listen({ port: Number(process.env.PORT ?? 8080), host: "0.0.0.0" })
    .catch((err) => {
      app.log.error(err);
      process.exit(1);
    });
}
