import { DB } from "./db.ts";
import pkg from "./package.json" with { type: "json" };
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { pathToFileURL } from "node:url";

const rl = readline.createInterface({ input: stdin, output: stdout });
// Deno 的 prompt 是同步的，Node 需用 readline 异步实现；EOF 时返回 null 保持语义一致
async function prompt(message = ""): Promise<string | null> {
  try {
    return await rl.question(message);
  } catch {
    return null;
  }
}

const args = process.argv.slice(2);
const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  console.log(`music-db v${pkg.version}`);
  if (args.includes("-v") || args.includes("--version")) process.exit();

  while (true) {
    console.log("Commands: add / add-loop / sync / format (fmt) / exit");
    const input = await prompt(">");
    switch (input) {
      case "exit":
        console.log("Program exit.");
        process.exit();
        break;
      case "add":
        await add();
        break;
      case "add-loop":
        await add(true);
        break;
      case "sync":
        await DB.sync();
        break;
      case "format":
      case "fmt":
        DB.save();
        console.log("Format Complete.");
        break;

      default:
        console.log("Unknow command.");
        break;
    }
    console.log("");
  }
}
async function add(is_loop_adding: boolean = false): Promise<void> {
  do {
    if (is_loop_adding) {
      console.log(
        "\nLoop adding until you input nothing when asking you for name, author or id",
      );
    }

    console.log("Add dova music:");
    const input = await prompt("[name] composed by [Author]>");
    if (!input) {
      console.log("no input anything");
      return;
    }

    const [name, author] = input.split(" composed by ");
    const input2 = await prompt("music id>");
    if (!input2) {
      console.log("no input anything");
      return;
    }
    const id: string = input2;

    const input3 = await prompt("how many tracks>");
    if (!input3) {
      console.log("no input anything. default: only 1 track");
    }
    const tracks = input3 ? Number(input3) : 1;

    const input4 = await prompt(
      `loop? (type "y"${tracks !== 1 ? ', use "," to split each track' : ""})>`,
    );
    const loop: boolean[] = [];
    if (!input4) {
      console.log("input not available, default: both not loop");
    } else {
      for (const str of input4.split(",")) {
        loop.push(str === "y");
      }
    }
    // 补全 loop 数组，不足的补 false
    for (let i = 0; i < tracks; i++) {
      if (!loop[i]) {
        loop[i] = false;
      }
    }
    console.log(
      `Add music: ${name} - ${author} ${tracks} tracks ${DB.getDovaUrl(id)}`,
      "\nloop:",
      `${loop.map((v, i) => `track ${i + 1} ${v ? "✓" : "✕"}`).join(", ")}`,
    );

    // 爬取素材信息违反dova的terms of use，因此手动输入信息

    DB.addDova(author, name, id, tracks, loop);
  } while (is_loop_adding);
}
