import * as YAML from "@std/yaml";
import { ensureDir, ensureFile, exists } from "@std/fs";

export interface DBStyle {
  dova: DovaStyle;
  pixabay: DefaultStyle[];
  incompetech: IncompetechStyle[];
}

export interface DovaStyle {
  // authors
  [author: string]: {
    // music id
    [id: string]: {
      name: string;
      url: string;
      tracks?: number;
      loop: boolean[];
    };
  };
}

export interface DefaultStyle {
  name: string;
  author: string;
  site: string;
  download_link: string;
}

export interface IncompetechStyle {
  name: string;
  // author: "Kevin MacLeod";
  site: string;
  download_link: string;
}

export class DB {
  private static _db_path = "./db.yaml";
  private static musics_dir = "music";

  private static data = (() => {
    ensureFile(this._db_path);
    const data = YAML.parse(
      Deno.readTextFileSync(this._db_path),
    );
    if (data) {
      return data;
    } else {
      return { dova: {}, pixabay: {}, incompetech: {} };
    }
  })() as DBStyle;
  public static save() {
    /**
     * ES6 规范明确：对象中非数字字符串 key 的插入顺序保留，纯数字的字符串会被自动排序
     * 相当于作者名称不排序，id 排序
     * 正好符合我意
     */
    Deno.writeTextFileSync(this._db_path, YAML.stringify(this.data));
  }

  private static music_save_dirs = {
    dova: "dova",
    pixabay: "pixabay",
    incompetech: "incompetech",
  };

  // dova
  private static dova_domains = [
    "dova4.heteml.net",
    "dova3.heteml.net",
    "dova2.heteml.net",
    "dova.heteml.net",
  ];
  public static getDovaUrl(id: string) {
    return `https://dova-s.jp/EN/bgm/play${id}.html`;
  }
  private static getDovaFilesName(
    id: string,
    tracks: number,
  ): string[] {
    const list: string[] = [`${id}.mp3`];
    if (tracks !== 1) {
      for (let i = 2; i <= tracks; i++) {
        list.push(`${id}_${i}.mp3`);
      }
    }
    return list;
  }
  public static addDova(
    author: string,
    name: string,
    id: string,
    tracks: number,
    loop: boolean[],
  ) {
    if (!this.data.dova[author]) {
      this.data.dova[author] = {};
    }
    if (this.data.dova[author][id]) {
      console.log(`Music ${name}:${id} has already existed!`);
      return;
    }
    this.data.dova[author][id] = {
      name: name,
      url: this.getDovaUrl(id),
      loop: loop,
    };
    if (tracks > 1 && Number.isInteger(tracks)) {
      this.data.dova[author][id].tracks = tracks;
    }

    this.save();
    console.log("Database's changes were saved");
  }

  public static async sync() {
    await ensureDir(this.musics_dir);

    // ensure all music dirs
    for (const element of Object.values(this.music_save_dirs)) {
      await ensureDir(`${this.musics_dir}/${element}`);
    }

    type DownloadDetail = [string, string];

    // dova music list
    const dova_music_list: DownloadDetail[] = Object
      .values(this.data.dova)
      .flatMap((songs) =>
        Object.entries(songs).flatMap(([id, { tracks }]) => {
          const paths = this.getDovaFilesName(id, tracks ? tracks : 1);
          return paths.map((path) =>
            [
              `/dova/mp3/${path}`,
              `${this.musics_dir}/${this.music_save_dirs.dova}/${path}`,
            ] as DownloadDetail
          );
        })
      );
    console.log("Dova music list:", dova_music_list);

    const pixabay_music_list: DownloadDetail[] = this.data.pixabay.map(
      (element) => {
        return [
          element.download_link,
          `${this.musics_dir}/${this.music_save_dirs.pixabay}/${element.name} - ${element.author}.mp3`,
        ];
      },
    );
    console.log("pixabay music list:", pixabay_music_list);

    const incompetech_music_list: DownloadDetail[] = this.data.incompetech
      .map(
        (element) => {
          return [
            element.download_link,
            `${this.musics_dir}/${this.music_save_dirs.incompetech}/${element.name}.mp3`,
          ];
        },
      );
    console.log("Incompetech music list:", incompetech_music_list);

    // dova music download promise
    const dova_download_promise_list = dova_music_list.map(async (
      [url_path, save_path],
    ) => {
      for (const domain of this.dova_domains) {
        const url = `https://${domain}${url_path}`;
        const shouldBreak = await this.download(url, save_path);
        if (shouldBreak) {
          break;
        }
      }
    });

    // others music download promise
    const other_download_promise_list: Promise<boolean>[] = [
      ...pixabay_music_list,
      ...incompetech_music_list,
    ].map(([url, save_path]: DownloadDetail) => this.download(url, save_path));

    // start download
    console.log("Start downloading");
    await Promise.all([
      ...dova_download_promise_list,
      ...other_download_promise_list,
    ]);
    console.log("\nSync Complete!");
  }

  private static async download(
    url: string,
    save_path: string,
  ): Promise<boolean> {
    if (await exists(save_path, { isFile: true })) {
      console.log(`File ${save_path} exist, skipping.`);
      return true;
    }

    const response = await fetch(url, {
      headers: {
        "Accept-Encoding": "br, gzip",
      },
    });
    if (response.ok) {
      const file = await Deno.open(save_path, {
        write: true,
        create: true,
      });
      await response.body?.pipeTo(file.writable);
      console.log(`Download: ${url} success!`);
      return true;
    } else {
      console.log(`Fail: ${response.statusText}`);
      return false;
    }
  }
}
