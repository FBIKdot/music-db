import { Database } from "../database.ts";
import { DefaultAdapter, DefaultStyle } from "./default.ts";

export class PixabayAdapter extends DefaultAdapter {
  private constructor() {
    super();
  }

  public override readonly PATH: string = "pixabay";

  protected override readonly DB = Database.get<DefaultStyle[]>(this.PATH);

  public static override Instance: PixabayAdapter;
  static {
    PixabayAdapter.Instance = new PixabayAdapter();
  }
}
