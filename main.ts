import { DB } from "./db.ts";
import DenoJson from "./deno.json" with { type: "json" };

if (import.meta.main) {
  console.log(`music-db v${DenoJson.version}`);
  if (Deno.args.includes("-v") || Deno.args.includes("--version")) Deno.exit();

  while (true) {
    console.log("Commands: add / add-loop / sync / format (fmt) / exit");
    const input: string | null = prompt(">");
    switch (input) {
      case "exit":
        console.log("Program exit.");
        Deno.exit();
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
  if (is_loop_adding) {
    console.log(
      "\nLoop adding until you input nothing when asking you for name, author or id",
    );
  }

  console.log("Add dova music:");
  const input = prompt("[name] composed by [Author]>");
  if (!input) {
    console.log("no input anything");
    return;
  }

  const [name, author] = input.split(" composed by ");
  const input2 = prompt("music id>");
  if (!input2) {
    console.log("no input anything");
    return;
  }
  const id: string = input2;

  const input3 = prompt("how many tracks>");
  if (!input3) {
    console.log("no input anything. default: only 1 track");
  }
  const tracks = input3 ? Number(input3) : 1;

  const input4 = prompt(
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

  console.log(
    `Add music: ${name} - ${author} ${tracks} tracks ${DB.getDovaUrl(id)}`,
    "\nloop:",
    `${loop.map((v, i) => `track ${i + 1} ${v ? "✓" : "✕"}`).join(", ")}`,
  );

  // 爬取素材信息违反dova的terms of use，因此手动输入信息

  DB.addDova(author, name, id, tracks, loop);

  if (is_loop_adding) {
    return Promise.resolve().then(() => add(true));
  }
}
