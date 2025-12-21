import { Database } from "../database.ts";
import { DefaultAdapter, DefaultStyle } from "./default.ts";

export class FreeMusicArchiveAdapter extends DefaultAdapter {
  private constructor() {
    super();
    this.DB = Database.get<DefaultStyle[]>(this.PATH);
  }

  public override readonly PATH: string = "freemusicarchive";

  protected override readonly DB: DefaultStyle[];

  public static override Instance: FreeMusicArchiveAdapter;
  static {
    FreeMusicArchiveAdapter.Instance = new FreeMusicArchiveAdapter();
  }
}
