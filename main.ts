import { DB } from "./db.ts";

if (import.meta.main) {
  while (true) {
    console.log("Commands: add / add-loop / sync / exit");
    const input: string | null = prompt(">");
    switch (input) {
      case null:
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
      // TODO: 添加除了dova之外的music
      default:
        console.log("Unknow command.");
        break;
    }
  }
}
async function add(loop: boolean = false): Promise<void> {
  if (loop) {
    console.log(
      "Loop adding until you input nothing when asking you for name, author or id",
    );
  }

  console.log("Add dova music:");
  const input = prompt("[name] composed by [Author]>");
  if (!input) {
    console.log("no input anything");
    return Promise.resolve();
  }

  const [name, author] = input.split(" composed by ");
  const input2 = prompt("music id>");
  if (!input2) {
    console.log("no input anything");
    return Promise.resolve();
  }

  const input3 = prompt("how many tracks>");
  if (!input3) {
    console.log("no input anything. default: only 1 track");
  }
  const input4 = prompt("loop?(y)>");
  if (input4 !== "y") {
    console.log("input not 'y', default don't loop");
  }
  const tracks = input3 ? Number(input3) : 1;
  const id: string = input2;
  console.log(
    `Add music: ${name} - ${author} ${tracks} tracks ${DB.getDovaUrl(id)}`,
  );
  // TODO: dova看起来不怎么变，也许可以爬取一些补充信息
  DB.addDova(author, name, id, tracks, input4 === "y");
  console.log("Database's changes were saved");
  if (loop) {
    return Promise.resolve().then(() => add(true));
  }
}
