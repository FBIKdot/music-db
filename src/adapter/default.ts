import { Database } from "../database.ts";
import { Adapter } from "./index.ts";

export interface DefaultStyle {
  name: string;
  author: string;
  site: string;
  download_link: string;
}

export class DefaultAdapter extends Adapter {
  protected constructor() {
    super();
  }

  public override readonly PATH: string = "default";

  public static override Instance: DefaultAdapter;
  static {
    DefaultAdapter.Instance = new DefaultAdapter();
  }

  protected readonly DB = Database.get<DefaultStyle[]>(this.PATH);

  /**
   * 添加乐曲
   */
  public add(isLoop: boolean = false) {
    do {
      const data: Partial<DefaultStyle> = {
        site: undefined,
        author: undefined,
        name: undefined,
        download_link: undefined,
      };
      for (const key of Object.keys(data)) {
        const input: string | null = prompt(`${key}?> `);
        if (!input) {
          console.log("no input anything, stop adding.");
          return;
        }
        data[key as keyof DefaultStyle] = input;
      }
      this.DB.push(data as DefaultStyle);
    } while (isLoop);
  }

  /**
   * 注册默认适配器，用于返回一个空的下载任务获取器给下载管理器
   */
  public register() {
    return () =>
      this.DB.map((item) => ({
        filename: `${item.name} - ${item.author}.mp3`,
        filepath: this.PATH,
        url: item.download_link,
      }));
  }
}
