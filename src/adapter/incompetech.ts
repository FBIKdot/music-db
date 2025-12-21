import { Database } from "../database.ts";
import { Adapter } from "./index.ts";

export interface IncompetechStyle {
  name: string;
  site: string;
  download_link: string;
}

export class IncompetechAdapter extends Adapter {
  private constructor() {
    super();
  }
  public override PATH: string = "incompetech";

  public static override Instance = new IncompetechAdapter();

  private readonly DB = Database.get<IncompetechStyle[]>(this.PATH);

  /**
   * 添加乐曲
   */
  public add(isLoop: boolean = false) {
    do {
      const data: Partial<IncompetechStyle> = {};
      const keys: (keyof IncompetechStyle)[] = [
        "name",
        "site",
        "download_link",
      ];
      for (const key of keys) {
        const input: string | null = prompt(`${key}?> `);
        if (!input) {
          console.log("no input anything, stop adding.");
          return;
        }
        data[key as keyof IncompetechStyle] = input;
      }
      this.DB.push(data as IncompetechStyle);
    } while (isLoop);
  }

  /**
   * 注册默认适配器，用于返回一个空的下载任务获取器给下载管理器
   */
  public register() {
    return () =>
      this.DB.map((item) => ({
        filename: `${item.name}.mp3`,
        filepath: `incompetech`,
        url: item.download_link,
      }));
  }
}
