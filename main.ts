import { DB } from "./db.ts";

if (import.meta.main) {
  while (true) {
    console.log("Commands: add / add not dova(WIP) / view(WIP) / sync / exit");
    const input: string | null = prompt(">");
    switch (input) {
      case null:
      case "exit":
        console.log("Program exit.");
        Deno.exit();
        break;
      case "add":
        add();
        break;
      case "sync":
        await DB.sync();
        break;
      case "add not dova":
      case "view":
        console.log("WIP");
        break;
      default:
        console.log("Unknow command.");
        break;
    }
  }
}
function add() {
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

  const input3 = prompt("how many tracks>");
  if (!input3) {
    console.log("no input anything. default: only 1 track");
  }
  const tracks = input3 ? Number(input3) : 1;
  const id: string = input2;
  console.log(
    `Add music: ${name} - ${author} ${tracks} tracks ${DB.getDovaUrl(id)}`,
  );
  DB.addDova(author, name, id, tracks);
  return;
}
