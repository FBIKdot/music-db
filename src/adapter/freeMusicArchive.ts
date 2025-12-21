import { Database } from "../database.ts";
import { DefaultAdapter, DefaultStyle } from "./default.ts";

export class FreeMusicArchiveAdapter extends DefaultAdapter {
  private constructor() {
    super();
  }

  public override readonly PATH: string = "freemusicarchive";

  protected override readonly DB = Database.get<DefaultStyle[]>(this.PATH);

  public static override Instance = new FreeMusicArchiveAdapter();
}
