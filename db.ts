import * as YAML from "@std/yaml";
import { ensureDir, ensureFile, exists } from "@std/fs";
export interface DBStyle {
  dova: {
    // authors
    [key: string]: {
      // music id
      [key: string]: {
        name: string;
        url: string;
        tracks?: number;
      };
    };
  };
}

export class DB {
  private static _db_path = "./db.yaml";
  private static music_dir = "music";

  private static data = (() => {
    ensureFile(this._db_path);
    const data = YAML.parse(
      Deno.readTextFileSync(this._db_path),
    );
    if (data) {
      return data;
    } else {
      return { dova: {} };
    }
  })() as DBStyle;
  private static save() {
    Deno.writeTextFileSync(this._db_path, YAML.stringify(this.data));
  }

  // dova
  private static dova_music_dir = "dova";
  private static dova_domains = [
    "dova4.heteml.net",
    "dova3.heteml.net",
    "dova2.heteml.net",
    "dova.heteml.net",
  ];
  public static getDovaUrl(id: string) {
    return `https://dova-s.jp/EN/bgm/play${id}.html`;
  }
  private static getDovaDownloadFilePath(id: string, tracks: number): string[] {
    const list: string[] = [`/dova/mp3/${id}.mp3`];
    if (tracks !== 1) {
      for (let i = 2; i <= tracks; i++) {
        list.push(`/dova/mp3/${id}_${i}.mp3`);
      }
    }
    return list;
  }
  public static addDova(
    author: string,
    name: string,
    id: string,
    tracks: number,
  ) {
    if (!this.data.dova[author]) {
      this.data.dova[author] = {};
    }
    if (this.data.dova[author][id]) {
      console.log(`Music ${name}:${id} exist`);
      return;
    }
    this.data.dova[author][id] = {
      name: name,
      url: this.getDovaUrl(id),
    };
    if (tracks > 1 && Number.isInteger(tracks)) {
      this.data.dova[author][id].tracks = tracks;
    }

    this.save();
  }

  // TODO: add incompetech (https://incompetech.com/music/royalty-free/music.html)

  public static async sync() {
    await ensureDir(this.music_dir);
    await ensureDir(`${this.music_dir}/${this.dova_music_dir}`);
    const dova_music_list: [string, string][] = Object
      .values(this.data.dova)
      .flatMap((songs) =>
        Object.entries(songs).flatMap(([id, { tracks }]) => {
          const paths = this.getDovaDownloadFilePath(id, tracks ? tracks : 1);
          return paths.map((path) => [id, path] as [string, string]);
        })
      );
    console.log(dova_music_list);
    // TODO: 支持并发
    for (const [id, url_path] of dova_music_list) {
      const file_path = `${this.music_dir}/${this.dova_music_dir}/${id}.mp3`;
      if (await exists(file_path, { isFile: true })) {
        console.log(`File ${file_path} exist, skipping.`);
        continue;
      }
      for (const domain of this.dova_domains) {
        const url = `https://${domain}${url_path}`;
        console.log(`Download: ${url} ...`);

        const response = await fetch(url, {
          headers: {
            "Accept-Encoding": "br, gzip",
          },
        });
        if (response.ok) {
          const file = await Deno.open(file_path, {
            write: true,
            create: true,
          });
          await response.body?.pipeTo(file.writable);
          console.log(`Success.`);
          break;
        } else {
          console.log(`Fail: ${response.statusText}`);
        }
      }
    }
  }
}
