import * as YAML from "@std/yaml";
import { ensureFileSync } from "@std/fs";

interface DBRoot {
  [key: string]: any;
}

/**
 * 资源数据库
 */
export class Database {
  public static readonly musics_dir = "music";

  private constructor() {}
  private static db: DBRoot;
  private static readonly _db_path = "./db.yaml";

  static {
    ensureFileSync(this._db_path);
    const data = YAML.parse(
      Deno.readTextFileSync(this._db_path),
    );
    if (data) {
      this.db = data;
    } else {
      this.db = {};
    }
  }
  /**
   * 保存数据
   */
  private static save() {
    /**
     * ES6 规范明确：对象中非数字字符串 key 的插入顺序保留，纯数字的字符串会被自动排序
     * 相当于作者名称不排序，id 排序，正好符合我意
     */
    Deno.writeTextFileSync(
      this._db_path,
      YAML.stringify(this.db, {
        // 不使用 >- 换行
        lineWidth: -1,
      }),
    );
  }

  /**
   * 获取数据对象
   */
  public static get<T>(dataType: string): T {
    // 确保数据类型存在
    if (!this.db[dataType]) {
      this.db[dataType] = {};
    }

    // 返回代理对象，用于自动保存
    return new Proxy(this.db[dataType], {
      set: (obj, prop, value) => {
        obj[prop] = value;
        // 自动保存
        this.save();
        return true;
      },
      deleteProperty: (obj, prop) => {
        const result = delete obj[prop];
        this.save();
        return result;
      },
    }) as T;
  }
}
