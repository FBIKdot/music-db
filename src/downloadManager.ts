import { ensureDir, exists } from "@std/fs";
import { Database } from "./database.ts";
import { join } from "@std/path";

export interface DownloadTask {
  filename: string;
  filepath: string;
  url: string;
  retry?: DownloadTask;
}

/**
 * 下载任务获取器，用于返回下载任务数组
 */
export type DownloadTaskGetter = () => DownloadTask[];

export class DownloadManager {
  private constructor() {}
  private static tasks: DownloadTask[] = [];

  private static tasksGetters: DownloadTaskGetter[] = [];

  /**
   * 注册一个任务获取器，用于获取下载任务
   */
  public static use(...getters: DownloadTaskGetter[]) {
    this.tasksGetters.push(...getters);
  }

  /**
   * 下载一个任务
   */
  private static async download(task: DownloadTask): Promise<boolean> {
    const path = join(Database.musics_dir, task.filepath);
    const filepath = join(path, task.filename);

    if (await exists(filepath)) {
      console.log(`File ${task.filename} exist, skipping.`);
      return true;
    }
    let file: Deno.FsFile | null = null;
    try {
      const response = await fetch(task.url, {
        headers: { "Accept-Encoding": "br, gzip" },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      if (!response.body) {
        throw new Error("Response body is null");
      }
      // 确保目录存在
      await ensureDir(path);

      file = await Deno.open(filepath, {
        write: true,
        create: true,
        truncate: true,
      });

      // 使用 pipeline
      await response.body.pipeTo(file.writable);

      console.log(`Download: ${task.filename} success!`);
      return true;
    } catch (error) {
      console.error(`Download failed: ${task.filename}`, error);

      // 删除可能已创建的部分文件
      if (file) {
        file.close();
      }
      await Deno.remove(filepath);

      // 如果有重试任务，重试
      if (task.retry) {
        console.log(`Retrying with alternative URL: ${task.retry.url}`);
        return await this.download(task.retry);
      }
      return false;
    } finally {
      // 确保文件关闭
      if (file) {
        file.close();
      }
    }
  }

  /**
   * 开始下载所有任务
   */
  public static async start() {
    // 从所有获取器获取任务
    this.tasks = this.tasksGetters.flatMap((getter) => getter());

    // 开始下载任务
    await Promise.all(
      this.tasks.map((task) =>
        this.download(task).catch((e) => console.log(e))
      ),
    );
  }
}
