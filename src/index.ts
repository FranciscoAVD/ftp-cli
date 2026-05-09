#!/usr/bin/env bun
import { Command } from "commander";
import { FTPClient } from "@/ftp-client";
import { startSession } from "@/session";
import { printHelp } from "@/commands";

const program = new Command();

program
  .name("mftp")
  .description("Interactive FTP client")
  .version("1.0.0")
  .argument("[host]", "FTP server hostname")
  .option("-p, --port <port>", "FTP server port", "21")
  .option("-u, --user <user>", "Username for authentication")
  .option("-P, --password <password>", "Password for authentication")
  .action(async (host, opts) => {
    printHelp();
    console.log(""); // Separate from previous
    const client = new FTPClient();
    try {
      await startSession(client, {
        host,
        port: parseInt(opts.port, 10),
      });
    } catch (err) {
      console.error(
        `mftp: ${err instanceof Error ? err.message : String(err)}`,
      );
      process.exit(1);
    }
  });

program.parseAsync();
