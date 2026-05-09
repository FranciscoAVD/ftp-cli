import type { FTPClient } from "@/ftp-client";
import { prompt, promptHidden } from "@/prompt";
import { runCommand, printHelp } from "@/commands";

type SessionOptions = {
  host?: string;
  port: number;
  user?: string;
  password?: string;
};

export async function startSession(
  client: FTPClient,
  opts: SessionOptions,
): Promise<void> {
  let connected = false;

  // Auto-connect if host is provided via CLI args
  if (opts.host) {
    connected = await connect(client, opts.host, opts.port);
    if (connected) await login(client);
  }

  process.on("SIGINT", async () => {
    console.log("\nGoodbye.");
    await client.close().catch(() => {});
    process.exit(0);
  });

  while (true) {
    const input = (await prompt("mftp> ")).trim();
    if (!input) continue;

    const [cmd, ...args] = input.split(/\s+/);
    const command = cmd ? cmd.toLowerCase() : "";

    switch (command) {
      case "quit":
      case "bye":
      case "exit":
        await client.close().catch(() => {});
        console.log("Goodbye.");
        process.exit(0);

      case "help":
      case "?":
        printHelp();
        break;

      case "open":
        if (connected) {
          console.log("Already connected. Use 'close' first.");
        } else {
          const host = args[0] ?? (await prompt("(host) "));
          const port = args[1] ? parseInt(args[1], 10) : 21;
          connected = await connect(client, host, port);
          if (connected) await login(client);
        }
        break;

      case "close":
      case "disconnect":
        if (!connected) {
          console.log("Not connected.");
        } else {
          await client.close().catch(() => {});
          connected = false;
          console.log("Disconnected.");
        }
        break;

      default:
        if (!connected) {
          console.log("Not connected. Use 'open <host> [port]' to connect.");
        } else await runCommand(client, command, args);
        break;
    }
  }
}

async function connect(
  client: FTPClient,
  host: string,
  port: number,
): Promise<boolean> {
  try {
    console.log(`Connecting to ${host}:${port}...`);
    const res = await client.connectControlSocket({ host, port });
    console.log(res.raw);
    return res.ok;
  } catch (err) {
    console.error(
      `Connection failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    return false;
  }
}

async function login(
  client: FTPClient,
  user?: string,
  password?: string,
): Promise<void> {
  const u = user ?? (await prompt("Name: "));
  const userRes = await client.username(u);
  console.log(userRes.raw);

  if (userRes.code === 331) {
    const p = password ?? (await promptHidden("Password: "));
    const passRes = await client.password(p);
    console.log(passRes.raw);
  }

  await client.setTransferType("BINARY").catch(() => {});
}
