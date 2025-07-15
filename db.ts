import * as YAML from "@std/yaml";
export interface DBStyle {
  [key: string]: {
    [key: string]: {
      name: string;
      url: string;
    };
  };
}

export class DB {
  private static _db_path = "./db.yaml";
  private static data = (() => {
    const data = YAML.parse(
      Deno.readTextFileSync(this._db_path),
    );
    if (data) {
      return data;
    } else {
      return {};
    }
  })() as DBStyle;
  private static save() {
    Deno.writeTextFileSync(this._db_path, YAML.stringify(this.data));
  }

  public static getUrl(id: string) {
    return `https://dova-s.jp/EN/bgm/play${id}.html`;
  }
  public static add(author: string, name: string, id: string) {
    if (!this.data[author]) {
      this.data[author] = {};
      this.data[author][id] = { name: name, url: this.getUrl(id) };
    } else {
      this.data[author][id] = {
        name: name,
        url: this.getUrl(id),
      };
    }

    this.save();
  }
}
