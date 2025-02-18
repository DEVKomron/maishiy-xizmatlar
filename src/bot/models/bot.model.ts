import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IBotCreationAttr {
  user_id: number | undefined;
  username: string | undefined;
  first_name: string | undefined;
  last_name: string | undefined;
  lang: string | undefined;

}

@Table({ tableName: "bot" })
export class Bot extends Model<Bot, IBotCreationAttr> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
  })
  user_id: number | undefined;

  @Column({
    type: DataType.STRING,
  })
  username: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  first_name: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  last_name: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  phone_number: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  lang: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  last_state: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  search_type: string | undefined;

  @Column({
    type: DataType.BOOLEAN,
  })
  status: boolean | undefined;
}
