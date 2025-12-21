import { DownloadTaskGetter } from "../downloadManager.ts";
export abstract class Adapter {
  public abstract readonly PATH: string;
  /**
   * 单例模式
   */
  public static Instance: Adapter;
  /**
   * 注册适配器，用于返回一个下载任务获取器给下载管理器
   */
  public abstract register(): DownloadTaskGetter;
}
