import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IAdminCreationAttr {
  admin_id: number | undefined;
  username: string | undefined;
  first_name: string | undefined;
  last_name: string | undefined;
  lang: string | undefined;

}

@Table({ tableName: "admin" })
export class Admin extends Model<Admin, IAdminCreationAttr> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
  })
  admin_id: number | undefined;

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
  lang: string | undefined;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue:true
  })
  status: boolean | undefined;
}
