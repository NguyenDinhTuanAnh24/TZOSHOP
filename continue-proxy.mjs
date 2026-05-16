import http from "http";

const TARGET = "https://tzoshop.io.vn";

const server = http.createServer(async (req, res) => {
  const chunks = [];

  req.on("data", (chunk) => chunks.push(chunk));

  req.on("end", async () => {
    const body = Buffer.concat(chunks).toString("utf8");

    console.log("\n================ CONTINUE REQUEST ================");
    console.log("METHOD:", req.method);
    console.log("URL:", req.url);
    console.log("HEADERS:", req.headers);
    console.log("BODY:", body.slice(0, 3000));
    console.log("==================================================\n");

    try {
      const upstreamUrl = TARGET + req.url;

      const upstreamRes = await fetch(upstreamUrl, {
        method: req.method,
        headers: {
          authorization: req.headers.authorization,
          "content-type": req.headers["content-type"] || "application/json",
          accept: req.headers.accept || "application/json",
        },
        body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
      });

      console.log("UPSTREAM STATUS:", upstreamRes.status);
      console.log("UPSTREAM CONTENT-TYPE:", upstreamRes.headers.get("content-type"));

      const responseHeaders = Object.fromEntries(upstreamRes.headers);
      res.writeHead(upstreamRes.status, responseHeaders);

      if (upstreamRes.body) {
        for await (const chunk of upstreamRes.body) {
          const text = Buffer.from(chunk).toString("utf8");
          console.log("UPSTREAM CHUNK:", text.slice(0, 1000));
          res.write(chunk);
        }
      }

      res.end();
    } catch (error) {
      console.error("[PROXY_ERROR]", error);

      res.writeHead(500, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          error: "proxy_error",
          message: error instanceof Error ? error.message : String(error),
        })
      );
    }
  });
});

server.listen(8787, "127.0.0.1", () => {
  console.log("Continue proxy listening at http://127.0.0.1:8787");
  console.log("Forwarding to https://tzoshop.io.vn");
});
