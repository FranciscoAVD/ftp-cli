import { basename, resolve } from "node:path";
import type { FTPClient } from "@/ftp-client";

type Handler = (client: FTPClient, args: string[]) => Promise<void>;

export const handlers: Record<string, { help: string; run: Handler }> = {
  ls: {
    help: "ls [path]            List remote files",
    run: async (client, args) => {
      const res = await client.list(args[0] ?? "/");
      console.log(res.raw);
      if (res.data) process.stdout.write(res.data);
    },
  },
  pwd: {
    help: "pwd                  Print remote working directory",
    run: async (client) => {
      const res = await client.currentDirectory();
      console.log(res.raw);
    },
  },
  cd: {
    help: "cd <path>            Change remote directory",
    run: async (client, args) => {
      if (!args[0]) return console.log("Usage: cd <path>");
      const res = await client.changeDirectory(args[0]);
      console.log(res.raw);
    },
  },
  mkdir: {
    help: "mkdir <path>         Create remote directory",
    run: async (client, args) => {
      if (!args[0]) return console.log("Usage: mkdir <path>");
      const res = await client.makeDirectory(args[0]);
      console.log(res.raw);
    },
  },
  get: {
    help: "get <remote> [local] Download a file",
    run: async (client, args) => {
      if (!args[0]) return console.log("Usage: get <remote> [local]");
      const remote = args[0];
      const localPath = resolve(args[1] ?? basename(remote));
      const res = await client.download(remote);
      console.log(res.raw);
      if (res.ok && res.data) {
        const bytesWritten = await Bun.write(localPath, res.data);
        console.log(`Saved ${bytesWritten} bytes to ${localPath}`);
      }
    },
  },
  put: {
    help: "put <local> [remote] Upload a file",
    run: async (client, args) => {
      if (!args[0]) return console.log("Usage: put <local> [remote]");

      const localPath = resolve(args[0]);
      const remotePath = args[1] ?? basename(localPath);

      const file = Bun.file(localPath);

      if (!(await file.exists())) {
        console.error(`Local file not found: ${localPath}`);
        return;
      }

      const buffer = await file.arrayBuffer();
      const res = await client.upload({
        path: remotePath,
        data: new Uint8Array(buffer),
      });

      console.log(res.raw);
    },
  },
  ascii: {
    help: "ascii                Set ASCII transfer mode",
    run: async (client) => {
      const res = await client.setTransferType("ASCII");
      console.log(res.raw);
    },
  },
  binary: {
    help: "binary               Set binary transfer mode",
    run: async (client) => {
      const res = await client.setTransferType("BINARY");
      console.log(res.raw);
    },
  },
  noop: {
    help: "noop                 Send NOOP keep-alive",
    run: async (client) => {
      const res = await client.noop();
      console.log(res.raw);
    },
  },
  remotehelp: {
    help: "remotehelp [cmd]     Get help from remote server",
    run: async (client, args) => {
      const res = await client.help(args[0]);
      console.log(res.raw);
    },
  },
};

export async function runCommand(
  client: FTPClient,
  command: string,
  args: string[],
): Promise<void> {
  const handler = handlers[command];
  if (!handler) {
    console.log(`?Invalid command: ${command}. Type 'help' for a list.`);
    return;
  }
  await handler.run(client, args);
}

export function printHelp(): void {
  console.log("Available commands:");
  console.log("  open <host> [port]   Connect to FTP server");
  console.log("  close                Disconnect from server");
  for (const { help } of Object.values(handlers)) {
    console.log(`  ${help}`);
  }
  console.log("  help, ?              Show this help");
  console.log("  quit, bye, exit      Exit mftp");
}
