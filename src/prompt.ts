export function prompt(question: string): Promise<string> {
  process.stdout.write(question);
  return new Promise((resolve) => {
    const onData = (chunk: Buffer) => {
      process.stdin.off("data", onData);
      process.stdin.pause();
      resolve(chunk.toString("utf-8").replace(/\r?\n$/, ""));
    };
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}

export function promptHidden(question: string): Promise<string> {
  process.stdout.write(question);
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf-8");

    let input = "";
    const onData = (ch: string) => {
      switch (ch) {
        case "\n":
        case "\r":
        case "\u0004":
          stdin.setRawMode?.(wasRaw ?? false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          resolve(input);
          break;
        case "\u0003": // Ctrl+C
          process.exit(130);
        case "\u007f": // backspace
          input = input.slice(0, -1);
          break;
        default:
          input += ch;
      }
    };
    stdin.on("data", onData);
  });
}
